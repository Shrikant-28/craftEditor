import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteEditor } from '../components/NoteEditor';
import { Note } from '../types/note';

let activeMockInstance: MockSpeechRecognition | null = null;

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: ((event: any) => void) | null = null;

  start = vi.fn();
  abort = vi.fn();
  stop = vi.fn();

  constructor() {
    activeMockInstance = this;
  }
}

describe('NoteEditor Voice-Based Dictation / Typing Feature', () => {
  const initialNote: Note = {
    id: 'note-dictate-1',
    title: 'Dictation Test Note',
    content: 'Initial sentence.',
    isPinned: false,
    tags: ['testing'],
    category: 'General',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    activeMockInstance = null;
    (window as any).SpeechRecognition = MockSpeechRecognition;
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;
  });

  it('starts voice dictation with interimResults=true and displays active banner', async () => {
    const onUpdateMock = vi.fn();
    const onDeleteMock = vi.fn();

    render(
      <NoteEditor
        note={initialNote}
        onUpdateNote={onUpdateMock}
        onDeleteNote={onDeleteMock}
        categories={['General']}
      />
    );

    const dictateBtn = screen.getByRole('button', { name: /dictate/i });
    expect(dictateBtn).toBeDefined();

    // Click Dictate to start
    fireEvent.click(dictateBtn);

    expect(activeMockInstance).not.toBeNull();
    expect(activeMockInstance!.start).toHaveBeenCalledTimes(1);
    expect(activeMockInstance!.continuous).toBe(true);
    expect(activeMockInstance!.interimResults).toBe(true);

    // Active banner appears
    expect(screen.getByText(/Voice Typing Active:/i)).toBeDefined();
    expect(screen.getByText(/Listening for speech.../i)).toBeDefined();
  });

  it('streams interim speech results and commits finalized speech into note', async () => {
    const onUpdateMock = vi.fn();
    const onDeleteMock = vi.fn();

    render(
      <NoteEditor
        note={initialNote}
        onUpdateNote={onUpdateMock}
        onDeleteNote={onDeleteMock}
        categories={['General']}
      />
    );

    const dictateBtn = screen.getByRole('button', { name: /dictate/i });
    fireEvent.click(dictateBtn);

    // Simulate interim speech event
    act(() => {
      activeMockInstance!.onresult?.({
        resultIndex: 0,
        results: [
          [{ transcript: 'This is spoken text' }],
        ],
      });
    });

    // Verify interim text displayed in live banner
    expect(screen.getByText(/"This is spoken text..."\s*/i)).toBeDefined();

    // Simulate finalized speech event
    act(() => {
      const finalResultItem = [{ transcript: 'This is spoken text' }];
      (finalResultItem as any).isFinal = true;
      activeMockInstance!.onresult?.({
        resultIndex: 0,
        results: [finalResultItem],
      });
    });

    // Content should have been updated with proper spacing
    expect(onUpdateMock).toHaveBeenCalled();
    const updatedNote = onUpdateMock.mock.calls[0][0];
    expect(updatedNote.content).toBe('Initial sentence. This is spoken text');
  });

  it('does not terminate dictation when transient no-speech occurs', async () => {
    const onUpdateMock = vi.fn();
    const onDeleteMock = vi.fn();

    render(
      <NoteEditor
        note={initialNote}
        onUpdateNote={onUpdateMock}
        onDeleteNote={onDeleteMock}
        categories={['General']}
      />
    );

    const dictateBtn = screen.getByRole('button', { name: /dictate/i });
    fireEvent.click(dictateBtn);

    // Simulate transient no-speech error
    act(() => {
      activeMockInstance!.onerror?.({ error: 'no-speech' });
    });

    // Voice typing active banner should still be visible
    expect(screen.getByText(/Voice Typing Active:/i)).toBeDefined();
    expect(dictateBtn.textContent).toContain('Listening...');
  });

  it('stops voice dictation and cleans up when Done Typing is clicked', async () => {
    const onUpdateMock = vi.fn();
    const onDeleteMock = vi.fn();

    render(
      <NoteEditor
        note={initialNote}
        onUpdateNote={onUpdateMock}
        onDeleteNote={onDeleteMock}
        categories={['General']}
      />
    );

    const dictateBtn = screen.getByRole('button', { name: /dictate/i });
    fireEvent.click(dictateBtn);

    const doneBtn = screen.getByRole('button', { name: /done typing/i });
    fireEvent.click(doneBtn);

    expect(activeMockInstance!.abort).toHaveBeenCalled();
    expect(screen.queryByText(/Voice Typing Active:/i)).toBeNull();
  });
});
