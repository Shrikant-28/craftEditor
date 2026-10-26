/**
 * High-Performance Native Syntax Highlighter
 * Zero-dependency lexical tokenizer for source code blocks in Markdown.
 */

export type TokenType =
  | 'comment'
  | 'string'
  | 'number'
  | 'boolean'
  | 'keyword'
  | 'type'
  | 'function'
  | 'tag'
  | 'attribute'
  | 'operator'
  | 'punctuation'
  | 'plain';

export interface Token {
  type: TokenType;
  text: string;
}

export const TOKEN_COLORS: Record<TokenType, { color: string; fontWeight?: string; fontStyle?: string }> = {
  comment: { color: '#64748b', fontStyle: 'italic' },
  string: { color: '#34d399' },
  number: { color: '#fbbf24' },
  boolean: { color: '#fb7185', fontWeight: '600' },
  keyword: { color: '#c084fc', fontWeight: '600' },
  type: { color: '#22d3ee', fontWeight: '500' },
  function: { color: '#60a5fa' },
  tag: { color: '#f43f5e', fontWeight: '500' },
  attribute: { color: '#fbbf24' },
  operator: { color: '#94a3b8' },
  punctuation: { color: '#64748b' },
  plain: { color: '#e2e8f0' },
};

// Normalize language alias to primary language
export function normalizeLanguage(lang: string = ''): string {
  const l = lang.trim().toLowerCase();
  switch (l) {
    case 'js':
    case 'jsx':
    case 'javascript':
      return 'javascript';
    case 'ts':
    case 'tsx':
    case 'typescript':
      return 'typescript';
    case 'py':
    case 'python':
      return 'python';
    case 'json':
      return 'json';
    case 'html':
    case 'xml':
    case 'svg':
      return 'html';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'sh':
    case 'bash':
    case 'shell':
    case 'zsh':
      return 'bash';
    case 'sql':
      return 'sql';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'rs':
    case 'rust':
      return 'rust';
    case 'go':
    case 'golang':
      return 'go';
    default:
      return l || 'plaintext';
  }
}

// Language display metadata
export function getLanguageMetadata(lang: string): { label: string; badgeColor: string } {
  const normalized = normalizeLanguage(lang);
  switch (normalized) {
    case 'typescript':
      return { label: 'TypeScript', badgeColor: '#3178c6' };
    case 'javascript':
      return { label: 'JavaScript', badgeColor: '#f7df1e' };
    case 'python':
      return { label: 'Python', badgeColor: '#38bdf8' };
    case 'json':
      return { label: 'JSON', badgeColor: '#a855f7' };
    case 'html':
      return { label: 'HTML', badgeColor: '#f97316' };
    case 'css':
      return { label: 'CSS', badgeColor: '#06b6d4' };
    case 'bash':
      return { label: 'Bash', badgeColor: '#10b981' };
    case 'sql':
      return { label: 'SQL', badgeColor: '#ec4899' };
    case 'markdown':
      return { label: 'Markdown', badgeColor: '#6366f1' };
    case 'rust':
      return { label: 'Rust', badgeColor: '#ea580c' };
    case 'go':
      return { label: 'Go', badgeColor: '#00add8' };
    default:
      return { label: lang.toUpperCase() || 'CODE', badgeColor: '#64748b' };
  }
}

// Keyword definitions
const JS_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
  'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'let', 'static', 'async', 'await', 'from', 'as', 'type', 'interface', 'enum',
  'implements', 'package', 'private', 'protected', 'public'
]);

const JS_TYPES = new Set([
  'string', 'number', 'boolean', 'any', 'unknown', 'never', 'void', 'object',
  'symbol', 'bigint', 'Promise', 'Record', 'Array', 'Set', 'Map', 'Function',
  'React', 'FC', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef',
  'Node', 'Element', 'Document', 'Window', 'Blob', 'File', 'Error'
]);

const PY_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
  'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if',
  'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield', 'self', 'cls'
]);

const PY_TYPES = new Set([
  'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple', 'bytes',
  'None', 'True', 'False', 'object', 'Exception', 'Optional', 'Union', 'Any'
]);

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'and', 'or', 'insert', 'into', 'values', 'update',
  'set', 'delete', 'create', 'table', 'drop', 'alter', 'join', 'inner', 'left',
  'right', 'outer', 'full', 'on', 'group', 'by', 'order', 'having', 'limit',
  'offset', 'as', 'distinct', 'case', 'when', 'then', 'else', 'end', 'in',
  'not', 'null', 'is', 'like', 'between', 'exists', 'union', 'all', 'view',
  'index', 'primary', 'key', 'foreign', 'references', 'default'
]);

const BASH_KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'in', 'do', 'done',
  'case', 'esac', 'function', 'return', 'exit', 'export', 'echo', 'cd', 'ls',
  'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'curl', 'wget', 'cat', 'grep',
  'sed', 'awk', 'source', 'npm', 'npx', 'node', 'git', 'docker'
]);

/**
 * Tokenizes a string of source code for a given language.
 */
export function tokenizeCode(code: string, language: string): Token[] {
  const norm = normalizeLanguage(language);

  switch (norm) {
    case 'typescript':
    case 'javascript':
      return tokenizeJS(code);
    case 'python':
      return tokenizePython(code);
    case 'json':
      return tokenizeJSON(code);
    case 'html':
      return tokenizeHTML(code);
    case 'css':
      return tokenizeCSS(code);
    case 'bash':
      return tokenizeBash(code);
    case 'sql':
      return tokenizeSQL(code);
    default:
      return [{ type: 'plain', text: code }];
  }
}

// Tokenizer for JS/TS
function tokenizeJS(code: string): Token[] {
  const tokens: Token[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    const ch = code[i];

    // 1. Line comment
    if (ch === '/' && code[i + 1] === '/') {
      const start = i;
      while (i < len && code[i] !== '\n') i++;
      tokens.push({ type: 'comment', text: code.slice(start, i) });
      continue;
    }

    // 2. Block comment
    if (ch === '/' && code[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < len && !(code[i - 1] === '*' && code[i] === '/')) i++;
      if (i <= len) i++;
      tokens.push({ type: 'comment', text: code.slice(start, i) });
      continue;
    }

    // 3. String literals (single, double, template)
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      const start = i;
      i++;
      while (i < len && code[i] !== quote) {
        if (code[i] === '\\') i++; // skip escaped character
        i++;
      }
      if (i < len) i++; // consume closing quote
      tokens.push({ type: 'string', text: code.slice(start, i) });
      continue;
    }

    // 4. Numbers
    if ((ch >= '0' && ch <= '9') || (ch === '.' && code[i + 1] >= '0' && code[i + 1] <= '9')) {
      const start = i;
      while (i < len && ((code[i] >= '0' && code[i] <= '9') || code[i] === '.' || code[i] === 'x' || (code[i] >= 'a' && code[i] <= 'f') || (code[i] >= 'A' && code[i] <= 'F'))) {
        i++;
      }
      tokens.push({ type: 'number', text: code.slice(start, i) });
      continue;
    }

    // 5. Identifiers, Keywords, Functions
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$') {
      const start = i;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '_' || code[i] === '$')) {
        i++;
      }
      const word = code.slice(start, i);

      if (word === 'true' || word === 'false' || word === 'null' || word === 'undefined') {
        tokens.push({ type: 'boolean', text: word });
      } else if (JS_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (JS_TYPES.has(word)) {
        tokens.push({ type: 'type', text: word });
      } else {
        // Peek ahead for function call: word(...)
        let lookAhead = i;
        while (lookAhead < len && (code[lookAhead] === ' ' || code[lookAhead] === '\t')) lookAhead++;
        if (code[lookAhead] === '(') {
          tokens.push({ type: 'function', text: word });
        } else if (word[0] >= 'A' && word[0] <= 'Z') {
          // PascalCase convention is likely a Class or Type
          tokens.push({ type: 'type', text: word });
        } else {
          tokens.push({ type: 'plain', text: word });
        }
      }
      continue;
    }

    // 6. Operators & Arrows
    if (ch === '=' && code[i + 1] === '>') {
      tokens.push({ type: 'operator', text: '=>' });
      i += 2;
      continue;
    }

    if ('+-*/%^&|!<>?:='.includes(ch)) {
      const start = i;
      while (i < len && '+-*/%^&|!<>?:='.includes(code[i])) i++;
      tokens.push({ type: 'operator', text: code.slice(start, i) });
      continue;
    }

    // 7. Punctuation
    if ('{}()[].,;'.includes(ch)) {
      tokens.push({ type: 'punctuation', text: ch });
      i++;
      continue;
    }

    // 8. Whitespace & other characters
    const start = i;
    while (i < len && !((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '_' || code[i] === '$' || code[i] === '/' || code[i] === '"' || code[i] === "'" || code[i] === '`' || '+-*/%^&|!<>?:={}()[].,;'.includes(code[i]))) {
      i++;
    }
    tokens.push({ type: 'plain', text: code.slice(start, i) });
  }

  return tokens;
}

// Tokenizer for Python
function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    const ch = code[i];

    // Comment
    if (ch === '#') {
      const start = i;
      while (i < len && code[i] !== '\n') i++;
      tokens.push({ type: 'comment', text: code.slice(start, i) });
      continue;
    }

    // Triple-quoted or single-quoted string
    if (ch === '"' || ch === "'") {
      const isTriple = code.slice(i, i + 3) === ch.repeat(3);
      const quote = isTriple ? ch.repeat(3) : ch;
      const start = i;
      i += quote.length;
      while (i < len) {
        if (code[i] === '\\') {
          i += 2;
          continue;
        }
        if (code.slice(i, i + quote.length) === quote) {
          i += quote.length;
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', text: code.slice(start, i) });
      continue;
    }

    // Numbers
    if (ch >= '0' && ch <= '9') {
      const start = i;
      while (i < len && ((code[i] >= '0' && code[i] <= '9') || code[i] === '.' || code[i] === 'e' || code[i] === 'E')) i++;
      tokens.push({ type: 'number', text: code.slice(start, i) });
      continue;
    }

    // Identifiers & Keywords
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      const start = i;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '_')) i++;
      const word = code.slice(start, i);

      if (word === 'True' || word === 'False' || word === 'None') {
        tokens.push({ type: 'boolean', text: word });
      } else if (PY_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (PY_TYPES.has(word)) {
        tokens.push({ type: 'type', text: word });
      } else {
        let lookAhead = i;
        while (lookAhead < len && (code[lookAhead] === ' ' || code[lookAhead] === '\t')) lookAhead++;
        if (code[lookAhead] === '(') {
          tokens.push({ type: 'function', text: word });
        } else {
          tokens.push({ type: 'plain', text: word });
        }
      }
      continue;
    }

    // Operators
    if ('+-*/%=!<>@&|^~'.includes(ch)) {
      const start = i;
      while (i < len && '+-*/%=!<>@&|^~'.includes(code[i])) i++;
      tokens.push({ type: 'operator', text: code.slice(start, i) });
      continue;
    }

    // Punctuation
    if ('{}()[]:,.'.includes(ch)) {
      tokens.push({ type: 'punctuation', text: ch });
      i++;
      continue;
    }

    const start = i;
    i++;
    tokens.push({ type: 'plain', text: code.slice(start, i) });
  }

  return tokens;
}

// Tokenizer for JSON
function tokenizeJSON(code: string): Token[] {
  const tokens: Token[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    const ch = code[i];

    // String (key or value)
    if (ch === '"') {
      const start = i;
      i++;
      while (i < len && code[i] !== '"') {
        if (code[i] === '\\') i++;
        i++;
      }
      if (i < len) i++;
      const str = code.slice(start, i);

      // Check if it's a key followed by a colon
      let lookAhead = i;
      while (lookAhead < len && (code[lookAhead] === ' ' || code[lookAhead] === '\t' || code[lookAhead] === '\n')) lookAhead++;
      if (code[lookAhead] === ':') {
        tokens.push({ type: 'attribute', text: str });
      } else {
        tokens.push({ type: 'string', text: str });
      }
      continue;
    }

    // Numbers
    if ((ch >= '0' && ch <= '9') || ch === '-') {
      const start = i;
      while (i < len && ((code[i] >= '0' && code[i] <= '9') || code[i] === '.' || code[i] === '-' || code[i] === 'e' || code[i] === 'E')) i++;
      tokens.push({ type: 'number', text: code.slice(start, i) });
      continue;
    }

    // Boolean or Null
    if (ch >= 'a' && ch <= 'z') {
      const start = i;
      while (i < len && code[i] >= 'a' && code[i] <= 'z') i++;
      const word = code.slice(start, i);
      if (word === 'true' || word === 'false' || word === 'null') {
        tokens.push({ type: 'boolean', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      continue;
    }

    // Punctuation
    if ('{}[],:'.includes(ch)) {
      tokens.push({ type: 'punctuation', text: ch });
      i++;
      continue;
    }

    const start = i;
    i++;
    tokens.push({ type: 'plain', text: code.slice(start, i) });
  }

  return tokens;
}

// Tokenizer for HTML / XML
function tokenizeHTML(code: string): Token[] {
  const tokens: Token[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    if (code.slice(i, i + 4) === '<!--') {
      const start = i;
      i += 4;
      while (i < len && code.slice(i, i + 3) !== '-->') i++;
      if (i < len) i += 3;
      tokens.push({ type: 'comment', text: code.slice(start, i) });
      continue;
    }

    if (code[i] === '<') {
      const start = i;
      i++;
      if (code[i] === '/') i++;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '-')) i++;
      tokens.push({ type: 'tag', text: code.slice(start, i) });
      continue;
    }

    if (code[i] === '>') {
      tokens.push({ type: 'tag', text: '>' });
      i++;
      continue;
    }

    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      const start = i;
      i++;
      while (i < len && code[i] !== quote) i++;
      if (i < len) i++;
      tokens.push({ type: 'string', text: code.slice(start, i) });
      continue;
    }

    if ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z')) {
      const start = i;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '-')) i++;
      const word = code.slice(start, i);
      let lookAhead = i;
      while (lookAhead < len && (code[lookAhead] === ' ' || code[lookAhead] === '\t')) lookAhead++;
      if (code[lookAhead] === '=') {
        tokens.push({ type: 'attribute', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      continue;
    }

    tokens.push({ type: 'plain', text: code[i] });
    i++;
  }

  return tokens;
}

// Tokenizer for CSS
function tokenizeCSS(code: string): Token[] {
  const tokens: Token[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    if (code[i] === '/' && code[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < len && !(code[i - 1] === '*' && code[i] === '/')) i++;
      if (i < len) i++;
      tokens.push({ type: 'comment', text: code.slice(start, i) });
      continue;
    }

    if (code[i] === '.' || code[i] === '#') {
      const start = i;
      i++;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '-' || code[i] === '_')) i++;
      tokens.push({ type: 'type', text: code.slice(start, i) });
      continue;
    }

    if ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z')) {
      const start = i;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '-')) i++;
      const word = code.slice(start, i);

      let lookAhead = i;
      while (lookAhead < len && (code[lookAhead] === ' ' || code[lookAhead] === '\t')) lookAhead++;
      if (code[lookAhead] === ':') {
        tokens.push({ type: 'keyword', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      continue;
    }

    if (code[i] === '{' || code[i] === '}' || code[i] === ';' || code[i] === ':') {
      tokens.push({ type: 'punctuation', text: code[i] });
      i++;
      continue;
    }

    tokens.push({ type: 'plain', text: code[i] });
    i++;
  }

  return tokens;
}

// Tokenizer for Bash
function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    if (code[i] === '#') {
      const start = i;
      while (i < len && code[i] !== '\n') i++;
      tokens.push({ type: 'comment', text: code.slice(start, i) });
      continue;
    }

    if (code[i] === '$') {
      const start = i;
      i++;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '_' || code[i] === '{' || code[i] === '}')) i++;
      tokens.push({ type: 'attribute', text: code.slice(start, i) });
      continue;
    }

    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      const start = i;
      i++;
      while (i < len && code[i] !== quote) {
        if (code[i] === '\\') i++;
        i++;
      }
      if (i < len) i++;
      tokens.push({ type: 'string', text: code.slice(start, i) });
      continue;
    }

    if ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || code[i] === '-') {
      const start = i;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '-' || code[i] === '_')) i++;
      const word = code.slice(start, i);
      if (BASH_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (word.startsWith('-')) {
        tokens.push({ type: 'operator', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      continue;
    }

    tokens.push({ type: 'plain', text: code[i] });
    i++;
  }

  return tokens;
}

// Tokenizer for SQL
function tokenizeSQL(code: string): Token[] {
  const tokens: Token[] = [];
  const len = code.length;
  let i = 0;

  while (i < len) {
    if (code[i] === '-' && code[i + 1] === '-') {
      const start = i;
      while (i < len && code[i] !== '\n') i++;
      tokens.push({ type: 'comment', text: code.slice(start, i) });
      continue;
    }

    if (code[i] === "'" || code[i] === '"' || code[i] === '`') {
      const quote = code[i];
      const start = i;
      i++;
      while (i < len && code[i] !== quote) {
        if (code[i] === '\\') i++;
        i++;
      }
      if (i < len) i++;
      tokens.push({ type: 'string', text: code.slice(start, i) });
      continue;
    }

    if (code[i] >= '0' && code[i] <= '9') {
      const start = i;
      while (i < len && ((code[i] >= '0' && code[i] <= '9') || code[i] === '.')) i++;
      tokens.push({ type: 'number', text: code.slice(start, i) });
      continue;
    }

    if ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || code[i] === '_') {
      const start = i;
      while (i < len && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') || (code[i] >= '0' && code[i] <= '9') || code[i] === '_')) i++;
      const word = code.slice(start, i);
      if (SQL_KEYWORDS.has(word.toLowerCase())) {
        tokens.push({ type: 'keyword', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      continue;
    }

    if ('=><!+-*/%'.includes(code[i])) {
      tokens.push({ type: 'operator', text: code[i] });
      i++;
      continue;
    }

    if ('(),;.'.includes(code[i])) {
      tokens.push({ type: 'punctuation', text: code[i] });
      i++;
      continue;
    }

    tokens.push({ type: 'plain', text: code[i] });
    i++;
  }

  return tokens;
}
