import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { SettingsModal } from '../components/SettingsModal';
import { DEFAULT_SCREEN_PROTECTION_SETTINGS, ScreenProtectionSettings } from '../types/screenProtection';

describe('Screen Share Protection & App Exclusion (setContentProtection)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).electronAPI;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders Screen Share Privacy tab in SettingsModal with master toggle and meeting apps', () => {
    const handleUpdate = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isAlwaysOnTop={true}
        onToggleAlwaysOnTop={vi.fn()}
        windowOpacity={1.0}
        onChangeOpacity={vi.fn()}
        theme="dark"
        onToggleTheme={vi.fn()}
        screenProtection={DEFAULT_SCREEN_PROTECTION_SETTINGS}
        onUpdateScreenProtection={handleUpdate}
        isContentProtectionActive={true}
        runningProcesses={['ms-teams.exe']}
        initialTab="privacy"
      />
    );

    // Verify Tab Header
    expect(screen.getByText(/Screen Share Privacy/i)).toBeDefined();
    expect(screen.getByText('SHIELD ON')).toBeDefined();

    // Verify Master Card
    expect(screen.getByText('Hide from Screen Sharing & Meeting Apps')).toBeDefined();
    expect(screen.getByText('WINDOW HIDDEN IN SCREEN SHARE')).toBeDefined();

    // Verify Mode Selector
    expect(screen.getByText('Always Hidden (Recommended)')).toBeDefined();
    expect(screen.getByText('Smart Auto-Shield')).toBeDefined();

    // Verify Configured Apps
    expect(screen.getByText('Zoom Meetings')).toBeDefined();
    expect(screen.getByText('Microsoft Teams')).toBeDefined();
    expect(screen.getByText('Zoho Meeting')).toBeDefined();

    // Verify Running indicator for ms-teams.exe
    expect(screen.getByText('RUNNING NOW')).toBeDefined();

    // Verify Technical Explanation of setContentProtection
    expect(screen.getByText(/How setContentProtection works/i)).toBeDefined();
  });

  it('toggles master screen protection on and off', () => {
    const handleUpdate = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isAlwaysOnTop={true}
        onToggleAlwaysOnTop={vi.fn()}
        windowOpacity={1.0}
        onChangeOpacity={vi.fn()}
        theme="dark"
        onToggleTheme={vi.fn()}
        screenProtection={DEFAULT_SCREEN_PROTECTION_SETTINGS}
        onUpdateScreenProtection={handleUpdate}
        isContentProtectionActive={true}
        initialTab="privacy"
      />
    );

    // Find the master switch
    const switches = screen.getAllByRole('switch');
    const masterSwitch = switches[0];
    expect(masterSwitch.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(masterSwitch);
    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('switches protection mode between always and smart', () => {
    const handleUpdate = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isAlwaysOnTop={true}
        onToggleAlwaysOnTop={vi.fn()}
        windowOpacity={1.0}
        onChangeOpacity={vi.fn()}
        theme="dark"
        onToggleTheme={vi.fn()}
        screenProtection={DEFAULT_SCREEN_PROTECTION_SETTINGS}
        onUpdateScreenProtection={handleUpdate}
        isContentProtectionActive={true}
        initialTab="privacy"
      />
    );

    // Click Smart Auto-Shield card
    const smartCard = screen.getByText('Smart Auto-Shield');
    fireEvent.click(smartCard);

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'smart',
      })
    );
  });

  it('toggles individual meeting apps in the exclusion list', () => {
    const handleUpdate = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isAlwaysOnTop={true}
        onToggleAlwaysOnTop={vi.fn()}
        windowOpacity={1.0}
        onChangeOpacity={vi.fn()}
        theme="dark"
        onToggleTheme={vi.fn()}
        screenProtection={DEFAULT_SCREEN_PROTECTION_SETTINGS}
        onUpdateScreenProtection={handleUpdate}
        isContentProtectionActive={true}
        initialTab="privacy"
      />
    );

    // Zoom Meetings is enabled by default. Toggle it off.
    const switches = screen.getAllByRole('switch');
    // First switch is master, second is Zoom
    const zoomSwitch = switches[1];
    fireEvent.click(zoomSwitch);

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        apps: expect.arrayContaining([
          expect.objectContaining({
            id: 'zoom',
            enabled: false,
          }),
        ]),
      })
    );
  });

  it('adds and deletes a custom meeting app', () => {
    let currentConfig: ScreenProtectionSettings = { ...DEFAULT_SCREEN_PROTECTION_SETTINGS };
    const handleUpdate = vi.fn((next: ScreenProtectionSettings) => {
      currentConfig = next;
    });

    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isAlwaysOnTop={true}
        onToggleAlwaysOnTop={vi.fn()}
        windowOpacity={1.0}
        onChangeOpacity={vi.fn()}
        theme="dark"
        onToggleTheme={vi.fn()}
        screenProtection={currentConfig}
        onUpdateScreenProtection={handleUpdate}
        isContentProtectionActive={true}
        initialTab="privacy"
      />
    );

    // Add custom app "GoToMeeting"
    const nameInput = screen.getByPlaceholderText(/App Name/i);
    const processInput = screen.getByPlaceholderText(/Process \(\.exe\)/i);
    const addButton = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(nameInput, { target: { value: 'GoToMeeting' } });
    fireEvent.change(processInput, { target: { value: 'g2mcomm.exe' } });
    fireEvent.click(addButton);

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        apps: expect.arrayContaining([
          expect.objectContaining({
            name: 'GoToMeeting',
            processNames: ['g2mcomm.exe'],
            isCustom: true,
          }),
        ]),
      })
    );

    // Rerender with the added custom app
    rerender(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        isAlwaysOnTop={true}
        onToggleAlwaysOnTop={vi.fn()}
        windowOpacity={1.0}
        onChangeOpacity={vi.fn()}
        theme="dark"
        onToggleTheme={vi.fn()}
        screenProtection={currentConfig}
        onUpdateScreenProtection={handleUpdate}
        isContentProtectionActive={true}
        initialTab="privacy"
      />
    );

    expect(screen.getByText('GoToMeeting')).toBeDefined();

    // Delete the custom app
    const deleteButton = screen.getByTitle('Delete custom app');
    fireEvent.click(deleteButton);

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        apps: expect.not.arrayContaining([
          expect.objectContaining({
            name: 'GoToMeeting',
          }),
        ]),
      })
    );
  });

  it('renders quick Shield button on TitleBar and opens Screen Privacy tab when clicked', async () => {
    const mockSetContentProtection = vi.fn().mockResolvedValue({ success: true, isProtected: true });
    const mockGetRunningProcesses = vi.fn().mockResolvedValue(['ms-teams.exe']);

    (window as any).electronAPI = {
      isMaximized: vi.fn().mockResolvedValue(false),
      getAppVersion: vi.fn().mockResolvedValue('1.2.1'),
      loadNotes: vi.fn().mockResolvedValue([]),
      saveNotes: vi.fn().mockResolvedValue({ success: true }),
      setAlwaysOnTop: vi.fn().mockResolvedValue(true),
      setOpacity: vi.fn().mockResolvedValue(0.92),
      setContentProtection: mockSetContentProtection,
      getRunningProcesses: mockGetRunningProcesses,
    };

    render(<App />);

    // Quick Shield button should be present on TitleBar
    const shieldButton = screen.getByRole('button', { name: /Screen Share Privacy Shield/i });
    expect(shieldButton).toBeDefined();

    // Clicking shield button opens Settings modal directly on Privacy tab
    await act(async () => {
      fireEvent.click(shieldButton);
    });

    expect(screen.getByText('Hide from Screen Sharing & Meeting Apps')).toBeDefined();
    expect(screen.getByText('Always Hidden (Recommended)')).toBeDefined();
    expect(screen.getByText('Zoom Meetings')).toBeDefined();
    expect(screen.getByText('Microsoft Teams')).toBeDefined();
    expect(screen.getByText('Zoho Meeting')).toBeDefined();

    // Verify Electron setContentProtection was invoked
    expect(mockSetContentProtection).toHaveBeenCalledWith(true);
  });
});
