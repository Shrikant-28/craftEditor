import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Pin,
  Eye,
  Sun,
  Moon,
  Keyboard,
  Database,
  Check,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  RefreshCw,
  Plus,
  Trash2,
  Info,
  Video,
} from 'lucide-react';
import {
  ScreenProtectionSettings,
  DEFAULT_SCREEN_PROTECTION_SETTINGS,
  MeetingAppConfig,
} from '../types/screenProtection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAlwaysOnTop: boolean;
  onToggleAlwaysOnTop: (enabled: boolean) => void;
  windowOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  screenProtection?: ScreenProtectionSettings;
  onUpdateScreenProtection?: (settings: ScreenProtectionSettings) => void;
  isContentProtectionActive?: boolean;
  runningProcesses?: string[];
  onRefreshProcesses?: () => void;
  initialTab?: 'general' | 'privacy';
}

const OPACITY_PRESETS = [
  { label: '100% Solid', value: 1.0, hint: 'Default opaque window' },
  { label: '85% Optimal', value: 0.85, hint: 'Best balance for reading background text' },
  { label: '70% Translucent', value: 0.7, hint: 'Enhanced background visibility' },
  { label: '50% Ghost', value: 0.5, hint: 'Maximum transparency for reference notes' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isAlwaysOnTop,
  onToggleAlwaysOnTop,
  windowOpacity,
  onChangeOpacity,
  theme,
  onToggleTheme,
  screenProtection = DEFAULT_SCREEN_PROTECTION_SETTINGS,
  onUpdateScreenProtection,
  isContentProtectionActive = false,
  runningProcesses = [],
  onRefreshProcesses,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy'>(initialTab);
  const [newAppName, setNewAppName] = useState('');
  const [newAppProcess, setNewAppProcess] = useState('');
  const [addError, setAddError] = useState('');

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      onRefreshProcesses?.();
    }
  }, [isOpen, initialTab, onRefreshProcesses]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const opacityPercent = Math.round(windowOpacity * 100);

  // Helper to toggle master screen protection
  const handleToggleScreenProtection = (enabled: boolean) => {
    if (!onUpdateScreenProtection) return;
    onUpdateScreenProtection({
      ...screenProtection,
      enabled,
    });
  };

  // Helper to change mode ('always' vs 'smart')
  const handleChangeMode = (mode: 'always' | 'smart') => {
    if (!onUpdateScreenProtection) return;
    onUpdateScreenProtection({
      ...screenProtection,
      mode,
    });
  };

  // Helper to toggle specific app exclusion
  const handleToggleApp = (appId: string, enabled: boolean) => {
    if (!onUpdateScreenProtection) return;
    const nextApps = screenProtection.apps.map((app) =>
      app.id === appId ? { ...app, enabled } : app
    );
    onUpdateScreenProtection({
      ...screenProtection,
      apps: nextApps,
    });
  };

  // Helper to add custom app
  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newAppName.trim();
    let trimmedProcess = newAppProcess.trim().toLowerCase();

    if (!trimmedName || !trimmedProcess) {
      setAddError('Please enter both an app name and process executable name (e.g. app.exe)');
      return;
    }

    if (!trimmedProcess.endsWith('.exe')) {
      trimmedProcess = `${trimmedProcess}.exe`;
    }

    const newApp: MeetingAppConfig = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      processNames: [trimmedProcess],
      enabled: true,
      isCustom: true,
      category: 'custom',
    };

    if (onUpdateScreenProtection) {
      onUpdateScreenProtection({
        ...screenProtection,
        apps: [...screenProtection.apps, newApp],
      });
    }

    setNewAppName('');
    setNewAppProcess('');
    setAddError('');
  };

  // Helper to delete custom app
  const handleDeleteCustomApp = (appId: string) => {
    if (!onUpdateScreenProtection) return;
    onUpdateScreenProtection({
      ...screenProtection,
      apps: screenProtection.apps.filter((a) => a.id !== appId),
    });
  };

  // Check if an app is currently running on the system
  const isAppRunning = (app: MeetingAppConfig): boolean => {
    if (!runningProcesses || runningProcesses.length === 0) return false;
    return app.processNames.some((proc) =>
      runningProcesses.includes(proc.toLowerCase())
    );
  };

  // Count active meeting apps
  const runningMeetingApps = screenProtection.apps.filter(
    (app) => app.enabled && isAppRunning(app)
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '640px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg, 12px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-subtle)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface, #0b0f19)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-titlebar, #070a12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
              }}
            >
              <SettingsIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Application Settings
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Window display, screen share exclusion, and opacity controls
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Close (Esc)"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            backgroundColor: 'var(--bg-titlebar, #070a12)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeTab === 'general' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              backgroundColor: activeTab === 'general' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Sliders size={14} />
            <span>General & Display</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeTab === 'privacy' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
              backgroundColor: activeTab === 'privacy' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'privacy' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Shield size={14} />
            <span>Screen Share Privacy</span>
            <span
              style={{
                fontSize: '9px',
                padding: '1px 6px',
                borderRadius: '8px',
                fontWeight: 700,
                backgroundColor: isContentProtectionActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isContentProtectionActive ? 'var(--accent-emerald, #10b981)' : 'var(--text-tertiary)',
              }}
            >
              {isContentProtectionActive ? 'SHIELD ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxHeight: '65vh',
          }}
        >
          {activeTab === 'general' ? (
            <>
              {/* Section 1: Always on Top (Window Stacking) */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                  border: isAlwaysOnTop ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle)',
                  boxShadow: isAlwaysOnTop ? '0 0 16px rgba(6, 182, 212, 0.1)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: isAlwaysOnTop ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isAlwaysOnTop ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Pin size={18} style={{ transform: isAlwaysOnTop ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Always On Top of All Screens
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            backgroundColor: isAlwaysOnTop ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                            color: isAlwaysOnTop ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                          }}
                        >
                          {isAlwaysOnTop ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.45' }}>
                        Keeps Aura Notes floating in front of all open windows, browsers, and applications on your desktop so it never gets lost behind other screens.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAlwaysOnTop}
                    onClick={() => onToggleAlwaysOnTop(!isAlwaysOnTop)}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: isAlwaysOnTop ? 'var(--accent-cyan, #06b6d4)' : 'rgba(255, 255, 255, 0.16)',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      padding: '2px',
                      transition: 'background-color 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transform: isAlwaysOnTop ? 'translateX(22px)' : 'translateX(0px)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Section 2: Window Opacity / See Background Text */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={17} style={{ color: 'var(--accent-violet, #8b5cf6)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Window Opacity (View Background Text)
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: opacityPercent < 100 ? 'var(--accent-violet)' : 'var(--text-primary)',
                      backgroundColor: 'rgba(139, 92, 246, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                    }}
                  >
                    {opacityPercent}%
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                  When Aura Notes is stacked over browsers, PDFs, or other applications, adjust window opacity to comfortably read background text while typing.
                </p>

                {/* Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '32px' }}>30%</span>
                  <input
                    type="range"
                    min="0.30"
                    max="1.0"
                    step="0.05"
                    value={windowOpacity}
                    onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: 'var(--accent-violet, #8b5cf6)',
                      cursor: 'pointer',
                      height: '6px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '38px', textAlign: 'right' }}>100%</span>
                </div>

                {/* Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {OPACITY_PRESETS.map((preset) => {
                    const isActive = Math.abs(windowOpacity - preset.value) < 0.03;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => onChangeOpacity(preset.value)}
                        style={{
                          padding: '8px 6px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: isActive ? 600 : 500,
                          backgroundColor: isActive ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                          border: isActive ? '1px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                          color: isActive ? '#ffffff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 0.15s ease',
                        }}
                        title={preset.hint}
                      >
                        <span>{preset.label}</span>
                        <span style={{ fontSize: '9px', opacity: 0.7, color: 'var(--text-tertiary)' }}>
                          {preset.value === 1.0 ? 'Solid' : preset.value === 0.85 ? 'Recommended' : `${Math.round(preset.value * 100)}%`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Theme Switcher */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Color Theme
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Currently using {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </div>
                </div>

                <button
                  onClick={onToggleTheme}
                  className="btn btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun size={14} style={{ color: 'var(--accent-amber)' }} />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon size={14} style={{ color: 'var(--accent-violet)' }} />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>

              {/* Section 4: Keyboard Shortcuts Cheatsheet */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Keyboard size={16} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Keyboard Shortcuts
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Create New Note</span>
                    <kbd style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)' }}>
                      Ctrl + N
                    </kbd>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Focus Smart Search</span>
                    <kbd style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)' }}>
                      Ctrl + K
                    </kbd>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Open Application Settings</span>
                    <kbd style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)' }}>
                      Ctrl + ,
                    </kbd>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: Screen Share Privacy & App Exclusion */
            <>
              {/* Master Screen Protection Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                  border: screenProtection.enabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                  boxShadow: screenProtection.enabled ? '0 0 16px rgba(16, 185, 129, 0.1)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: isContentProtectionActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isContentProtectionActive ? 'var(--accent-emerald, #10b981)' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isContentProtectionActive ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Hide from Screen Sharing & Meeting Apps
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            backgroundColor: isContentProtectionActive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                            color: isContentProtectionActive ? 'var(--accent-emerald, #10b981)' : 'var(--text-tertiary)',
                            border: isContentProtectionActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                          }}
                        >
                          {isContentProtectionActive ? 'WINDOW HIDDEN IN SCREEN SHARE' : 'SCREEN PROTECTION OFF'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.45' }}>
                        Prevents Zoom, Zoho Meeting, Microsoft Teams, and other screen-sharing software from capturing this window. Attendees will see a hidden / blacked-out area while you continue taking private notes.
                      </p>
                    </div>
                  </div>

                  {/* Master Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={screenProtection.enabled}
                    onClick={() => handleToggleScreenProtection(!screenProtection.enabled)}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: screenProtection.enabled ? 'var(--accent-emerald, #10b981)' : 'rgba(255, 255, 255, 0.16)',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      padding: '2px',
                      transition: 'background-color 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transform: screenProtection.enabled ? 'translateX(22px)' : 'translateX(0px)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Protection Mode Selector */}
              {screenProtection.enabled && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md, 8px)',
                    backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Protection Mode
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {/* Mode 1: Always Hidden */}
                    <div
                      onClick={() => handleChangeMode('always')}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: screenProtection.mode === 'always' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        backgroundColor: screenProtection.mode === 'always' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: screenProtection.mode === 'always' ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                          Always Hidden (Recommended)
                        </span>
                        {screenProtection.mode === 'always' && <Check size={14} style={{ color: 'var(--accent-cyan)' }} />}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Window is continuously shielded from all meeting shares and screen recording software at all times.
                      </p>
                    </div>

                    {/* Mode 2: Smart Auto-Detect */}
                    <div
                      onClick={() => handleChangeMode('smart')}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: screenProtection.mode === 'smart' ? '1px solid var(--accent-emerald, #10b981)' : '1px solid var(--border-subtle)',
                        backgroundColor: screenProtection.mode === 'smart' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: screenProtection.mode === 'smart' ? 'var(--accent-emerald, #10b981)' : 'var(--text-primary)' }}>
                          Smart Auto-Shield
                        </span>
                        {screenProtection.mode === 'smart' && <Check size={14} style={{ color: 'var(--accent-emerald, #10b981)' }} />}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Auto-engages protection only when enabled meeting apps below (Zoom, Teams, etc.) are actively running.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Configured Apps Section */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Configured Screen Sharing Apps
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Choose which meeting and recording applications trigger protection
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {runningMeetingApps.length > 0 ? (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--accent-emerald, #10b981)',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        {runningMeetingApps.length} active meeting app{runningMeetingApps.length > 1 ? 's' : ''} detected
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        No meeting apps currently running
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onRefreshProcesses?.()}
                      className="btn-icon"
                      style={{ width: '26px', height: '26px', borderRadius: '6px' }}
                      title="Scan system processes now"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                {/* Apps List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {screenProtection.apps.map((app) => {
                    const running = isAppRunning(app);
                    return (
                      <div
                        key={app.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: running ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                          border: running ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <Video size={16} style={{ color: running ? 'var(--accent-emerald, #10b981)' : 'var(--text-secondary)', flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {app.name}
                              </span>
                              {running && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    color: 'var(--accent-emerald, #10b981)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                  RUNNING NOW
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.processNames.join(', ')}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {app.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomApp(app.id)}
                              className="btn-icon"
                              style={{ width: '24px', height: '24px', color: 'var(--accent-red, #ef4444)' }}
                              title="Delete custom app"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {/* App Toggle */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={app.enabled}
                            onClick={() => handleToggleApp(app.id, !app.enabled)}
                            style={{
                              width: '38px',
                              height: '20px',
                              borderRadius: '10px',
                              backgroundColor: app.enabled ? 'var(--accent-cyan, #06b6d4)' : 'rgba(255, 255, 255, 0.16)',
                              border: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              padding: '2px',
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                transform: app.enabled ? 'translateX(18px)' : 'translateX(0px)',
                                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              }}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom App Form */}
                <form
                  onSubmit={handleAddCustomApp}
                  style={{
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Add Custom App / Meeting Software
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="App Name (e.g. GoToMeeting)"
                      value={newAppName}
                      onChange={(e) => {
                        setNewAppName(e.target.value);
                        setAddError('');
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-input, rgba(0, 0, 0, 0.2))',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Process (.exe) e.g. g2mcomm.exe"
                      value={newAppProcess}
                      onChange={(e) => {
                        setNewAppProcess(e.target.value);
                        setAddError('');
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-input, rgba(0, 0, 0, 0.2))',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-ghost"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        gap: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--accent-cyan)',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                      }}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                  {addError && (
                    <div style={{ fontSize: '10px', color: 'var(--accent-red, #ef4444)' }}>
                      {addError}
                    </div>
                  )}
                </form>
              </div>

              {/* Technical / Verification Explanation */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Info size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>How setContentProtection works:</strong>{' '}
                  Electron uses the OS compositor display affinity (<code style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>WDA_EXCLUDEFROMCAPTURE</code> on Windows). When screen sharing in Zoom, Teams, Zoho, or recording displays, Windows automatically blanks out this window from the capture buffer while letting you read and edit your notes normally.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-titlebar, #070a12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-emerald)' }}>
            <Database size={13} />
            <span>SQLite Local Storage Connected</span>
          </div>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '6px 18px', fontSize: '12px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
