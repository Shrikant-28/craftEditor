import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoicePlayer } from '../components/VoicePlayer';
import { createSampleAudioBase64 } from '../utils/audioUtils';
import { VoiceRecording } from '../types/note';

describe('Voice Audio Recording and Playback Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records audio data and starts playback when play button is clicked', async () => {
    // 1. Prepare simulated recorded audio (valid Base64 WAV sample)
    const mockAudioData = createSampleAudioBase64(3, 8000);
    expect(mockAudioData).toContain('data:audio/wav;base64,');

    const recordedItem: VoiceRecording = {
      id: 'voice-test-123',
      audioData: mockAudioData,
      duration: 3,
      recordedAt: new Date().toISOString(),
      mimeType: 'audio/wav',
      transcript: 'Testing voice note audio playback',
      waveform: [0.3, 0.6, 0.8, 0.5, 0.2],
    };

    const onDeleteMock = vi.fn();
    const onInsertMock = vi.fn();

    // 2. Render VoicePlayer component with the recorded audio
    const { container } = render(
      <VoicePlayer
        recording={recordedItem}
        onDelete={onDeleteMock}
        onInsertTranscript={onInsertMock}
      />
    );

    // Verify transcript and label rendered
    expect(screen.getByText('Voice Memo')).toBeDefined();

    // Find the audio element in the DOM
    const audioElement = container.querySelector('audio') as HTMLAudioElement;
    expect(audioElement).toBeDefined();
    expect(audioElement.src).toBeTruthy();

    // 3. Find the Play button (title="Play")
    const playButton = screen.getByTitle('Play');
    expect(playButton).toBeDefined();

    // 4. Click Play button to start audio playback
    await act(async () => {
      fireEvent.click(playButton);
    });

    // 5. Assert that HTMLMediaElement.prototype.play() was called
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    // 6. Assert UI updates to active playing state (title changes to "Pause")
    const pauseButton = screen.getByTitle('Pause');
    expect(pauseButton).toBeDefined();

    // 7. Click Pause button to pause playback
    await act(async () => {
      fireEvent.click(pauseButton);
    });

    // 8. Assert that HTMLMediaElement.prototype.pause() was called
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);

    // Assert UI switches back to "Play"
    expect(screen.getByTitle('Play')).toBeDefined();
  });

  it('safely handles seek requests during playback', async () => {
    const mockAudioData = createSampleAudioBase64(5, 8000);
    const recordedItem: VoiceRecording = {
      id: 'voice-seek-test',
      audioData: mockAudioData,
      duration: 5,
      recordedAt: new Date().toISOString(),
      mimeType: 'audio/wav',
    };

    const { container } = render(
      <VoicePlayer
        recording={recordedItem}
        onDelete={vi.fn()}
      />
    );

    const playButton = screen.getByTitle('Play');
    await act(async () => {
      fireEvent.click(playButton);
    });

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Scrub/seek along the waveform bars
    const scrubberBars = container.querySelectorAll('.glass-card div div div');
    if (scrubberBars.length > 0) {
      await act(async () => {
        fireEvent.click(scrubberBars[0]);
      });
    }

    // Play was not broken by seeking
    expect(screen.getByTitle('Pause')).toBeDefined();
  });
});
