import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Pin,
  Trash2,
  Download,
  Eye,
  Edit3,
  Check,
  Tag,
  Folder,
  Plus,
  X,
  Mic,
  Sparkles,
} from 'lucide-react';
import { Note, VoiceRecording } from '../types/note';
import { VoiceRecorder } from './VoiceRecorder';
import { VoicePlayer } from './VoicePlayer';

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (updated: Note) => void;
  onDeleteNote: (noteId: string) => void;
  categories: string[];
  onAddCategory?: (name: string) => string | void;
  openRecorderTrigger?: number;
}

// Zero-allocation word counter to avoid allocating huge string arrays with split()
function countWords(str: string): number {
  let count = 0;
  let inWord = false;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 32) {
      inWord = false;
    } else if (!inWord) {
      inWord = true;
      count++;
    }
  }
  return count;
}

export const NoteEditor: React.FC<NoteEditorProps> = React.memo(({
  note,
  onUpdateNote,
  onDeleteNote,
  categories,
  onAddCategory,
  openRecorderTrigger,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showRecorder, setShowRecorder] = useState(false);
  const [isDictating, setIsDictating] = useState(false);

  const dictationRef = useRef<any>(null);
  const exportTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (openRecorderTrigger && openRecorderTrigger > 0) {
      setShowRecorder(true);
    }
  }, [openRecorderTrigger]);

  // Clean up any ongoing SpeechRecognition dictation and timer on unmount
  useEffect(() => {
    return () => {
      if (dictationRef.current) {
        try {
          dictationRef.current.onresult = null;
          dictationRef.current.onerror = null;
          dictationRef.current.onend = null;
          dictationRef.current.abort();
        } catch {}
        dictationRef.current = null;
      }
      if (exportTimerRef.current) {
        clearTimeout(exportTimerRef.current);
      }
    };
  }, []);

  const wordCount = useMemo(() => countWords(note.content), [note.content]);
  const charCount = note.content.length;
  const hasVoiceRecordings = Array.isArray(note.voiceRecordings) && note.voiceRecordings.length > 0;

  const handleSaveVoiceRecording = useCallback((recording: VoiceRecording) => {
    const existing = note.voiceRecordings || [];
    onUpdateNote({
      ...note,
      voiceRecordings: [recording, ...existing],
      updatedAt: new Date().toISOString(),
    });
    setShowRecorder(false);
  }, [note, onUpdateNote]);

  const handleDeleteVoiceRecording = useCallback((recordingId: string) => {
    const current = note.voiceRecordings || [];
    onUpdateNote({
      ...note,
      voiceRecordings: current.filter((r) => r.id !== recordingId),
      updatedAt: new Date().toISOString(),
    });
  }, [note, onUpdateNote]);

  const handleInsertTranscript = useCallback((transcriptText: string) => {
    const quote = `\n\n> 🎙️ **Voice Memo:**\n> "${transcriptText}"\n`;
    onUpdateNote({
      ...note,
      content: (note.content ? note.content + quote : quote).trim(),
      updatedAt: new Date().toISOString(),
    });
  }, [note, onUpdateNote]);

  const toggleDictation = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setShowRecorder(true);
      return;
    }

    if (isDictating) {
      if (dictationRef.current) {
        try {
          dictationRef.current.onresult = null;
          dictationRef.current.onerror = null;
          dictationRef.current.onend = null;
          dictationRef.current.abort();
        } catch {}
        dictationRef.current = null;
      }
      setIsDictating(false);
    } else {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = navigator.language || 'en-US';

        recognition.onresult = (event: any) => {
          let newSpeech = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              newSpeech += event.results[i][0].transcript + ' ';
            }
          }
          if (newSpeech) {
            onUpdateNote({
              ...note,
              content: note.content + (note.content.length > 0 && !note.content.endsWith(' ') && !note.content.endsWith('\n') ? ' ' : '') + newSpeech,
              updatedAt: new Date().toISOString(),
            });
          }
        };

        recognition.onerror = () => {
          setIsDictating(false);
        };

        recognition.onend = () => {
          setIsDictating(false);
        };

        recognition.start();
        dictationRef.current = recognition;
        setIsDictating(true);
      } catch (err) {
        console.error('Dictation setup error:', err);
        setIsDictating(false);
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({
      ...note,
      title: e.target.value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNote({
      ...note,
      content: e.target.value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateNote({
      ...note,
      category: e.target.value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      setIsAddingCategory(false);
      return;
    }
    const addedName = onAddCategory ? onAddCategory(trimmed) : trimmed;
    const finalCategory = (typeof addedName === 'string' && addedName) ? addedName : trimmed;
    onUpdateNote({
      ...note,
      category: finalCategory,
      updatedAt: new Date().toISOString(),
    });
    setNewCategoryInput('');
    setIsAddingCategory(false);
  };

  const handleNewCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNewCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryInput('');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '').toLowerCase();
      if (!note.tags.includes(cleanTag)) {
        onUpdateNote({
          ...note,
          tags: [...note.tags, cleanTag],
          updatedAt: new Date().toISOString(),
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote({
      ...note,
      tags: note.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTogglePin = () => {
    onUpdateNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleExport = async () => {
    if (window.electronAPI) {
      setExportStatus('Exporting...');
      const result = await window.electronAPI.exportNote({
        title: note.title,
        content: note.content,
      });

      if (!result.canceled && result.filePath) {
        setExportStatus('Saved to disk!');
        if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
        exportTimerRef.current = window.setTimeout(() => setExportStatus(null), 3000);
      } else {
        setExportStatus(null);
      }
    } else {
      // Fallback web download
      const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'untitled'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Simple Markdown renderer for preview
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} style={{ fontSize: '24px', fontWeight: 700, margin: '16px 0 8px 0', color: '#f3f4f6' }}>
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} style={{ fontSize: '18px', fontWeight: 600, margin: '14px 0 6px 0', color: 'var(--accent-cyan)' }}>
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} style={{ fontSize: '15px', fontWeight: 600, margin: '12px 0 4px 0', color: '#e5e7eb' }}>
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- [x] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
            <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{line.replace('- [x] ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>○</span>
            <span>{line.replace('- [ ] ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} style={{ margin: '4px 0 4px 20px', color: 'var(--text-secondary)' }}>
            {line.substring(2)}
          </li>
        );
      }
      if (line.startsWith('```')) {
        return (
          <div key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#93c5fd', margin: '6px 0' }}>
            {line}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      return (
        <p key={idx} style={{ margin: '4px 0', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          {line}
        </p>
      );
    });
  };

  const renderedMarkdown = useMemo(() => {
    if (!isPreview) return null;
    return renderMarkdownPreview(note.content);
  }, [isPreview, note.content]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Left: Category & Tags Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Category Dropdown & Quick Add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Folder size={14} style={{ color: 'var(--accent-violet)' }} />
            {isAddingCategory ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={handleNewCategoryKeyDown}
                  placeholder="New category..."
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--accent-violet)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 8px',
                    fontSize: '12px',
                    color: '#fff',
                    outline: 'none',
                    width: '120px',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveNewCategory}
                  className="btn-icon"
                  style={{ width: '22px', height: '22px', color: 'var(--accent-emerald)' }}
                  title="Save Category (Enter)"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryInput('');
                  }}
                  className="btn-icon"
                  style={{ width: '22px', height: '22px', color: 'var(--text-tertiary)' }}
                  title="Cancel (Esc)"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={note.category}
                  onChange={handleCategoryChange}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} style={{ backgroundColor: '#111827' }}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="btn-icon"
                  style={{ width: '22px', height: '22px', borderRadius: '4px' }}
                  title="Quick add new category"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={13} style={{ color: 'var(--accent-cyan)' }} />
            {note.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  color: 'var(--accent-cyan)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                }}
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '10px',
                  }}
                >
                  ×
                </button>
              </span>
            ))}

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ add tag (Enter)"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                width: '100px',
              }}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Record Voice Note */}
          <button
            onClick={() => setShowRecorder(!showRecorder)}
            className="btn btn-ghost"
            style={{
              fontSize: '12px',
              padding: '6px 10px',
              color: showRecorder
                ? 'var(--accent-rose)'
                : hasVoiceRecordings
                ? 'var(--accent-cyan)'
                : 'var(--text-secondary)',
              backgroundColor: showRecorder
                ? 'rgba(244, 63, 94, 0.12)'
                : hasVoiceRecordings
                ? 'rgba(6, 182, 212, 0.1)'
                : undefined,
            }}
            title={showRecorder ? 'Close Voice Recorder' : 'Record Voice Note'}
          >
            <Mic size={14} />
            <span>
              {showRecorder
                ? 'Close Mic'
                : hasVoiceRecordings
                ? `Voice (${note.voiceRecordings!.length})`
                : 'Voice Note'}
            </span>
          </button>

          {/* Dictate Button */}
          <button
            onClick={toggleDictation}
            className="btn btn-ghost"
            style={{
              fontSize: '12px',
              padding: '6px 10px',
              color: isDictating ? 'var(--accent-rose)' : 'var(--text-secondary)',
              backgroundColor: isDictating ? 'rgba(244, 63, 94, 0.15)' : undefined,
            }}
            title={isDictating ? 'Stop speech dictation' : 'Voice typing / Dictate into note content'}
          >
            <Sparkles size={14} style={{ color: isDictating ? 'var(--accent-rose)' : 'var(--accent-violet)' }} />
            <span>{isDictating ? 'Listening...' : 'Dictate'}</span>
          </button>

          {/* Toggle Preview / Edit Mode */}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="btn btn-ghost"
            style={{ fontSize: '12px', padding: '6px 10px' }}
            title={isPreview ? 'Switch to Edit' : 'Preview Markdown'}
          >
            {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            <span>{isPreview ? 'Edit' : 'Preview'}</span>
          </button>

          {/* Pin/Unpin */}
          <button
            onClick={handleTogglePin}
            className="btn btn-ghost"
            style={{
              fontSize: '12px',
              padding: '6px 10px',
              color: note.isPinned ? 'var(--accent-amber)' : 'var(--text-secondary)',
            }}
            title={note.isPinned ? 'Unpin Note' : 'Pin Note'}
          >
            <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
            <span>{note.isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          {/* Export to File */}
          <button
            onClick={handleExport}
            className="btn btn-ghost"
            style={{ fontSize: '12px', padding: '6px 10px' }}
            title="Export note to Markdown (.md) file on disk"
          >
            <Download size={14} />
            <span>{exportStatus || 'Export .md'}</span>
          </button>

          {/* Delete Note */}
          <button
            onClick={() => onDeleteNote(note.id)}
            className="btn btn-ghost"
            style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--accent-rose)' }}
            title="Delete this note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div style={{ padding: '16px 24px 8px 24px' }}>
        <input
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Untitled Note..."
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {/* Voice Notes Section */}
      {(showRecorder || hasVoiceRecordings) && (
        <div style={{ padding: '0 24px 10px 24px' }}>
          {showRecorder && (
            <VoiceRecorder
              onSaveRecording={handleSaveVoiceRecording}
              onClose={() => setShowRecorder(false)}
              onInsertTranscriptDirectly={handleInsertTranscript}
            />
          )}

          {hasVoiceRecordings && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  <Mic size={14} />
                  <span>Voice Memos ({note.voiceRecordings!.length})</span>
                </div>
                {!showRecorder && (
                  <button
                    onClick={() => setShowRecorder(true)}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '3px 8px', gap: '4px', color: 'var(--accent-cyan)' }}
                  >
                    <Plus size={12} />
                    <span>Record Audio Clip</span>
                  </button>
                )}
              </div>

              {note.voiceRecordings!.map((rec) => (
                <VoicePlayer
                  key={rec.id}
                  recording={rec}
                  onDelete={handleDeleteVoiceRecording}
                  onInsertTranscript={handleInsertTranscript}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note Body: Editor or Preview */}
      <div style={{ flex: 1, padding: '8px 24px 20px 24px', overflowY: 'auto' }}>
        {isPreview ? (
          <div
            style={{
              lineHeight: '1.6',
              fontSize: '14px',
              color: 'var(--text-primary)',
            }}
          >
            {renderedMarkdown}
          </div>
        ) : (
          <textarea
            value={note.content}
            onChange={handleContentChange}
            placeholder="Write markdown content here... (Supports headers, bullet lists, checklist items, and code snippets)"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: '1.7',
              fontFamily: 'var(--font-mono)',
            }}
          />
        )}
      </div>

      {/* Footer Status Bar */}
      <div
        style={{
          padding: '8px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#070a12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>Last modified: {new Date(note.updatedAt).toLocaleTimeString()}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)' }}>
          <Check size={12} />
          <span>Auto-saved</span>
        </div>
      </div>
    </div>
  );
});
