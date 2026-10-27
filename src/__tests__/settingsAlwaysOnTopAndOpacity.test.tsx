import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { TitleBar } from '../components/TitleBar';
import { SettingsModal } from '../components/SettingsModal';

describe('Application Settings: Always on Top & Opacity for Background Text', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).electronAPI;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders settings icon on right side of TitleBar and opens settings modal when clicked', async () => {
    render(<App />);

    // Check that settings icon button exists on right side
    const settingsButton = screen.getByRole('button', { name: /open application settings/i });
    expect(settingsButton).toBeDefined();

    // Click settings icon
    fireEvent.click(settingsButton);

    // Modal should now be visible
    expect(screen.getByText('Application Settings')).toBeDefined();
    expect(screen.getByText('Always On Top of All Screens')).toBeDefined();
    expect(screen.getAllByText(/Window Opacity/i).length).toBeGreaterThan(0);
  });

  it('defaults application to Always On Top of all screens', () => {
    render(<App />);

    // Open settings
    const settingsButton = screen.getByRole('button', { name: /open application settings/i });
    fireEvent.click(settingsButton);

    // Verify toggle switch is active by default
    const switchBtn = screen.getByRole('switch');
    expect(switchBtn.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('ACTIVE')).toBeDefined();
  });

  it('toggles Always On Top state and communicates with Electron IPC when available', async () => {
    const mockSetAlwaysOnTop = vi.fn().mockResolvedValue(true);
    (window as any).electronAPI = {
      isMaximized: vi.fn().mockResolvedValue(false),
      getAppVersion: vi.fn().mockResolvedValue('1.1.1'),
      loadNotes: vi.fn().mockResolvedValue([]),
      saveNotes: vi.fn().mockResolvedValue({ success: true }),
      setAlwaysOnTop: mockSetAlwaysOnTop,
      setOpacity: vi.fn().mockResolvedValue(0.85),
    };

    render(<App />);

    // Quick pin button on TitleBar
    const quickPinBtn = screen.getByRole('button', { name: /toggle always on top/i });
    expect(quickPinBtn).toBeDefined();

    // Toggle off
    await act(async () => {
      fireEvent.click(quickPinBtn);
    });

    expect(mockSetAlwaysOnTop).toHaveBeenCalledWith(false);
    expect(localStorage.getItem('aura_notes_always_on_top')).toBe('false');

    // Toggle back on
    await act(async () => {
      fireEvent.click(quickPinBtn);
    });

    expect(mockSetAlwaysOnTop).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('aura_notes_always_on_top')).toBe('true');
  });

  it('adjusts window opacity via slider and presets to view background text', async () => {
    const mockSetOpacity = vi.fn().mockResolvedValue(0.7);
    (window as any).electronAPI = {
      isMaximized: vi.fn().mockResolvedValue(false),
      getAppVersion: vi.fn().mockResolvedValue('1.1.1'),
      loadNotes: vi.fn().mockResolvedValue([]),
      saveNotes: vi.fn().mockResolvedValue({ success: true }),
      setAlwaysOnTop: vi.fn().mockResolvedValue(true),
      setOpacity: mockSetOpacity,
    };

    render(<App />);

    // Open settings
    const settingsButton = screen.getByRole('button', { name: /open application settings/i });
    fireEvent.click(settingsButton);

    // Click 70% Translucent preset button
    const preset70 = screen.getByText('70% Translucent');
    await act(async () => {
      fireEvent.click(preset70);
    });

    expect(mockSetOpacity).toHaveBeenCalledWith(0.7);
    expect(localStorage.getItem('aura_notes_window_opacity')).toBe('0.7');

    // Click 85% Optimal preset button
    const preset85 = screen.getByText('85% Optimal');
    await act(async () => {
      fireEvent.click(preset85);
    });

    expect(mockSetOpacity).toHaveBeenCalledWith(0.85);
    expect(localStorage.getItem('aura_notes_window_opacity')).toBe('0.85');
  });

  it('opens and closes settings via Ctrl+, keyboard shortcut', async () => {
    render(<App />);

    // Press Ctrl+,
    fireEvent.keyDown(window, {
      key: ',',
      ctrlKey: true,
    });

    expect(screen.getByText('Application Settings')).toBeDefined();

    // Press Ctrl+, again to toggle closed
    fireEvent.keyDown(window, {
      key: ',',
      ctrlKey: true,
    });

    expect(screen.queryByText('Application Settings')).toBeNull();
  });
});
