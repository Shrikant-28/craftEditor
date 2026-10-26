import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  Pin,
  Tag,
  Folder,
  Plus, Database,
  CheckCircle2,
  Check,
  X,
  Mic
} from 'lucide-react';
import { Note, SearchFilter } from '../types/note';

interface SidebarProps {
  notes: Note[];
  filter: SearchFilter;
  onFilterChange: (update: Partial<SearchFilter>) => void;
  onCreateNote: () => void;
  onCreateVoiceNote: () => void;
  categories: string[];
  allTags: { tag: string; count: number }[];
  isDiskSynced: boolean;
  onAddCategory?: (name: string) => void;
  onOpenMeetingPipeline?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  notes,
  filter,
  onFilterChange,
  onCreateNote,
  onCreateVoiceNote,
  categories,
  allTags,
  isDiskSynced,
  onAddCategory,
  onOpenMeetingPipeline,
}) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingCategory) {
      inputRef.current?.focus();
    }
  }, [isAddingCategory]);

  const handleSaveCategory = () => {
    if (newCategoryName.trim() && onAddCategory) {
      onAddCategory(newCategoryName.trim());
      onFilterChange({ category: newCategoryName.trim() });
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  // Single-pass memoized count calculation to eliminate repeated .filter() array allocations
  const { pinnedCount, voiceCount, categoryCounts } = useMemo(() => {
    let pinned = 0;
    let voice = 0;
    const catCounts = new Map<string, number>();

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.isPinned) pinned++;
      if (n.voiceRecordings && n.voiceRecordings.length > 0) voice++;
      if (n.category) {
        const lowerCat = n.category.toLowerCase();
        catCounts.set(lowerCat, (catCounts.get(lowerCat) || 0) + 1);
      }
    }

    return { pinnedCount: pinned, voiceCount: voice, categoryCounts: catCounts };
  }, [notes]);

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Action Header */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onCreateNote}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', height: '36px' }}
        >
          <Plus size={16} />
          <span>New Note</span>
        </button>

        <button
          onClick={onCreateVoiceNote}
          className="btn"
          style={{
            width: '100%',
            justifyContent: 'center',
            height: '34px',
            background: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            color: 'var(--accent-violet)',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
          }}
          title="Create a new voice note and start recording"
        >
          <Mic size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Record Voice Note</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
        {/* Quick Views */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-tertiary)',
              padding: '0 8px 8px 8px',
            }}
          >
            Quick Views
          </div>

          <div
            onClick={() => onFilterChange({ category: undefined, tag: undefined, onlyPinned: false, onlyVoice: false })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor:
                !filter.category && !filter.tag && !filter.onlyPinned && !filter.onlyVoice
                  ? 'rgba(6, 182, 212, 0.12)'
                  : 'transparent',
              color:
                !filter.category && !filter.tag && !filter.onlyPinned && !filter.onlyVoice
                  ? 'var(--accent-cyan)'
                  : 'var(--text-secondary)',
              transition: 'background 0.15s ease',
              marginBottom: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <FileText size={15} />
              <span>All Notes</span>
            </div>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{notes.length}</span>
          </div>

          <div
            onClick={() => onFilterChange({ onlyPinned: !filter.onlyPinned })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: filter.onlyPinned ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              color: filter.onlyPinned ? 'var(--accent-amber)' : 'var(--text-secondary)',
              transition: 'background 0.15s ease',
              marginBottom: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Pin size={15} />
              <span>Pinned Notes</span>
            </div>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{pinnedCount}</span>
          </div>

          <div
            onClick={() => onFilterChange({ onlyVoice: !filter.onlyVoice })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: filter.onlyVoice ? 'rgba(6, 182, 212, 0.14)' : 'transparent',
              color: filter.onlyVoice ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Mic size={15} />
              <span>Voice Notes</span>
            </div>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{voiceCount}</span>
          </div>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px 8px 8px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
              }}
            >
              Categories
            </span>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="btn-icon"
              style={{ width: '20px', height: '20px' }}
              title="Add Category"
            >
              <Plus size={12} />
            </button>
          </div>

          {isAddingCategory && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                marginBottom: '4px',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Category name..."
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSaveCategory}
                className="btn-icon"
                style={{ width: '24px', height: '24px', color: 'var(--accent-emerald)' }}
                title="Save Category (Enter)"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="btn-icon"
                style={{ width: '24px', height: '24px', color: 'var(--text-tertiary)' }}
                title="Cancel (Esc)"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {categories.map((cat) => {
            const count = categoryCounts.get(cat.toLowerCase()) || 0;
            const isSelected = filter.category?.toLowerCase() === cat.toLowerCase();

            return (
              <div
                key={cat}
                onClick={() => onFilterChange({ category: isSelected ? undefined : cat })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: isSelected ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background 0.15s ease',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder size={14} />
                  <span>{cat}</span>
                </div>
                <span style={{ fontSize: '11px', opacity: 0.6 }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Tags */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-tertiary)',
              padding: '0 8px 8px 8px',
            }}
          >
            Tags
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 6px' }}>
            {allTags.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '4px 6px', fontStyle: 'italic' }}>
                No tags created yet
              </div>
            ) : (
              allTags.map(({ tag, count }) => {
                const isSelected = filter.tag?.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    onClick={() => onFilterChange({ tag: isSelected ? undefined : tag })}
                    className={`chip ${isSelected ? 'active' : ''}`}
                  >
                    <Tag size={10} />
                    <span>#{tag}</span>
                    <span style={{ opacity: 0.5 }}>{count}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer / SQLite Database Indicator */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <Database size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span>SQLite Database</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDiskSynced ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
          <CheckCircle2 size={13} />
          <span style={{ fontSize: '11px' }}>{isDiskSynced ? 'Synced' : 'Saving...'}</span>
        </div>
      </div>
    </aside>
  );
});
