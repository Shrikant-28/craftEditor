import React, { useState, useMemo, useCallback } from 'react';
import {
  Copy,
  Check, ExternalLink,
  CheckSquare,
  Square
} from 'lucide-react';
import { tokenizeCode, TOKEN_COLORS, getLanguageMetadata } from '../utils/syntaxHighlighter';

interface MarkdownRendererProps {
  content: string;
  onToggleTask?: (taskIndex: number, newChecked: boolean) => void;
}

// -------------------------------------------------------------
// 1. Code Block with Syntax Highlighting and Copy Button
// -------------------------------------------------------------
interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = React.memo(({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const metadata = useMemo(() => getLanguageMetadata(language), [language]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Tokenize lines for syntax highlighting with line numbering
  const lines = useMemo(() => {
    return code.split('\n');
  }, [code]);

  const tokenizedLines = useMemo(() => {
    return lines.map((line) => tokenizeCode(line, language));
  }, [lines, language]);

  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#0a0e17',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Code Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '11px',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: metadata.badgeColor,
              boxShadow: `0 0 6px ${metadata.badgeColor}`,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: '#f3f4f6',
              letterSpacing: '0.04em',
            }}
          >
            {metadata.label}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="btn btn-ghost"
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            height: '24px',
            gap: '4px',
            color: copied ? 'var(--accent-emerald)' : 'var(--text-secondary)',
          }}
          title="Copy code to clipboard"
        >
          {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Editor Body with Line Numbers */}
      <div
        style={{
          overflowX: 'auto',
          padding: '12px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '12.5px',
          lineHeight: '1.65',
        }}
      >
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {tokenizedLines.map((tokens, lineIdx) => (
              <tr key={lineIdx} style={{ verticalAlign: 'top' }}>
                {/* Gutter Line Number */}
                <td
                  style={{
                    width: '42px',
                    minWidth: '42px',
                    paddingRight: '14px',
                    textAlign: 'right',
                    color: 'rgba(255, 255, 255, 0.2)',
                    userSelect: 'none',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {lineIdx + 1}
                </td>

                {/* Highlighted Code Tokens */}
                <td style={{ whiteSpace: 'pre', paddingRight: '16px' }}>
                  {tokens.length === 0 ? (
                    ' '
                  ) : (
                    tokens.map((token, tIdx) => {
                      const style = TOKEN_COLORS[token.type] || TOKEN_COLORS.plain;
                      return (
                        <span
                          key={tIdx}
                          style={{
                            color: style.color,
                            fontWeight: style.fontWeight || 'normal',
                            fontStyle: style.fontStyle || 'normal',
                          }}
                        >
                          {token.text}
                        </span>
                      );
                    })
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// 2. Inline Markdown Parser (Bold, Italic, Code, Links, Highlight)
// -------------------------------------------------------------
export function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Regex rules for inline tokens
  // Order: link, image, bold-italic, bold, italic, strikethrough, highlight, inline-code
  const pattern = /(\!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|~~.*?~~|==.*?==|`.*?`)/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // Image: ![alt](url)
    if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\!\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <img
            key={index}
            src={match[2]}
            alt={match[1]}
            style={{
              maxWidth: '100%',
              borderRadius: 'var(--radius-md)',
              margin: '8px 0',
              border: '1px solid var(--border-subtle)',
            }}
          />
        );
      }
    }

    // Link: [text](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const linkText = match[1];
        const linkUrl = match[2];

        const handleLinkClick = (e: React.MouseEvent) => {
          e.preventDefault();
          if (window.electronAPI && window.electronAPI.openExternalUrl) {
            window.electronAPI.openExternalUrl(linkUrl);
          } else {
            window.open(linkUrl, '_blank', 'noopener,noreferrer');
          }
        };

        return (
          <a
            key={index}
            href={linkUrl}
            onClick={handleLinkClick}
            style={{
              color: 'var(--accent-cyan)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              cursor: 'pointer',
            }}
            title={linkUrl}
          >
            <span>{linkText}</span>
            <ExternalLink size={10} style={{ opacity: 0.7 }} />
          </a>
        );
      }
    }

    // Bold Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={index} style={{ fontWeight: 700, fontStyle: 'italic', color: 'var(--text-primary)' }}>
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          {part.slice(1, -1)}
        </em>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={index} style={{ textDecoration: 'line-through', opacity: 0.65 }}>
          {part.slice(2, -2)}
        </del>
      );
    }

    // Highlight: ==text==
    if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
      return (
        <mark
          key={index}
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.25)',
            color: '#fef3c7',
            padding: '1px 4px',
            borderRadius: '3px',
            border: '1px solid rgba(245, 158, 11, 0.35)',
          }}
        >
          {part.slice(2, -2)}
        </mark>
      );
    }

    // Inline Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            color: '#38bdf8',
            border: '1px solid rgba(6, 182, 212, 0.25)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

// -------------------------------------------------------------
// 3. Block-Level Document Parser & Renderer
// -------------------------------------------------------------
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({
  content,
  onToggleTask,
}) => {
  // Parse document into structured blocks
  const blocks = useMemo(() => {
    const rawLines = content.split('\n');
    const result: Array<{
      type: 'heading' | 'code' | 'blockquote' | 'table' | 'task' | 'list' | 'hr' | 'paragraph';
      level?: number;
      language?: string;
      code?: string;
      checked?: boolean;
      taskIndex?: number;
      items?: string[];
      ordered?: boolean;
      headers?: string[];
      rows?: string[][];
      text?: string;
    }> = [];

    let i = 0;
    let currentTaskCount = 0;

    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // 1. Fenced Code Block: ```lang ... ```
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
          codeLines.push(rawLines[i]);
          i++;
        }
        if (i < rawLines.length) i++; // consume closing ```
        result.push({
          type: 'code',
          language: lang || 'plaintext',
          code: codeLines.join('\n'),
        });
        continue;
      }

      // 2. Horizontal Rule: ---, ***, ___
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        result.push({ type: 'hr' });
        i++;
        continue;
      }

      // 3. Headings: # through ######
      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
          result.push({
            type: 'heading',
            level: match[1].length,
            text: match[2],
          });
          i++;
          continue;
        }
      }

      // 4. Task list items: - [ ] or - [x]
      if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('* [ ] ') || trimmed.startsWith('* [x] ')) {
        const isChecked = trimmed.startsWith('- [x] ') || trimmed.startsWith('* [x] ');
        const taskText = trimmed.slice(6);
        result.push({
          type: 'task',
          checked: isChecked,
          text: taskText,
          taskIndex: currentTaskCount++,
        });
        i++;
        continue;
      }

      // 5. Blockquotes: > ...
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
          quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        result.push({
          type: 'blockquote',
          text: quoteLines.join('\n'),
        });
        continue;
      }

      // 6. Tables: | Header | Header |
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < rawLines.length && rawLines[i + 1].includes('---')) {
        const headers = trimmed.slice(1, -1).split('|').map((h) => h.trim());
        i += 2; // skip header and delimiter line
        const rows: string[][] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
          const cells = rawLines[i].trim().slice(1, -1).split('|').map((c) => c.trim());
          rows.push(cells);
          i++;
        }
        result.push({
          type: 'table',
          headers,
          rows,
        });
        continue;
      }

      // 7. Unordered Lists: - item or * item
      if ((trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) && !trimmed.startsWith('- [ ]') && !trimmed.startsWith('- [x]')) {
        const items: string[] = [];
        while (i < rawLines.length && (rawLines[i].trim().startsWith('- ') || rawLines[i].trim().startsWith('* ') || rawLines[i].trim().startsWith('+ '))) {
          items.push(rawLines[i].trim().slice(2));
          i++;
        }
        result.push({
          type: 'list',
          ordered: false,
          items,
        });
        continue;
      }

      // 8. Ordered Lists: 1. item
      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
          items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        result.push({
          type: 'list',
          ordered: true,
          items,
        });
        continue;
      }

      // 9. Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // 10. General Paragraph
      const pLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim() && !rawLines[i].trim().startsWith('```') && !rawLines[i].trim().startsWith('#') && !rawLines[i].trim().startsWith('>') && !rawLines[i].trim().startsWith('|') && !rawLines[i].trim().startsWith('- ') && !rawLines[i].trim().startsWith('* ') && !/^\d+\.\s+/.test(rawLines[i].trim())) {
        pLines.push(rawLines[i]);
        i++;
      }
      result.push({
        type: 'paragraph',
        text: pLines.join(' '),
      });
    }

    return result;
  }, [content]);

  return (
    <div
      style={{
        lineHeight: '1.7',
        fontSize: '14px',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      className="markdown-content"
    >
      {blocks.map((block, idx) => {
        // --- Code Block ---
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.code || ''} language={block.language || 'plaintext'} />;
        }

        // --- Heading ---
        if (block.type === 'heading') {
          const level = block.level || 1;
          const text = block.text || '';
          if (level === 1) {
            return (
              <h1
                key={idx}
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  margin: '18px 0 8px 0',
                  color: '#ffffff',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {renderInlineMarkdown(text)}
              </h1>
            );
          }
          if (level === 2) {
            return (
              <h2
                key={idx}
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: '16px 0 6px 0',
                  color: 'var(--accent-cyan)',
                }}
              >
                {renderInlineMarkdown(text)}
              </h2>
            );
          }
          if (level === 3) {
            return (
              <h3
                key={idx}
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  margin: '12px 0 4px 0',
                  color: 'var(--text-primary)',
                }}
              >
                {renderInlineMarkdown(text)}
              </h3>
            );
          }
          return (
            <h4
              key={idx}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                margin: '10px 0 4px 0',
                color: 'var(--accent-violet)',
              }}
            >
              {renderInlineMarkdown(text)}
            </h4>
          );
        }

        // --- Task List Item ---
        if (block.type === 'task') {
          return (
            <div
              key={idx}
              onClick={() => onToggleTask && block.taskIndex !== undefined && onToggleTask(block.taskIndex, !block.checked)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                margin: '3px 0',
                cursor: onToggleTask ? 'pointer' : 'default',
                padding: '3px 6px',
                borderRadius: '4px',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ marginTop: '3px', flexShrink: 0 }}>
                {block.checked ? (
                  <CheckSquare size={16} color="var(--accent-emerald)" fill="rgba(16, 185, 129, 0.15)" />
                ) : (
                  <Square size={16} color="var(--text-tertiary)" />
                )}
              </div>
              <span
                style={{
                  color: block.checked ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: block.checked ? 'line-through' : 'none',
                  opacity: block.checked ? 0.7 : 1,
                }}
              >
                {renderInlineMarkdown(block.text || '')}
              </span>
            </div>
          );
        }

        // --- Blockquote ---
        if (block.type === 'blockquote') {
          const isVoiceMemo = block.text?.includes('Voice Memo');
          return (
            <blockquote
              key={idx}
              style={{
                margin: '12px 0',
                padding: '12px 16px',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                borderLeft: isVoiceMemo
                  ? '3px solid var(--accent-cyan)'
                  : '3px solid var(--accent-violet)',
                backgroundColor: isVoiceMemo
                  ? 'rgba(6, 182, 212, 0.08)'
                  : 'rgba(139, 92, 246, 0.08)',
                color: 'var(--text-secondary)',
                fontSize: '13.5px',
                fontStyle: 'italic',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {renderInlineMarkdown(block.text || '')}
            </blockquote>
          );
        }

        // --- Table ---
        if (block.type === 'table') {
          return (
            <div
              key={idx}
              style={{
                overflowX: 'auto',
                margin: '14px 0',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {block.headers?.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        style={{
                          padding: '10px 14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {renderInlineMarkdown(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows?.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '9px 14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // --- Lists (Unordered / Ordered) ---
        if (block.type === 'list') {
          if (block.ordered) {
            return (
              <ol key={idx} style={{ paddingLeft: '24px', margin: '6px 0' }}>
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
                    {renderInlineMarkdown(item)}
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={idx} style={{ paddingLeft: '22px', margin: '6px 0' }}>
              {block.items?.map((item, itemIdx) => (
                <li key={itemIdx} style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        // --- Horizontal Rule ---
        if (block.type === 'hr') {
          return (
            <hr
              key={idx}
              style={{
                border: 'none',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.4), transparent)',
                margin: '20px 0',
              }}
            />
          );
        }

        // --- Standard Paragraph ---
        return (
          <p key={idx} style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
            {renderInlineMarkdown(block.text || '')}
          </p>
        );
      })}
    </div>
  );
});
