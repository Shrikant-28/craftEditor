import React, { useRef, useEffect } from 'react';
import { Search, X, Zap } from 'lucide-react';
import { SearchFilter } from '../types/note';

interface SearchBarProps {
  filter: SearchFilter;
  onFilterChange: (update: Partial<SearchFilter>) => void;
  resultCount: number;
  durationMs: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filter,
  onFilterChange,
  resultCount,
  durationMs,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Ctrl+K or Cmd+K or "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    onFilterChange({ query: '', tag: undefined, category: undefined, onlyPinned: false });
    inputRef.current?.focus();
  };

  const insertSyntax = (text: string) => {
    const current = filter.query ? `${filter.query} ${text}` : text;
    onFilterChange({ query: current });
    inputRef.current?.focus();
  };

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-main)' }}>
      {/* Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.15s ease',
        }}
      >
        <Search size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />

        <input
          ref={inputRef}
          type="text"
          value={filter.query}
          onChange={(e) => onFilterChange({ query: e.target.value })}
          placeholder="Search notes..."
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {/* Clear query button */}
        {(filter.query || filter.tag || filter.category || filter.onlyPinned) && (
          <button
            onClick={handleClear}
            className="btn-icon"
            style={{ width: '22px', height: '22px' }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}

        {/* Shortcut Badge */}
        <kbd
          style={{
            fontSize: '10px',
            padding: '2px 5px',
            backgroundColor: 'var(--border-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Ctrl+K
        </kbd>
      </div>
    </div>
  );
};
