import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Laptop, Cpu, Sparkles, BookOpen } from 'lucide-react';

interface TitleBarProps {
  onOpenSystemInfo: () => void;
  onOpenSearchEvidence: () => void;
  totalNotes: number;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onOpenSystemInfo,
  onOpenSearchEvidence,
  totalNotes,
}) => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

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
        backgroundColor: '#070a12',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        userSelect: 'none',
      }}
      className="titlebar-draggable"
    >
      {/* Left: App Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="titlebar-no-drag">
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
          }}
        >
          <Sparkles size={14} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', color: '#f3f4f6' }}>
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

      {/* Center: System Status & Evidence Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="titlebar-no-drag">
        <button
          onClick={onOpenSearchEvidence}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            color: '#c4b5fd',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="See how search works and view evidence"
        >
          <BookOpen size={13} />
          <span>Search Engine Architecture & Evidence</span>
        </button>

        <button
          onClick={onOpenSystemInfo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
          title="View Desktop Diagnostics & Storage"
        >
          <Cpu size={13} />
          <span>System Info</span>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="titlebar-no-drag">
        {isElectron && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
