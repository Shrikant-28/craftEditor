import React, { useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Pin,
  Eye,
  Sliders,
  Sun,
  Moon,
  Keyboard,
  Database,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAlwaysOnTop: boolean;
  onToggleAlwaysOnTop: (enabled: boolean) => void;
  windowOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
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
}) => {
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
          width: '560px',
          maxWidth: '96vw',
          maxHeight: '88vh',
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
                Window stacking, transparency, and display controls
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

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
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
