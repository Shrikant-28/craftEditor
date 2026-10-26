import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Pin,
  Trash2,
  Download,
  Eye,
  Edit3,
  Columns2,
  Check,
  Tag,
  Folder,
  Plus,
  X,
  Mic,
  Sparkles,
  Heading,
  Bold,
  Italic,
  Code,
  List,
  ListTodo,
  Quote,
  Table,
  Link as LinkIcon,
} from 'lucide-react';
import { Note, VoiceRecording } from '../types/note';
import { VoiceRecorder } from './VoiceRecorder';
import { VoicePlayer } from './VoicePlayer';
import { MarkdownRenderer } from './MarkdownRenderer';

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
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showRecorder, setShowRecorder] = useState(false);
  const [isDictating, setIsDictating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Interactive Task List Toggle (allows checking/unchecking boxes directly in Preview & Split modes)
  const handleToggleTask = useCallback((taskIndex: number, newChecked: boolean) => {
    const lines = note.content.split('\n');
    let currentIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (
        trimmed.startsWith('- [ ] ') ||
        trimmed.startsWith('- [x] ') ||
        trimmed.startsWith('* [ ] ') ||
        trimmed.startsWith('* [x] ')
      ) {
        if (currentIdx === taskIndex) {
          const bracketIdx = lines[i].indexOf('[');
          const prefix = lines[i].slice(0, bracketIdx + 1);
          const rest = lines[i].slice(lines[i].indexOf(']') + 1);
          lines[i] = `${prefix}${newChecked ? 'x' : ' '}${rest}`;
          onUpdateNote({
            ...note,
            content: lines.join('\n'),
            updatedAt: new Date().toISOString(),
          });
          break;
        }
        currentIdx++;
      }
    }
  }, [note, onUpdateNote]);

  // Quick Markdown formatting helpers
  const insertFormatting = useCallback((before: string, after = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = note.content.slice(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;
    const newContent = note.content.slice(0, start) + replacement + note.content.slice(end);

    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selected.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [note, onUpdateNote]);

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

        {/* Right: Actions & View Mode Segmented Controls */}
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

          {/* View Mode Segmented Buttons: Edit | Split | Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('edit')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'edit' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: viewMode === 'edit' ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                transition: 'all 0.15s ease',
              }}
              title="Markdown Editor Mode"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'split' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                color: viewMode === 'split' ? '#c4b5fd' : 'var(--text-tertiary)',
                transition: 'all 0.15s ease',
              }}
              title="Side-by-side Live Editor & Markdown Preview"
            >
              <Columns2 size={13} />
              <span>Split</span>
            </button>

            <button
              onClick={() => setViewMode('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'preview' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: viewMode === 'preview' ? 'var(--accent-emerald)' : 'var(--text-tertiary)',
                transition: 'all 0.15s ease',
              }}
              title="Native Rendered Markdown with Syntax Highlighting"
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
          </div>

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

      {/* Quick Markdown Formatting Helper Toolbar (in edit or split modes) */}
      {(viewMode === 'edit' || viewMode === 'split') && (
        <div
          style={{
            padding: '4px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginRight: '4px', fontWeight: 600 }}>
            Insert:
          </span>
          <button
            onClick={() => insertFormatting('## ', '', 'Section Heading')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Heading 2 (## )"
          >
            <Heading size={13} />
          </button>
          <button
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Bold (**text**)"
          >
            <Bold size={13} />
          </button>
          <button
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Italic (*text*)"
          >
            <Italic size={13} />
          </button>
          <button
            onClick={() => insertFormatting('`', '`', 'code')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Inline Code (`code`)"
          >
            <Code size={13} />
          </button>
          <button
            onClick={() =>
              insertFormatting(
                '```typescript\n// Syntax highlighted code block\nconst calculateScore = (items: number[]): number => {\n  return items.reduce((sum, item) => sum + item, 0);\n};\n```\n',
                '',
                ''
              )
            }
            className="btn-icon"
            style={{ width: '26px', height: '26px', color: 'var(--accent-cyan)' }}
            title="Syntax Highlighted Code Block (```lang)"
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{'</>'}</span>
          </button>
          <button
            onClick={() => insertFormatting('- [ ] ', '', 'Task item')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Task List Item (- [ ])"
          >
            <ListTodo size={13} />
          </button>
          <button
            onClick={() => insertFormatting('- ', '', 'List item')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Bullet List Item (- )"
          >
            <List size={13} />
          </button>
          <button
            onClick={() => insertFormatting('> ', '', 'Important quote note')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Blockquote (> )"
          >
            <Quote size={13} />
          </button>
          <button
            onClick={() =>
              insertFormatting(
                '| Feature | Status | Priority |\n| :--- | :---: | ---: |\n| Native Markdown | Done | High |\n| Syntax Highlighting | Done | High |\n',
                '',
                ''
              )
            }
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Markdown Table"
          >
            <Table size={13} />
          </button>
          <button
            onClick={() => insertFormatting('[', '](https://example.com)', 'Link description')}
            className="btn-icon"
            style={{ width: '26px', height: '26px' }}
            title="Hyperlink ([text](url))"
          >
            <LinkIcon size={13} />
          </button>
        </div>
      )}

      {/* Note Body: Single Editor, Split View, or Native Rendered Markdown */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor Pane (shown in 'edit' or 'split' mode) */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            style={{
              flex: viewMode === 'split' ? '0 0 50%' : '1',
              padding: '12px 24px 20px 24px',
              overflowY: 'auto',
              borderRight: viewMode === 'split' ? '1px solid var(--border-subtle)' : 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={handleContentChange}
              placeholder="Write markdown content here... (Supports headers, syntax-highlighted code blocks ```lang, task lists - [ ], tables, quotes, and links)"
              style={{
                width: '100%',
                flex: 1,
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
          </div>
        )}

        {/* Native Markdown Preview Pane (shown in 'split' or 'preview' mode) */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            style={{
              flex: viewMode === 'split' ? '0 0 50%' : '1',
              padding: '14px 24px 24px 24px',
              overflowY: 'auto',
              backgroundColor: viewMode === 'split' ? 'rgba(0, 0, 0, 0.15)' : 'transparent',
            }}
          >
            <MarkdownRenderer content={note.content} onToggleTask={handleToggleTask} />
          </div>
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
          <span>
            Mode:{' '}
            <strong style={{ color: viewMode === 'edit' ? 'var(--accent-cyan)' : viewMode === 'split' ? '#c4b5fd' : 'var(--accent-emerald)' }}>
              {viewMode.toUpperCase()}
            </strong>
          </span>
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
