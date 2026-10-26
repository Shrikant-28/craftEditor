import { describe, it, expect } from 'vitest';
import {
  cleanTranscript,
  splitIntoSentences,
  extractAttendees,
  extractDecisions,
  extractTopics,
  summarizeMeeting,
  extractActionItems,
  generateFollowUpPlan,
  formatMeetingNotesMarkdown,
  runMeetingPipeline,
} from '../utils/meetingPipeline';

const SAMPLE_TRANSCRIPT = `
Sarah: Thanks for joining today's sprint sync. Our primary goal is aligning on the v1.2 release.
Alex: I completed the ACID local database persistence layer with SQLite.
Sarah: Excellent. We decided that SQLite will remain our primary local store.
Alex: I will optimize the audio waveform rendering by Friday.
Sarah: John is assigned to review the dark and light mode switcher on Windows by Monday. This is critical.
Alex: Should we support custom color themes in the next iteration?
Sarah: Action item: Sarah will draft the v1.2 release documentation by next Wednesday.
Alex: Agreed. Let's reconvene next week to review deliverable progress.
`;

describe('Meeting Notes Pipeline: Local STT + Summarizer', () => {
  it('cleans transcript and removes conversational filler words', () => {
    const raw = 'Um, we basically decided, you know, to deploy the database, like, today.';
    const cleaned = cleanTranscript(raw);
    expect(cleaned).not.toContain('um');
    expect(cleaned).not.toContain('you know');
    expect(cleaned).toContain('decided');
  });

  it('splits text into semantic sentences accurately', () => {
    const sentences = splitIntoSentences(SAMPLE_TRANSCRIPT);
    expect(sentences.length).toBeGreaterThanOrEqual(4);
    expect(sentences.some((s) => s.includes('SQLite'))).toBe(true);
  });

  it('extracts participant names and attendees', () => {
    const attendees = extractAttendees(SAMPLE_TRANSCRIPT);
    expect(attendees).toContain('Sarah');
    expect(attendees).toContain('Alex');
  });

  it('extracts key decisions with decision indicator detection', () => {
    const sentences = splitIntoSentences(SAMPLE_TRANSCRIPT);
    const decisions = extractDecisions(sentences);
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.some((d) => d.toLowerCase().includes('sqlite') || d.toLowerCase().includes('decided'))).toBe(true);
  });

  it('extracts topics categorized by domain', () => {
    const sentences = splitIntoSentences(SAMPLE_TRANSCRIPT);
    const topics = extractTopics(sentences);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.some((t) => t.topic.includes('Architecture') || t.topic.includes('Product'))).toBe(true);
  });

  it('extracts action items with assignees, priorities, and deadlines', () => {
    const items = extractActionItems(SAMPLE_TRANSCRIPT);
    expect(items.length).toBeGreaterThanOrEqual(2);

    // Verify Alex's action item by Friday
    const alexItem = items.find((i) => i.assignee === 'Alex' || i.task.toLowerCase().includes('waveform'));
    expect(alexItem).toBeDefined();
    expect(alexItem?.dueDate?.toLowerCase()).toContain('friday');

    // Verify critical priority detection for John
    const johnItem = items.find((i) => i.task.toLowerCase().includes('dark and light mode') || i.task.toLowerCase().includes('switcher'));
    expect(johnItem).toBeDefined();
    expect(johnItem?.priority).toBe('High');
  });

  it('generates a professional follow-up plan and email draft', () => {
    const summary = summarizeMeeting(SAMPLE_TRANSCRIPT);
    const actionItems = extractActionItems(SAMPLE_TRANSCRIPT);
    const followUp = generateFollowUpPlan(summary, actionItems, SAMPLE_TRANSCRIPT);

    expect(followUp.emailSubject).toContain('Meeting Recap');
    expect(followUp.emailBody).toContain('Executive Summary:');
    expect(followUp.emailBody).toContain('Action Items:');
    expect(followUp.nextMeetingAgenda.length).toBeGreaterThan(0);
    expect(followUp.openQuestions.length).toBeGreaterThan(0);
  });

  it('formats full markdown with interactive task lists and executive summary', () => {
    const summary = summarizeMeeting(SAMPLE_TRANSCRIPT);
    const actionItems = extractActionItems(SAMPLE_TRANSCRIPT);
    const followUp = generateFollowUpPlan(summary, actionItems, SAMPLE_TRANSCRIPT);
    const markdown = formatMeetingNotesMarkdown(summary, actionItems, followUp, SAMPLE_TRANSCRIPT);

    expect(markdown).toContain('# 🎙️ Meeting Notes:');
    expect(markdown).toContain('## 📌 Executive Summary');
    expect(markdown).toContain('## 🤝 Key Decisions');
    expect(markdown).toContain('## 📋 Action Items & Deliverables');
    expect(markdown).toContain('- [ ]');
    expect(markdown).toContain('## ✉️ Follow-up Email Draft');
  });

  it('executes complete 4-stage pipeline end-to-end via runMeetingPipeline', () => {
    const result = runMeetingPipeline(SAMPLE_TRANSCRIPT);

    expect(result.summary.title).toBeTruthy();
    expect(result.summary.executiveSummary).toBeTruthy();
    expect(result.summary.keyDecisions.length).toBeGreaterThan(0);
    expect(result.actionItems.length).toBeGreaterThan(0);
    expect(result.followUp.emailSubject).toBeTruthy();
    expect(result.fullMarkdown).toContain('Executive Summary');
  });
});
