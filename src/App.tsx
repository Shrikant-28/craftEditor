import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { MeetingPipelineModal } from './components/MeetingPipelineModal';
import { Note, SearchFilter } from './types/note';
import { executeSearch } from './utils/searchEngine';
import { Database, Plus, Mic } from 'lucide-react';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SearchFilter>({ query: '' });
  const [isDiskSynced, setIsDiskSynced] = useState<boolean>(true);

  // Theme state (dark / light mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('aura_notes_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('aura_notes_theme', theme);
    } catch {}
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Responsive layout state (Desktop >= 1024px, Tablet 768px-1023px, Mobile < 768px)
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const [openRecorderTrigger, setOpenRecorderTrigger] = useState<number>(0);
  const [isMeetingPipelineOpen, setIsMeetingPipelineOpen] = useState(false);

  const handleInsertMeetingMarkdown = useCallback((markdown: string) => {
    if (selectedNoteId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNoteId
            ? {
                ...n,
                content: n.content ? `${n.content.trim()}\n\n${markdown}` : markdown,
                updatedAt: new Date().toISOString(),
              }
            : n
        )
      );
    }
  }, [selectedNoteId]);

  const handleCreateMeetingNote = useCallback((title: string, markdown: string) => {
    const newNote: Note = {
      id: `meeting-${Date.now()}`,
      title,
      content: markdown,
      category: 'Engineering',
      tags: ['meeting', 'action-items', 'summary'],
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      voiceRecordings: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  }, []);

  // 1. Initial Load from Local SQLite Database (aura_notes.sqlite)
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.loadNotes().then((saved) => {
        if (Array.isArray(saved) && saved.length > 0) {
          setNotes(saved);
          setSelectedNoteId(saved[0].id);
        } else {
          setNotes([]);
          setSelectedNoteId(null);
        }
      });
    } else {
      // Browser preview fallback
      try {
        const stored = localStorage.getItem('aura_notes_sqlite_store');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotes(parsed);
            setSelectedNoteId(parsed[0].id);
          }
        }
      } catch {}
    }
  }, []);

  // 2. Debounced persistence to SQLite Database (800ms debounce)
  const isInitialMount = useRef(true);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsDiskSynced(false);
    const timer = setTimeout(() => {
      if (window.electronAPI) {
        window.electronAPI.saveNotes(notes).then((res) => {
          setIsDiskSynced(res.success);
        });
      } else {
        try {
          localStorage.setItem('aura_notes_sqlite_store', JSON.stringify(notes));
          setIsDiskSynced(true);
        } catch {
          setIsDiskSynced(false);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [notes]);

  // Flush persistence synchronously before window closes or refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.electronAPI) {
        window.electronAPI.saveNotes(notesRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const [customCategories, setCustomCategories] = useState<string[]>([
    'General',
    'Engineering',
    'Personal',
    'Research',
  ]);

  // Combined single-pass calculation for categories and tags
  const { categories, allTags } = useMemo(() => {
    const categorySet = new Set<string>(customCategories);
    const tagCountMap = new Map<string, number>();

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.category) categorySet.add(n.category);
      const tags = n.tags;
      for (let j = 0; j < tags.length; j++) {
        const t = tags[j];
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
      }
    }

    const sortedCategories = Array.from(categorySet).sort();
    const sortedTags: { tag: string; count: number }[] = [];
    tagCountMap.forEach((count, tag) => {
      sortedTags.push({ tag, count });
    });
    sortedTags.sort((a, b) => b.count - a.count);

    return { categories: sortedCategories, allTags: sortedTags };
  }, [notes, customCategories]);

  // Execute high-speed scored search
  const { matches, durationMs } = useMemo(() => {
    return executeSearch(notes, filter);
  }, [notes, filter]);

  // Memoized handlers
  const handleFilterChange = useCallback((update: Partial<SearchFilter>) => {
    setFilter((prev) => ({ ...prev, ...update }));
  }, []);

  const handleCreateNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      content: '# New Note\n\nStart typing your note here...',
      category: categories[0] || 'General',
      tags: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  }, [categories]);

  const handleCreateVoiceNote = useCallback(() => {
    const formattedDate = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: `Voice Memo - ${formattedDate}`,
      content: `# Voice Memo\n\n*Recorded on ${new Date().toLocaleString()}*\n\n`,
      category: 'Voice Notes',
      tags: ['voice-memo'],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      voiceRecordings: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setOpenRecorderTrigger(Date.now());
  }, []);

  const handleUpdateNote = useCallback((updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [selectedNoteId]);

  const handleTogglePin = useCallback((noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilter({ query: '', tag: undefined, category: undefined, onlyPinned: false, onlyVoice: false });
  }, []);

  const handleAddCategory = useCallback((newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return '';
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    setCustomCategories((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
    return formatted;
  }, []);

  const currentSelectedNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 1. Desktop Window TitleBar */}
      <TitleBar
        totalNotes={notes.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        isMobile={isMobile}
      />

      {/* 2. Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Desktop Fixed Sidebar */}
        {!isMobile && !isTablet && isSidebarOpen && (
          <Sidebar
            notes={notes}
            filter={filter}
            onFilterChange={handleFilterChange}
            onCreateNote={handleCreateNote}
            onCreateVoiceNote={handleCreateVoiceNote}
            categories={categories}
            allTags={allTags}
            isDiskSynced={isDiskSynced}
            onAddCategory={handleAddCategory}
            onOpenMeetingPipeline={() => setIsMeetingPipelineOpen(true)}
          />
        )}

        {/* Mobile & Tablet Overlay Drawer */}
        {(isMobile || isTablet) && isSidebarOpen && (
          <>
            <div
              className="sidebar-overlay"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="sidebar-drawer">
              <Sidebar
                notes={notes}
                filter={filter}
                onFilterChange={(update) => {
                  handleFilterChange(update);
                  setIsSidebarOpen(false);
                  if (isMobile) setMobileView('list');
                }}
                onCreateNote={handleCreateNote}
                onCreateVoiceNote={handleCreateVoiceNote}
                categories={categories}
                allTags={allTags}
                isDiskSynced={isDiskSynced}
                onAddCategory={handleAddCategory}
                onOpenMeetingPipeline={() => {
                  setIsSidebarOpen(false);
                  setIsMeetingPipelineOpen(true);
                }}
              />
            </div>
          </>
        )}

        {/* Middle Column: Search + Note List Cards */}
        {(!isMobile || mobileView === 'list') && (
          <div
            style={{
              width: isMobile ? '100%' : '320px',
              minWidth: isMobile ? '100%' : '280px',
              borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-main)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              flexShrink: 0,
            }}
          >
            <SearchBar
              filter={filter}
              onFilterChange={handleFilterChange}
              resultCount={matches.length}
              durationMs={durationMs}
            />

            <NoteList
              matches={matches}
              selectedNoteId={selectedNoteId}
              onSelectNote={(id) => {
                setSelectedNoteId(id);
                if (isMobile) setMobileView('editor');
              }}
              onTogglePin={handleTogglePin}
              onClearFilters={handleClearFilters}
              totalNotes={notes.length}
              onCreateNote={handleCreateNote}
            />
          </div>
        )}

        {/* Right Column: Note Editor / Preview */}
        {(!isMobile || mobileView === 'editor') && (
          <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden', minWidth: 0, width: isMobile ? '100%' : undefined }}>
            {currentSelectedNote ? (
              <NoteEditor
                note={currentSelectedNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={(id) => {
                  handleDeleteNote(id);
                  if (isMobile) setMobileView('list');
                }}
                categories={categories}
                onAddCategory={handleAddCategory}
                openRecorderTrigger={openRecorderTrigger}
                onOpenMeetingPipeline={() => setIsMeetingPipelineOpen(true)}
                onBack={isMobile ? () => setMobileView('list') : undefined}
                isMobile={isMobile}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: '14px',
                  gap: '14px',
                  padding: '40px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.15))',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)',
                    boxShadow: '0 8px 24px rgba(6, 182, 212, 0.15)',
                  }}
                >
                  <Database size={32} />
                </div>

                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                  Local SQLite Database Connected
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '380px', lineHeight: '1.6' }}>
                  All mock data has been removed. Notes and voice memos are stored directly in your local ACID-compliant SQLite database (<code style={{ color: 'var(--accent-cyan)' }}>aura_notes.sqlite</code>).
                </p>

                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <button onClick={handleCreateNote} className="btn btn-primary" style={{ padding: '8px 18px', gap: '6px' }}>
                    <Plus size={15} />
                    <span>New Note</span>
                  </button>
                  <button
                    onClick={handleCreateVoiceNote}
                    className="btn btn-ghost"
                    style={{
                      padding: '8px 18px',
                      gap: '6px',
                      color: 'var(--accent-cyan)',
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                    }}
                  >
                    <Mic size={15} />
                    <span>Record Voice Memo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meeting Notes Pipeline Modal */}
      <MeetingPipelineModal
        isOpen={isMeetingPipelineOpen}
        onClose={() => setIsMeetingPipelineOpen(false)}
        currentNote={currentSelectedNote}
        onInsertMarkdown={handleInsertMeetingMarkdown}
        onCreateNewMeetingNote={handleCreateMeetingNote}
      />
    </div>
  );
};
