import React, { useState, useEffect } from 'react';
import { X, Cpu, HardDrive, ShieldCheck, Database, FolderOpen } from 'lucide-react';
import { SystemInfo } from '../types/electron';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({ isOpen, onClose }) => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (window.electronAPI) {
        window.electronAPI.getSystemInfo().then((data) => {
          setInfo(data);
          setLoading(false);
        });
      } else {
        setInfo({
          platform: 'web-browser',
          arch: 'x64',
          nodeVersion: 'v20.19.1 (Electron embedded)',
          electronVersion: 'v34.2.0',
          chromeVersion: navigator.userAgent,
          appPath: 'd:/Shrikant/practice/rea',
          userDataPath: 'aura_notes.sqlite (Local Storage)',
          databaseEngine: 'SQLite 3 (ACID Relational Storage: aura_notes.sqlite)',
        });
        setLoading(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '620px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>Desktop Runtime & SQLite Database Info</h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading system diagnostics...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Operating System / Platform</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{info?.platform} ({info?.arch})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Local Database Engine</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={14} />
                  <span>SQLite 3 (ACID Relational)</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Electron Engine Version</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{info?.electronVersion}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Node.js Runtime</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{info?.nodeVersion}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Security Isolation</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#c4b5fd' }}>contextBridge (sandbox-safe)</span>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>SQLite Storage Location (<code style={{ color: 'var(--accent-cyan)' }}>aura_notes.sqlite</code>):</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                  {info?.userDataPath}\aura_notes.sqlite
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: '13px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
