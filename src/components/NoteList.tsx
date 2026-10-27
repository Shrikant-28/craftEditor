import React, { useMemo } from 'react';
import { Pin, SearchX, Mic, FileText, Plus } from 'lucide-react';
import { SearchMatch } from '../types/note';
import { formatDuration } from '../utils/audioUtils';

interface NoteListProps {
  matches: SearchMatch[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onTogglePin: (noteId: string, e: React.MouseEvent) => void;
  onClearFilters: () => void;
  totalNotes?: number;
  onCreateNote?: () => void;
}

interface NoteListItemProps {
  match: SearchMatch;
  isSelected: boolean;
  onSelectNote: (noteId: string) => void;
  onTogglePin: (noteId: string, e: React.MouseEvent) => void;
}

const NoteListItem: React.FC<NoteListItemProps> = React.memo(({
  match,
  isSelected,
  onSelectNote,
  onTogglePin,
}) => {
  const { note, highlightedTitle, highlightedSnippet, matchedTags } = match;

  const formattedDate = useMemo(() => {
    return new Date(note.updatedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }, [note.updatedAt]);

  const totalVoiceDuration = useMemo(() => {
    if (!Array.isArray(note.voiceRecordings) || note.voiceRecordings.length === 0) return 0;
    return note.voiceRecordings.reduce((sum, r) => sum + (r.duration || 0), 0);
  }, [note.voiceRecordings]);

  return (
    <div
      onClick={() => onSelectNote(note.id)}
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: isSelected ? 'var(--bg-card-active)' : 'var(--bg-card)',
        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
        boxShadow: isSelected ? '0 0 16px rgba(6, 182, 212, 0.15)' : 'none',
      }}
      className="glass-card"
    >
      {/* Header: Title and Pin */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: '1.3',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />

        <button
          onClick={(e) => onTogglePin(note.id, e)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: note.isPinned ? 'var(--accent-amber)' : 'var(--text-tertiary)',
            opacity: note.isPinned ? 1 : 0.4,
            transition: 'all 0.15s ease',
          }}
          title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
        >
          <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Snippet preview with highlighted tokens */}
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.45',
          marginBottom: '10px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
        dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
      />

      {/* Metadata Footer: Category, Voice Badge, Tags, Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: 'var(--border-subtle)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {note.category}
          </span>

          {Array.isArray(note.voiceRecordings) && note.voiceRecordings.length > 0 && (
            <span
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.14)',
                color: 'var(--accent-cyan)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
              }}
              title={`${note.voiceRecordings.length} voice memo(s)`}
            >
              <Mic size={10} />
              <span>{formatDuration(totalVoiceDuration)}</span>
            </span>
          )}

          {note.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              style={{
                color: matchedTags.includes(tag) ? 'var(--accent-amber)' : 'var(--text-tertiary)',
                fontWeight: matchedTags.includes(tag) ? 600 : 400,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        <span>{formattedDate}</span>
      </div>
    </div>
  );
});

export const NoteList: React.FC<NoteListProps> = React.memo(({
  matches,
  selectedNoteId,
  onSelectNote,
  onTogglePin,
  onClearFilters,
  totalNotes = 0,
  onCreateNote,
}) => {
  if (matches.length === 0) {
    const isDbEmpty = totalNotes === 0;

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
        }}
      >
        {isDbEmpty ? (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                marginBottom: '14px',
              }}
            >
              <FileText size={24} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No notes in database
            </p>
            <p style={{ fontSize: '12px', maxWidth: '220px', marginBottom: '16px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              Your SQLite database is ready. Create your first note to begin.
            </p>
            {onCreateNote && (
              <button
                onClick={onCreateNote}
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '7px 14px', gap: '6px' }}
                title="Create Note (Ctrl+N)"
              >
                <Plus size={14} />
                <span>Create First Note</span>
                <kbd
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    fontWeight: 500,
                    marginLeft: '2px',
                  }}
                >
                  Ctrl+N
                </kbd>
              </button>
            )}
          </>
        ) : (
          <>
            <SearchX size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              No matching notes found
            </p>
            <p style={{ fontSize: '12px', maxWidth: '240px', marginBottom: '16px' }}>
              Try adjusting your query, or removing active tags and filters.
            </p>
            <button onClick={onClearFilters} className="btn btn-ghost" style={{ fontSize: '12px' }}>
              Reset Search & Filters
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {matches.map((match) => (
        <NoteListItem
          key={match.note.id}
          match={match}
          isSelected={match.note.id === selectedNoteId}
          onSelectNote={onSelectNote}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
});
