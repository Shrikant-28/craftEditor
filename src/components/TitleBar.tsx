import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Sun, Moon } from 'lucide-react';

interface TitleBarProps {
  totalNotes?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  totalNotes,
  theme: externalTheme,
  onToggleTheme,
}) => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [internalTheme, setInternalTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('aura_notes_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const currentTheme = externalTheme || internalTheme;

  const handleToggle = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setInternalTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem('aura_notes_theme', nextTheme);
      } catch {}
    }
  };

  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = async () => {
    if (window.electronAPI) {
      const state = await window.electronAPI.maximizeWindow();
      setIsMaximized(state);
    }
  };
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <div
      style={{
        height: '42px',
        backgroundColor: 'var(--bg-titlebar, #070a12)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        userSelect: 'none',
        transition: 'background-color 0.2s ease',
      }}
      className="titlebar-draggable"
      onDoubleClick={handleMaximize}
    >
      {/* Left: App Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="titlebar-no-drag">
        <img
          src="./note.jpg"
          alt="Aura Notes App Icon"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            objectFit: 'cover',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
          Aura Notes
        </span>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: isElectron ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isElectron ? 'var(--accent-cyan)' : 'var(--accent-amber)',
            fontWeight: 500,
          }}
        >
          {isElectron ? 'Desktop (Electron)' : 'Web Preview'}
        </span>
      </div>

      {/* Right: Theme Switcher & Window Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="titlebar-no-drag">
        {/* Light or Dark Mode Switcher */}
        <div
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            borderRadius: '20px',
            padding: '2px 3px',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            gap: '2px',
          }}
        >
          {/* Light button indicator */}
          <div
            onClick={(e) => {
              if (currentTheme !== 'light') {
                e.stopPropagation();
                handleToggle();
              }
            }}
            style={{
              padding: '3px 7px',
              borderRadius: '14px',
              backgroundColor: currentTheme === 'light' ? 'var(--accent-amber)' : 'transparent',
              color: currentTheme === 'light' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              boxShadow: currentTheme === 'light' ? '0 1px 6px rgba(217, 119, 6, 0.35)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Sun size={12} />
            {currentTheme === 'light' && <span>Light</span>}
          </div>

          {/* Dark button indicator */}
          <div
            onClick={(e) => {
              if (currentTheme !== 'dark') {
                e.stopPropagation();
                handleToggle();
              }
            }}
            style={{
              padding: '3px 7px',
              borderRadius: '14px',
              backgroundColor: currentTheme === 'dark' ? 'var(--accent-violet)' : 'transparent',
              color: currentTheme === 'dark' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              boxShadow: currentTheme === 'dark' ? '0 1px 6px rgba(139, 92, 246, 0.35)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Moon size={12} />
            {currentTheme === 'dark' && <span>Dark</span>}
          </div>
        </div>

        {/* Window Controls (Electron) */}
        {isElectron && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '4px',
              borderLeft: '1px solid var(--border-subtle)',
              paddingLeft: '8px',
            }}
          >
            <button
              onClick={handleMinimize}
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={handleMaximize}
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              title="Maximize"
            >
              <Square size={12} />
            </button>
            <button
              onClick={handleClose}
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
