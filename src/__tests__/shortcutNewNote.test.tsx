import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { App } from '../App';

describe('Ctrl+N Shortcut for Creating New Note', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clean mock electronAPI
    delete (window as any).electronAPI;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates a new note when Ctrl+N keyboard event is fired', async () => {
    render(<App />);

    fireEvent.keyDown(window, {
      key: 'n',
      ctrlKey: true,
    });

    // Check that a note titled "New Note" appears in the NoteList or Title input
    const noteCard = await screen.findByText('New Note');
    expect(noteCard).toBeDefined();
  });

  it('creates a new note when Cmd+N keyboard event is fired on macOS', async () => {
    render(<App />);

    fireEvent.keyDown(window, {
      key: 'n',
      metaKey: true,
    });

    const noteCard = await screen.findByText('New Note');
    expect(noteCard).toBeDefined();
  });

  it('triggers note creation via window.electronAPI.onNewNote IPC channel', async () => {
    let registeredCallback: (() => void) | null = null;
    (window as any).electronAPI = {
      isMaximized: vi.fn().mockResolvedValue(false),
      getAppVersion: vi.fn().mockResolvedValue('1.1.1'),
      loadNotes: vi.fn().mockResolvedValue([]),
      saveNotes: vi.fn().mockResolvedValue({ success: true }),
      onNewNote: vi.fn().mockImplementation((cb: () => void) => {
        registeredCallback = cb;
        return () => {
          registeredCallback = null;
        };
      }),
    };

    render(<App />);

    expect((window as any).electronAPI.onNewNote).toHaveBeenCalled();
    expect(registeredCallback).toBeDefined();

    // Allow initial loadNotes promise to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Trigger Electron IPC shortcut
    await act(async () => {
      registeredCallback?.();
    });

    const noteCard = await screen.findByText('New Note');
    expect(noteCard).toBeDefined();
  });

  it('displays Ctrl+N shortcut badge on New Note button in the UI', () => {
    render(<App />);

    // Check that Ctrl+N badge is rendered
    const kbdBadges = screen.getAllByText('Ctrl+N');
    expect(kbdBadges.length).toBeGreaterThan(0);
  });
});
