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

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower.startsWith('tag:') || lower.startsWith('#')) {
      const tag = lower.replace(/^tag:|^#/, '').trim();
      if (tag) tags.push(tag);
    } else if (lower.startsWith('category:') || lower.startsWith('cat:')) {
      const cat = lower.replace(/^category:|^cat:/, '').trim();
      if (cat) categories.push(cat);
    } else if (lower === 'is:pinned' || lower === 'pinned:true') {
      onlyPinned = true;
    } else {
      terms.push(lower);
    }
  }

  return { terms, exactPhrases, tags, categories, onlyPinned };
}

/**
 * Highlights matches in text using HTML <mark> tags
 */
export function highlightText(text: string, searchTokens: string[]): string {
  if (!text || searchTokens.length === 0) return text || '';
  const validTokens = searchTokens.filter((t) => t.length > 0);
  if (validTokens.length === 0) return text;

  try {
    const pattern = new RegExp(`(${validTokens.map(escapeRegExp).join('|')})`, 'gi');
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

  for (const token of searchTokens) {
    const idx = lowerContent.indexOf(token.toLowerCase());
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
 */
export function executeSearch(notes: Note[], filter: SearchFilter): { matches: SearchMatch[]; durationMs: number } {
  const startTime = performance.now();
  const { query, tag: activeTag, category: activeCategory, onlyPinned: filterPinned } = filter;

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

  const allTokens = [...parsed.terms, ...parsed.exactPhrases];
  const hasActiveQuery = allTokens.length > 0 || parsed.tags.length > 0 || parsed.categories.length > 0 || parsed.onlyPinned;

  if (!hasActiveQuery) {
    // Return all notes sorted by pinned then updatedAt
    const defaultMatches: SearchMatch[] = [...notes]
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .map((note) => ({
        note,
        score: 0,
        highlightedTitle: note.title,
        highlightedSnippet: extractSnippet(note.content, []),
        matchedTags: [],
      }));

    return { matches: defaultMatches, durationMs: performance.now() - startTime };
  }

  const results: SearchMatch[] = [];

  for (const note of notes) {
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

    // 4. Scoring calculation
    let score = 0;
    const matchedTags: string[] = [];
    const titleLower = note.title.toLowerCase();
    const contentLower = note.content.toLowerCase();
    const noteTagsLower = note.tags.map((t) => t.toLowerCase());

    let matchesAnyText = allTokens.length === 0;

    // Check exact phrases
    for (const phrase of parsed.exactPhrases) {
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
    for (const term of parsed.terms) {
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
      note.tags.forEach((tag, idx) => {
        if (noteTagsLower[idx].includes(term)) {
          score += 35;
          matchedTags.push(tag);
          termMatched = true;
        }
      });

      // Content match
      if (contentLower.includes(term)) {
        score += 15;
        // Count occurrences up to a cap
        const occurrences = (contentLower.match(new RegExp(escapeRegExp(term), 'g')) || []).length;
        score += Math.min(occurrences * 3, 25);
        termMatched = true;
      }

      if (termMatched) {
        matchesAnyText = true;
      }
    }

    if (allTokens.length > 0 && !matchesAnyText) {
      continue;
    }

    // Boost pinned notes
    if (note.isPinned) {
      score += 10;
    }

    // Recency boost (notes updated in the last 7 days get minor bonus)
    const ageDays = (Date.now() - new Date(note.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) {
      score += Math.max(0, 5 - ageDays);
    }

    const snippet = extractSnippet(note.content, allTokens);

    results.push({
      note,
      score,
      highlightedTitle: highlightText(note.title, allTokens),
      highlightedSnippet: highlightText(snippet, allTokens),
      matchedTags: [...new Set(matchedTags)],
    });
  }

  // Sort by score descending, then by updatedAt descending
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.note.updatedAt).getTime() - new Date(a.note.updatedAt).getTime();
  });

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { matches: results, durationMs };
}
