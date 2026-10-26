import { Note, SearchFilter, SearchMatch } from '../types/note';

/**
 * Escapes regex special characters in a query token
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses search query string into structured terms and operators:
 * Example: `tag:architecture is:pinned "database schema" query`
 */
export function parseSearchQuery(rawQuery: string): {
  terms: string[];
  exactPhrases: string[];
  tags: string[];
  categories: string[];
  onlyPinned: boolean;
  onlyVoice: boolean;
} {
  const exactPhrases: string[] = [];
  let remaining = rawQuery;

  // Extract exact phrases wrapped in double quotes
  const quoteRegex = /"([^"]+)"/g;
  let quoteMatch;
  while ((quoteMatch = quoteRegex.exec(rawQuery)) !== null) {
    if (quoteMatch[1].trim()) {
      exactPhrases.push(quoteMatch[1].trim().toLowerCase());
    }
  }
  remaining = remaining.replace(quoteRegex, ' ');

  const tokens = remaining.split(/\s+/).filter(Boolean);
  const terms: string[] = [];
  const tags: string[] = [];
  const categories: string[] = [];
  let onlyPinned = false;
  let onlyVoice = false;

  for (let i = 0; i < tokens.length; i++) {
    const lower = tokens[i].toLowerCase();
    if (lower.startsWith('tag:') || lower.startsWith('#')) {
      const tag = lower.replace(/^tag:|^#/, '').trim();
      if (tag) tags.push(tag);
    } else if (lower.startsWith('category:') || lower.startsWith('cat:')) {
      const cat = lower.replace(/^category:|^cat:/, '').trim();
      if (cat) categories.push(cat);
    } else if (lower === 'is:pinned' || lower === 'pinned:true') {
      onlyPinned = true;
    } else if (lower === 'is:voice' || lower === 'has:voice' || lower === 'voice:true' || lower === 'type:voice') {
      onlyVoice = true;
    } else {
      terms.push(lower);
    }
  }

  return { terms, exactPhrases, tags, categories, onlyPinned, onlyVoice };
}

/**
 * Highlights matches in text using HTML <mark> tags with a precompiled regex to avoid re-compilation
 */
export function highlightText(text: string, searchTokensOrPattern: string[] | RegExp | null): string {
  if (!text) return '';
  if (!searchTokensOrPattern) return text;

  let pattern: RegExp;
  if (searchTokensOrPattern instanceof RegExp) {
    pattern = searchTokensOrPattern;
  } else {
    const validTokens = searchTokensOrPattern.filter((t) => t.length > 0);
    if (validTokens.length === 0) return text;
    try {
      pattern = new RegExp(`(${validTokens.map(escapeRegExp).join('|')})`, 'gi');
    } catch {
      return text;
    }
  }

  try {
    return text.replace(pattern, '<mark class="search-highlight">$1</mark>');
  } catch {
    return text;
  }
}

/**
 * Extracts a relevant contextual snippet around the first matched term
 */
export function extractSnippet(content: string, searchTokens: string[], maxLength = 140): string {
  if (!content) return '';
  if (searchTokens.length === 0) {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  }

  const lowerContent = content.toLowerCase();
  let firstIndex = -1;

  for (let i = 0; i < searchTokens.length; i++) {
    const idx = lowerContent.indexOf(searchTokens[i].toLowerCase());
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  }

  const start = Math.max(0, firstIndex - 30);
  const end = Math.min(content.length, start + maxLength);
  let snippet = content.slice(start, end).trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Executes multi-dimensional scored search across notes collection
 * Optimized for minimal heap allocations and zero-garbage sorting.
 */
export function executeSearch(notes: Note[], filter: SearchFilter): { matches: SearchMatch[]; durationMs: number } {
  const startTime = performance.now();
  const { query, tag: activeTag, category: activeCategory, onlyPinned: filterPinned, onlyVoice: filterVoice } = filter;

  const parsed = parseSearchQuery(query || '');
  if (activeTag && !parsed.tags.includes(activeTag.toLowerCase())) {
    parsed.tags.push(activeTag.toLowerCase());
  }
  if (activeCategory && !parsed.categories.includes(activeCategory.toLowerCase())) {
    parsed.categories.push(activeCategory.toLowerCase());
  }
  if (filterPinned) {
    parsed.onlyPinned = true;
  }
  if (filterVoice) {
    parsed.onlyVoice = true;
  }

  const allTokens = [...parsed.terms, ...parsed.exactPhrases];
  const hasActiveQuery =
    allTokens.length > 0 ||
    parsed.tags.length > 0 ||
    parsed.categories.length > 0 ||
    parsed.onlyPinned ||
    parsed.onlyVoice;

  if (!hasActiveQuery) {
    // Return all notes sorted by pinned then updatedAt (using zero-allocation Date.parse)
    const defaultMatches: SearchMatch[] = [...notes]
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      })
      .map((note) => ({
        note,
        score: 0,
        highlightedTitle: note.title,
        highlightedSnippet: extractSnippet(note.content, []),
        matchedTags: [],
        matchedVoice: false,
      }));

    return { matches: defaultMatches, durationMs: performance.now() - startTime };
  }

  // Precompile pattern once for all notes rather than compiling inside loop
  const validTokens = allTokens.filter((t) => t.length > 0);
  let highlightPattern: RegExp | null = null;
  if (validTokens.length > 0) {
    try {
      highlightPattern = new RegExp(`(${validTokens.map(escapeRegExp).join('|')})`, 'gi');
    } catch {}
  }

  const results: SearchMatch[] = [];
  const nowMs = Date.now();

  for (let nIdx = 0; nIdx < notes.length; nIdx++) {
    const note = notes[nIdx];

    // 1. Tag filters check
    if (parsed.tags.length > 0) {
      const noteTagsLower = note.tags.map((t) => t.toLowerCase());
      const hasAllTags = parsed.tags.every((t) => noteTagsLower.includes(t));
      if (!hasAllTags) continue;
    }

    // 2. Category filter check
    if (parsed.categories.length > 0) {
      const matchesCat = parsed.categories.some((c) => note.category.toLowerCase().includes(c));
      if (!matchesCat) continue;
    }

    // 3. Pinned filter check
    if (parsed.onlyPinned && !note.isPinned) {
      continue;
    }

    // 4. Voice note filter check
    const hasVoiceRecordings = Array.isArray(note.voiceRecordings) && note.voiceRecordings.length > 0;
    if (parsed.onlyVoice && !hasVoiceRecordings) {
      continue;
    }

    // 5. Scoring calculation
    let score = 0;
    let matchedVoice = false;
    let matchedVoiceTranscriptSnippet = '';
    const matchedTags: string[] = [];
    const titleLower = note.title.toLowerCase();
    const contentLower = note.content.toLowerCase();
    const noteTagsLower = note.tags.map((t) => t.toLowerCase());

    let matchesAnyText = allTokens.length === 0;

    // Check exact phrases
    for (let pIdx = 0; pIdx < parsed.exactPhrases.length; pIdx++) {
      const phrase = parsed.exactPhrases[pIdx];
      if (titleLower.includes(phrase)) {
        score += 80;
        matchesAnyText = true;
      }
      if (contentLower.includes(phrase)) {
        score += 40;
        matchesAnyText = true;
      }
    }

    // Check individual search terms
    for (let tIdx = 0; tIdx < parsed.terms.length; tIdx++) {
      const term = parsed.terms[tIdx];
      let termMatched = false;

      // Exact title match or startsWith bonus
      if (titleLower === term) {
        score += 100;
        termMatched = true;
      } else if (titleLower.startsWith(term)) {
        score += 60;
        termMatched = true;
      } else if (titleLower.includes(term)) {
        score += 40;
        termMatched = true;
      }

      // Tag match
      for (let tagIdx = 0; tagIdx < note.tags.length; tagIdx++) {
        if (noteTagsLower[tagIdx].includes(term)) {
          score += 35;
          matchedTags.push(note.tags[tagIdx]);
          termMatched = true;
        }
      }

      // Content match: zero-allocation occurrence count instead of regex array creation
      if (contentLower.includes(term)) {
        score += 15;
        let occurrences = 0;
        let pos = 0;
        const termLen = term.length;
        while ((pos = contentLower.indexOf(term, pos)) !== -1) {
          occurrences++;
          pos += termLen;
          if (occurrences >= 10) break; // early cap
        }
        score += Math.min(occurrences * 3, 25);
        termMatched = true;
      }

      if (termMatched) {
        matchesAnyText = true;
      }
    }

    // Check Voice Recordings transcripts
    if (hasVoiceRecordings && allTokens.length > 0) {
      const recs = note.voiceRecordings!;
      for (let rIdx = 0; rIdx < recs.length; rIdx++) {
        const rec = recs[rIdx];
        if (!rec.transcript) continue;
        const transcriptLower = rec.transcript.toLowerCase();

        for (let pIdx = 0; pIdx < parsed.exactPhrases.length; pIdx++) {
          const phrase = parsed.exactPhrases[pIdx];
          if (transcriptLower.includes(phrase)) {
            score += 50;
            matchesAnyText = true;
            matchedVoice = true;
            if (!matchedVoiceTranscriptSnippet) {
              matchedVoiceTranscriptSnippet = `[🎙️ Voice Memo]: ${extractSnippet(rec.transcript, allTokens)}`;
            }
          }
        }

        for (let tIdx = 0; tIdx < parsed.terms.length; tIdx++) {
          const term = parsed.terms[tIdx];
          if (transcriptLower.includes(term)) {
            score += 30;
            matchesAnyText = true;
            matchedVoice = true;
            if (!matchedVoiceTranscriptSnippet) {
              matchedVoiceTranscriptSnippet = `[🎙️ Voice Memo]: ${extractSnippet(rec.transcript, allTokens)}`;
            }
          }
        }
      }
    }

    if (allTokens.length > 0 && !matchesAnyText) {
      continue;
    }

    // Boost pinned notes
    if (note.isPinned) {
      score += 10;
    }

    // Boost notes with voice recording if filtered by voice
    if (parsed.onlyVoice && hasVoiceRecordings) {
      score += 15;
    }

    // Recency boost (notes updated in the last 7 days get minor bonus - zero-allocation Date.parse)
    const ageDays = (nowMs - Date.parse(note.updatedAt)) / 86400000;
    if (ageDays < 7) {
      score += Math.max(0, 5 - ageDays);
    }

    const snippetText = matchedVoiceTranscriptSnippet || extractSnippet(note.content, allTokens);

    results.push({
      note,
      score,
      highlightedTitle: highlightText(note.title, highlightPattern),
      highlightedSnippet: highlightText(snippetText, highlightPattern),
      matchedTags: matchedTags.length > 1 ? Array.from(new Set(matchedTags)) : matchedTags,
      matchedVoice,
    });
  }

  // Sort by score descending, then by updatedAt descending (zero Date allocations)
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return Date.parse(b.note.updatedAt) - Date.parse(a.note.updatedAt);
  });

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { matches: results, durationMs };
}
