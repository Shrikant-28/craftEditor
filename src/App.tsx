import React, { useState, useEffect, useMemo } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { SearchEvidenceModal } from './components/SearchEvidenceModal';
import { SystemInfoModal } from './components/SystemInfoModal';
import { Note, SearchFilter } from './types/note';
import { INITIAL_NOTES } from './data/initialNotes';
import { executeSearch } from './utils/searchEngine';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(INITIAL_NOTES[0].id);
  const [filter, setFilter] = useState<SearchFilter>({ query: '' });
  const [isDiskSynced, setIsDiskSynced] = useState<boolean>(true);

  // Modals state
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [openRecorderTrigger, setOpenRecorderTrigger] = useState<number>(0);

  // 1. Initial Load from Electron Disk Storage
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.loadNotes().then((saved) => {
        if (Array.isArray(saved) && saved.length > 0) {
          setNotes(saved);
          setSelectedNoteId(saved[0].id);
        }
      });
    }
  }, []);

  // 2. Persist to Electron Disk Storage whenever notes change
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.saveNotes(notes).then((res) => {
        setIsDiskSynced(res.success);
      });
    }
  }, [notes]);

  const [customCategories, setCustomCategories] = useState<string[]>([
    'Engineering',
    'Research',
    'Product',
    'Design',
  ]);

  // Derive unique categories and tags with counts
  const categories = useMemo(() => {
    const set = new Set<string>(customCategories);
    notes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set).sort();
  }, [notes, customCategories]);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      n.tags.forEach((t) => {
        map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  // Execute high-speed search & scoring
  const { matches, durationMs } = useMemo(() => {
    return executeSearch(notes, filter);
  }, [notes, filter]);

  // Handlers
  const handleFilterChange = (update: Partial<SearchFilter>) => {
    setFilter((prev) => ({ ...prev, ...update }));
  };

  const handleCreateNote = () => {
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
  };

  const handleCreateVoiceNote = () => {
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
  };

  const handleUpdateNote = (updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const handleTogglePin = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleClearFilters = () => {
    setFilter({ query: '', tag: undefined, category: undefined, onlyPinned: false, onlyVoice: false });
  };

  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return '';
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    setCustomCategories((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
    return formatted;
  };

  const currentSelectedNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 1. Desktop Window TitleBar */}
      <TitleBar
        onOpenSystemInfo={() => setIsSystemModalOpen(true)}
        onOpenSearchEvidence={() => setIsEvidenceModalOpen(true)}
        totalNotes={notes.length}
      />

      {/* 2. Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
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
        />

        {/* Middle Column: Search + Note List Cards */}
        <div
          style={{
            width: '340px',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-main)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
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
            onSelectNote={setSelectedNoteId}
            onTogglePin={handleTogglePin}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Right Column: Note Editor / Preview */}
        <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
          {currentSelectedNote ? (
            <NoteEditor
              note={currentSelectedNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              categories={categories}
              onAddCategory={handleAddCategory}
              openRecorderTrigger={openRecorderTrigger}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '14px',
              }}
            >
              Select or create a note to start editing
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SearchEvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
      />
      <SystemInfoModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
      />
    </div>
  );
};
