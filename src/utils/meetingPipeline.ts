/**
 * Meeting Notes Pipeline Engine (100% Local & Offline)
 * Stages: Transcribe → Summarize → Extract Actions → Suggest Follow-up
 */

export interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate?: string;
  completed: boolean;
}

export interface MeetingSummary {
  title: string;
  executiveSummary: string;
  keyDecisions: string[];
  keyTopics: { topic: string; details: string[] }[];
  attendees: string[];
  date: string;
  estimatedDuration?: string;
}

export interface FollowUpPlan {
  emailSubject: string;
  emailBody: string;
  nextMeetingAgenda: string[];
  openQuestions: string[];
  suggestedTimeline: string;
}

export interface MeetingPipelineResult {
  rawTranscript: string;
  summary: MeetingSummary;
  actionItems: ActionItem[];
  followUp: FollowUpPlan;
  fullMarkdown: string;
  timestamp: string;
}

// Common filler words to clean out for high-quality summarization
const FILLER_WORDS_REGEX = /\b(um|uh|erm|er|like|you know|sort of|kind of|basically|actually|literally|i mean|right\?)\b/gi;

/**
 * Clean and normalize transcript text
 */
export function cleanTranscript(text: string): string {
  if (!text) return '';
  return text
    .replace(FILLER_WORDS_REGEX, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Split text into semantic sentences
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  // Split on punctuation followed by space or newline, while preserving speaker headers like "John:"
  const raw = text.split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/);
  return raw
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

/**
 * Extract potential attendee names from transcript
 */
export function extractAttendees(text: string): string[] {
  const attendees = new Set<string>();

  // Look for speaker patterns e.g. "Sarah:", "Bob:", "[John Doe]"
  const speakerRegex = /(?:^|\n)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*:/g;
  let match;
  while ((match = speakerRegex.exec(text)) !== null) {
    if (match[1] && !['Note', 'Summary', 'Action', 'Agenda', 'Topic'].includes(match[1])) {
      attendees.add(match[1].trim());
    }
  }

  // Look for @mentions e.g. @Sarah, @alex
  const mentionRegex = /@([A-Z][a-z]+|[a-z]+)/g;
  while ((match = mentionRegex.exec(text)) !== null) {
    const capitalized = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    attendees.add(capitalized);
  }

  // Look for standard name indicators e.g. "Thanks to Sarah and Mike", "Sarah agreed"
  const thankedRegex = /\b(thanks to|with|and|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
  while ((match = thankedRegex.exec(text)) !== null) {
    if (match[2] && match[2].length > 2 && !['Everyone', 'All', 'Team', 'Friday', 'Monday'].includes(match[2])) {
      attendees.add(match[2].trim());
    }
  }

  return Array.from(attendees);
}

/**
 * Extract key decisions from transcript sentences
 */
export function extractDecisions(sentences: string[]): string[] {
  const decisionIndicators = [
    /\b(decided|agreed|concluded|approved|confirmed|settled on|resolution|we will go with|the plan is to|consensus)\b/i,
    /\b(decision\s*:|we agreed that|we've decided to|final decision)\b/i,
    /\b(we are going to proceed with|chosen to|selected)\b/i,
  ];

  const decisions: string[] = [];
  for (const sentence of sentences) {
    for (const indicator of decisionIndicators) {
      if (indicator.test(sentence)) {
        // Clean up prefix labels
        let cleaned = sentence
          .replace(/^(decision|agreed|resolution):\s*/i, '')
          .trim();
        if (cleaned && !decisions.some((d) => d.toLowerCase() === cleaned.toLowerCase())) {
          decisions.push(cleaned);
        }
        break;
      }
    }
  }

  // Default fallback if no explicit decision keywords found
  if (decisions.length === 0 && sentences.length > 0) {
    // Pick the most impactful affirmative sentence
    const candidate = sentences.find((s) => /\b(will|must|should|agreed|launch|deploy|complete)\b/i.test(s));
    if (candidate) {
      decisions.push(`Agreed direction: ${candidate}`);
    }
  }

  return decisions.slice(0, 5);
}

/**
 * Categorize discussion by topics
 */
export function extractTopics(sentences: string[]): { topic: string; details: string[] }[] {
  const topicCategories: Record<string, { regex: RegExp; items: string[] }> = {
    'Architecture & Tech': {
      regex: /\b(architecture|api|database|sqlite|backend|frontend|performance|server|code|bug|cache|sync|electron|wasm)\b/i,
      items: [],
    },
    'Product & Features': {
      regex: /\b(feature|user|design|ui|ux|screen|button|modal|search|dictat|voice|player|note|editor|theme)\b/i,
      items: [],
    },
    'Roadmap & Timeline': {
      regex: /\b(timeline|deadline|release|milestone|schedule|sprint|launch|q[1-4]|friday|tomorrow|next week|eta)\b/i,
      items: [],
    },
    'Operations & Quality': {
      regex: /\b(test|qa|verify|deploy|security|cost|budget|risk|feedback|support|documentation|docs)\b/i,
      items: [],
    },
  };

  for (const s of sentences) {
    let matched = false;
    for (const cat of Object.values(topicCategories)) {
      if (cat.regex.test(s)) {
        if (cat.items.length < 4 && !cat.items.includes(s)) {
          cat.items.push(s);
          matched = true;
          break;
        }
      }
    }
    // If not matched to pre-defined categories, collect in General Highlights
    if (!matched && topicCategories['Product & Features'].items.length < 3) {
      topicCategories['Product & Features'].items.push(s);
    }
  }

  const result: { topic: string; details: string[] }[] = [];
  for (const [name, cat] of Object.entries(topicCategories)) {
    if (cat.items.length > 0) {
      result.push({ topic: name, details: cat.items });
    }
  }

  if (result.length === 0 && sentences.length > 0) {
    result.push({
      topic: 'Key Highlights',
      details: sentences.slice(0, 4),
    });
  }

  return result;
}

/**
 * Generate meeting title from content
 */
export function generateMeetingTitle(text: string, topics: { topic: string; details: string[] }[]): string {
  // Look for title or agenda mentions
  const titleMatch = text.match(/(?:meeting|sync|discussion|agenda|standup|review)\s*(?:on|about|for)?\s*:?\s*([A-Za-z0-9\s-]{4,40})/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }

  if (topics.length > 0 && topics[0].details.length > 0) {
    const firstDetail = topics[0].details[0];
    const words = firstDetail.split(' ').slice(0, 5).join(' ');
    return `${topics[0].topic}: ${words}...`;
  }

  return 'Meeting Notes';
}

/**
 * Local Extractive Summarizer
 */
export function summarizeMeeting(transcript: string): MeetingSummary {
  const cleaned = cleanTranscript(transcript);
  const sentences = splitIntoSentences(cleaned);
  const attendees = extractAttendees(transcript);
  const keyDecisions = extractDecisions(sentences);
  const keyTopics = extractTopics(sentences);
  const title = generateMeetingTitle(cleaned, keyTopics);

  // Compute executive summary from most salient sentences
  let executiveSummary = '';
  if (sentences.length <= 3) {
    executiveSummary = sentences.join(' ');
  } else {
    // Score sentences by word frequency and salience markers
    const scored = sentences.map((s, idx) => {
      let score = 0;
      // Position bias (earlier & conclusion sentences carry more summary weight)
      if (idx === 0) score += 3;
      if (idx === 1) score += 2;
      if (idx === sentences.length - 1) score += 2;

      // Keyword weights
      if (/\b(goal|objective|aim|decided|summary|agreed|focus|key|crucial|shipped|launch)\b/i.test(s)) score += 3;
      if (/\b(will|plan|next steps|strategy|results)\b/i.test(s)) score += 2;
      if (s.length > 30 && s.length < 180) score += 1;

      return { sentence: s, score, idx };
    });

    scored.sort((a, b) => b.score - a.score);
    const topSentences = scored.slice(0, 3).sort((a, b) => a.idx - b.idx);
    executiveSummary = topSentences.map((t) => t.sentence).join(' ');
  }

  if (!executiveSummary) {
    executiveSummary = 'The team reviewed ongoing initiatives, established strategic priorities, and agreed on actionable deliverables for the upcoming milestone.';
  }

  // Estimate duration based on word count (~130 words per minute average speech)
  const wordCount = cleaned.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(wordCount / 130));
  const estimatedDuration = `${minutes} min${minutes > 1 ? 's' : ''}`;

  return {
    title,
    executiveSummary,
    keyDecisions,
    keyTopics,
    attendees,
    date: new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    estimatedDuration,
  };
}

/**
 * Extract Action Items with Assignee, Priority, and Due Date
 */
export function extractActionItems(transcript: string): ActionItem[] {
  const cleaned = cleanTranscript(transcript);
  const sentences = splitIntoSentences(cleaned);
  const items: ActionItem[] = [];

  const actionVerbs = /\b(will|need to|needs to|must|should|is going to|to create|to build|to update|to review|to send|to prepare|to fix|to verify|to deploy|to test|to finish)\b/i;
  const priorityHigh = /\b(urgent|critical|blocker|asap|high priority|today|immediately|p0)\b/i;
  const priorityLow = /\b(eventually|low priority|nice to have|optional|backlog|when possible|p2|p3)\b/i;

  const dueDateRegex = /\b(by\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|tonight|EOD|end of week|next week|end of month|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+|\d{1,2}\/\d{1,2})|due:?\s*[A-Za-z0-9\s]+)\b/i;
  const assigneeRegex = /\b([A-Z][a-z]+)\s+(?:will|to|needs to|must|is going to|should)\b/;

  let counter = 1;

  for (let idx = 0; idx < sentences.length; idx++) {
    const sentence = sentences[idx];
    if (actionVerbs.test(sentence) || /\b(action item|todo|assigned to)\b/i.test(sentence)) {
      // Determine priority (including adjacent urgency sentences like "This is critical.")
      let priority: 'High' | 'Medium' | 'Low' = 'Medium';
      if (priorityHigh.test(sentence)) {
        priority = 'High';
      } else if (idx < sentences.length - 1 && priorityHigh.test(sentences[idx + 1])) {
        priority = 'High';
      } else if (priorityLow.test(sentence)) {
        priority = 'Low';
      }

      // Determine due date
      const dueMatch = sentence.match(dueDateRegex);
      const dueDate = dueMatch ? dueMatch[0].trim() : undefined;

      // Determine assignee
      let assignee: string | undefined;
      const mentionMatch = sentence.match(/@([A-Z][a-z]+|[a-z]+)/);
      if (mentionMatch) {
        assignee = mentionMatch[1].charAt(0).toUpperCase() + mentionMatch[1].slice(1);
      } else {
        const nameMatch = sentence.match(assigneeRegex);
        if (nameMatch && !['We', 'The', 'Team', 'Everyone', 'It', 'This', 'That'].includes(nameMatch[1])) {
          assignee = nameMatch[1];
        }
      }

      // Clean task description
      let task = sentence
        .replace(/^(action item|todo|task):\s*/i, '')
        .replace(/^(we need to|let's|i will|i'll)\s+/i, '')
        .trim();

      // Ensure first character is uppercase
      task = task.charAt(0).toUpperCase() + task.slice(1);

      items.push({
        id: `action-${Date.now()}-${counter++}`,
        task,
        assignee,
        priority,
        dueDate,
        completed: false,
      });
    }
  }

  // No action items injected if none detected

  return items;
}

/**
 * Generate Follow-up Plan, Email Draft, and Next Agenda
 */
export function generateFollowUpPlan(
  summary: MeetingSummary,
  actionItems: ActionItem[],
  transcript: string
): FollowUpPlan {
  const sentences = splitIntoSentences(transcript);

  // Extract open questions / unresolved topics
  const openQuestions: string[] = [];
  for (const s of sentences) {
    if (s.includes('?') || /\b(unclear|tbd|to be determined|verify whether|question|investigate if)\b/i.test(s)) {
      const cleanQ = s.replace(/^[0-9.-]+\s*/, '').trim();
      if (cleanQ.length > 10 && !openQuestions.includes(cleanQ)) {
        openQuestions.push(cleanQ);
      }
    }
  }

  // No mock questions injected

  // Construct Next Meeting Agenda dynamically based on actual findings
  const nextMeetingAgenda: string[] = [];
  if (actionItems.length > 0) {
    nextMeetingAgenda.push('Review completion status of assigned action items');
  }
  if (summary.keyTopics.length > 0 && summary.keyTopics[0]?.topic) {
    nextMeetingAgenda.push(`Deep-dive discussion on ${summary.keyTopics[0].topic}`);
  }
  if (openQuestions.length > 0) {
    nextMeetingAgenda.push('Address open questions & resolve dependency blockers');
  }
  if (nextMeetingAgenda.length === 0) {
    nextMeetingAgenda.push('Follow-up review on progress and next milestones');
  }

  // Construct Email Subject & Body
  const emailSubject = `Meeting Recap & Action Items: ${summary.title} (${summary.date})`;

  const actionItemsList = actionItems
    .map(
      (a) =>
        `• [ ] ${a.task} — ${a.assignee ? `Assigned to @${a.assignee}` : 'Team'} (Priority: ${a.priority}${
          a.dueDate ? `, ${a.dueDate}` : ''
        })`
    )
    .join('\n');

  const decisionsList = summary.keyDecisions.map((d) => `• ${d}`).join('\n');

  const emailBody = `Hi Team,

Thank you for your active participation in today's sync. Below is our executive recap, key decisions, and assigned action items.

📌 Executive Summary:
${summary.executiveSummary}

🤝 Key Decisions:
${decisionsList}

📋 Action Items:
${actionItemsList}

🗓️ Next Sync:
We will reconvene next week to review these deliverables. Please let me know if you have any questions or blockers.

Best regards,
Meeting Lead`;

  return {
    emailSubject,
    emailBody,
    nextMeetingAgenda,
    openQuestions: openQuestions.slice(0, 4),
    suggestedTimeline: 'Follow-up sync recommended in 1 week',
  };
}

/**
 * Format complete Meeting Pipeline Output into Markdown
 */
export function formatMeetingNotesMarkdown(
  summary: MeetingSummary,
  actionItems: ActionItem[],
  followUp: FollowUpPlan,
  rawTranscript?: string
): string {
  const attendeesStr = summary.attendees.length > 0 ? summary.attendees.join(', ') : 'Meeting Attendees';

  let md = `# 🎙️ Meeting Notes: ${summary.title}\n\n`;
  md += `> **Date:** ${summary.date} | **Duration:** ${summary.estimatedDuration || '15 mins'} | **Participants:** ${attendeesStr}\n\n`;

  md += `## 📌 Executive Summary\n${summary.executiveSummary}\n\n`;

  if (summary.keyDecisions.length > 0) {
    md += `## 🤝 Key Decisions\n`;
    for (const decision of summary.keyDecisions) {
      md += `- ✅ **Decision:** ${decision}\n`;
    }
    md += '\n';
  }

  md += `## 📋 Action Items & Deliverables\n`;
  for (const item of actionItems) {
    const assigneeTag = item.assignee ? `(@${item.assignee})` : '*(Unassigned)*';
    const dueTag = item.dueDate ? `— *${item.dueDate}*` : '';
    const priorityBadge = `\`[${item.priority}]\``;
    md += `- [ ] **${item.task}** ${assigneeTag} ${dueTag} ${priorityBadge}\n`;
  }
  md += '\n';

  md += `## 💬 Discussion Highlights by Topic\n`;
  for (const topic of summary.keyTopics) {
    md += `### ${topic.topic}\n`;
    for (const detail of topic.details) {
      md += `- ${detail}\n`;
    }
    md += '\n';
  }

  if (followUp.openQuestions.length > 0) {
    md += `## ❓ Open Questions & Risks\n`;
    for (const q of followUp.openQuestions) {
      md += `- ❓ ${q}\n`;
    }
    md += '\n';
  }

  md += `## 🗓️ Next Meeting Agenda\n`;
  for (const agenda of followUp.nextMeetingAgenda) {
    md += `1. ${agenda}\n`;
  }
  md += '\n';

  md += `## ✉️ Follow-up Email Draft\n`;
  md += `\`\`\`text\nSubject: ${followUp.emailSubject}\n\n${followUp.emailBody}\n\`\`\`\n\n`;

  if (rawTranscript && rawTranscript.trim().length > 0) {
    md += `## 📝 Raw Meeting Transcript\n`;
    md += `> ${rawTranscript.trim().replace(/\n/g, '\n> ')}\n`;
  }

  return md;
}

/**
 * Execute the entire 4-stage Meeting Pipeline
 */
export function runMeetingPipeline(rawTranscript: string): MeetingPipelineResult {
  const summary = summarizeMeeting(rawTranscript);
  const actionItems = extractActionItems(rawTranscript);
  const followUp = generateFollowUpPlan(summary, actionItems, rawTranscript);
  const fullMarkdown = formatMeetingNotesMarkdown(summary, actionItems, followUp, rawTranscript);

  return {
    rawTranscript,
    summary,
    actionItems,
    followUp,
    fullMarkdown,
    timestamp: new Date().toISOString(),
  };
}
