import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mermaid from 'mermaid';
import {
  Workflow,
  Eye,
  Code as CodeIcon,
  Columns2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  AlertCircle,
  GitBranch,
  RefreshCw,
} from 'lucide-react';

interface MermaidPreviewerProps {
  code: string;
  title?: string;
  className?: string;
}

// Detect diagram type and icon from mermaid source code
export function detectDiagramType(code: string): { label: string; icon: string } {
  const lines = code.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim().toLowerCase();
    if (!line || line.startsWith('%%')) continue;

    if (line.startsWith('graph') || line.startsWith('flowchart')) {
      return { label: 'Flowchart', icon: '🔀' };
    }
    if (line.startsWith('sequencediagram')) {
      return { label: 'Sequence Diagram', icon: '⏱️' };
    }
    if (line.startsWith('classdiagram')) {
      return { label: 'Class Diagram', icon: '🏛️' };
    }
    if (line.startsWith('statediagram')) {
      return { label: 'State Diagram', icon: '🔄' };
    }
    if (line.startsWith('erdiagram')) {
      return { label: 'Entity Relationship', icon: '🗄️' };
    }
    if (line.startsWith('mindmap')) {
      return { label: 'Mindmap', icon: '🧠' };
    }
    if (line.startsWith('gantt')) {
      return { label: 'Gantt Chart', icon: '📊' };
    }
    if (line.startsWith('pie')) {
      return { label: 'Pie Chart', icon: '🥧' };
    }
    if (line.startsWith('gitgraph')) {
      return { label: 'Git Graph', icon: '🌿' };
    }
    if (line.startsWith('journey')) {
      return { label: 'User Journey', icon: '🗺️' };
    }
    if (line.startsWith('quadrantchart')) {
      return { label: 'Quadrant Chart', icon: '🧭' };
    }
    if (line.startsWith('timeline')) {
      return { label: 'Timeline', icon: '⏳' };
    }
    if (line.startsWith('c4')) {
      return { label: 'C4 Architecture', icon: '🏢' };
    }
    if (line.startsWith('block') || line.startsWith('architecture')) {
      return { label: 'Architecture Block', icon: '🧱' };
    }
    break;
  }
  return { label: 'Mermaid Diagram', icon: '📐' };
}

let mermaidInitialized = false;

function ensureMermaidInit() {
  if (typeof window === 'undefined') return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  try {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: isLight ? 'default' : 'dark',
      fontFamily: 'var(--font-sans)',
      themeVariables: isLight
        ? {
            primaryColor: '#0284c7',
            primaryTextColor: '#0f172a',
            primaryBorderColor: '#0284c7',
            lineColor: '#64748b',
            secondaryColor: '#6d28d9',
            tertiaryColor: '#f1f5f9',
          }
        : {
            darkMode: true,
            background: '#0b0f19',
            primaryColor: '#8b5cf6',
            primaryTextColor: '#f9fafb',
            primaryBorderColor: '#a78bfa',
            lineColor: '#38bdf8',
            secondaryColor: '#06b6d4',
            tertiaryColor: '#1e293b',
          },
    });
    mermaidInitialized = true;
  } catch (e) {
    console.warn('Failed to initialize mermaid:', e);
  }
}

export const MermaidPreviewer: React.FC<MermaidPreviewerProps> = React.memo(({
  code,
  title,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'diagram' | 'split' | 'code'>('diagram');
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const renderSeqRef = useRef<number>(0);

  const diagramInfo = useMemo(() => detectDiagramType(code), [code]);

  // Clean and render mermaid diagram
  const renderDiagram = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setSvgHtml('');
      setRenderError(null);
      setIsRendering(false);
      return;
    }

    ensureMermaidInit();
    const currentSeq = ++renderSeqRef.current;
    setIsRendering(true);
    setRenderError(null);

    const uniqueId = `mermaid_diag_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

    try {
      const { svg } = await mermaid.render(uniqueId, trimmed);
      if (currentSeq === renderSeqRef.current) {
        setSvgHtml(svg);
        setRenderError(null);
        setIsRendering(false);
      }
    } catch (err: any) {
      if (currentSeq === renderSeqRef.current) {
        const message = err?.message || err?.str || String(err);
        setRenderError(message);
        setIsRendering(false);
      }
      // Remove any injected error containers mermaid leaves in DOM
      try {
        const orphan = document.getElementById(uniqueId) || document.getElementById(`d${uniqueId}`);
        if (orphan && orphan.parentNode) {
          orphan.parentNode.removeChild(orphan);
        }
      } catch {}
    }
  }, [code]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  // Handle Zoom In / Out / Reset
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(Number((z + 0.2).toFixed(2)), 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(Number((z - 0.2).toFixed(2)), 0.3));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pan / Drag Interactions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag with left mouse click on the canvas
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Copy SVG to clipboard
  const handleCopySvg = useCallback(() => {
    if (!svgHtml) return;
    navigator.clipboard.writeText(svgHtml);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  }, [svgHtml]);

  // Copy Code to clipboard
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [code]);

  // Download SVG
  const handleDownloadSvg = useCallback(() => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagramInfo.label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [svgHtml, diagramInfo.label]);

  // Handle Escape key to close fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Canvas element for rendered SVG
  const renderDiagramCanvas = (isModal: boolean = false) => {
    if (renderError) {
      return (
        <div
          data-testid="mermaid-error-banner"
          style={{
            padding: '20px',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            margin: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Diagram Syntax Error</span>
          </div>
          <p
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            {renderError}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setViewMode('code')}
              className="btn btn-ghost"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <CodeIcon size={12} />
              <span>Switch to Code View to Edit</span>
            </button>
            <button
              onClick={renderDiagram}
              className="btn btn-ghost"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                color: 'var(--text-secondary)',
              }}
            >
              <RefreshCw size={12} />
              <span>Retry Render</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100%',
          height: isModal ? 'calc(100vh - 120px)' : 'auto',
          minHeight: isModal ? '400px' : '220px',
          maxHeight: isModal ? 'none' : '520px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          padding: '16px',
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
        data-testid="mermaid-canvas"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
          className="mermaid-svg-wrapper"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    );
  };

  // Code view element
  const renderCodeView = () => {
    const lines = code.split('\n');
    return (
      <div
        style={{
          overflowX: 'auto',
          padding: '12px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: '1.6',
          backgroundColor: '#0a0e17',
          color: '#e2e8f0',
        }}
        data-testid="mermaid-code-view"
      >
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    width: '38px',
                    paddingRight: '12px',
                    textAlign: 'right',
                    color: 'rgba(255, 255, 255, 0.25)',
                    userSelect: 'none',
                    fontSize: '11px',
                  }}
                >
                  {idx + 1}
                </td>
                <td style={{ whiteSpace: 'pre', paddingRight: '16px', color: '#38bdf8' }}>
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className={`mermaid-previewer-card ${className}`}
      data-testid="mermaid-previewer"
      style={{
        margin: '16px 0',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        backgroundColor: 'var(--bg-card)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Top Header / Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.18)',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
          userSelect: 'none',
        }}
      >
        {/* Left: Diagram Type Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: 'var(--accent-violet)',
              fontWeight: 600,
              fontSize: '11px',
            }}
          >
            <Workflow size={12} />
            <span>{diagramInfo.label}</span>
          </div>
          {title && (
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '12px' }}>
              {title}
            </span>
          )}
          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
            {code.split('\n').length} lines
          </span>
        </div>

        {/* Center: View Switcher (Diagram | Split | Code) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setViewMode('diagram')}
            data-testid="mermaid-view-diagram-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'diagram' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              color: viewMode === 'diagram' ? 'var(--accent-violet)' : 'var(--text-tertiary)',
              transition: 'all 0.15s ease',
            }}
            title="Diagram Preview"
          >
            <Eye size={12} />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            data-testid="mermaid-view-split-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'split' ? 'rgba(6, 182, 212, 0.3)' : 'transparent',
              color: viewMode === 'split' ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
              transition: 'all 0.15s ease',
            }}
            title="Side-by-side Split View"
          >
            <Columns2 size={12} />
            <span>Split</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            data-testid="mermaid-view-code-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'code' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
              color: viewMode === 'code' ? 'var(--accent-emerald)' : 'var(--text-tertiary)',
              transition: 'all 0.15s ease',
            }}
            title="Source Code"
          >
            <CodeIcon size={12} />
            <span>Code</span>
          </button>
        </div>

        {/* Right: Zoom & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {viewMode !== 'code' && (
            <>
              {/* Zoom Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  padding: '2px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  onClick={handleZoomOut}
                  className="btn-icon"
                  style={{ width: '22px', height: '22px' }}
                  title="Zoom Out"
                  data-testid="mermaid-zoom-out"
                >
                  <ZoomOut size={12} />
                </button>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    minWidth: '38px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                  data-testid="mermaid-zoom-level"
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="btn-icon"
                  style={{ width: '22px', height: '22px' }}
                  title="Zoom In"
                  data-testid="mermaid-zoom-in"
                >
                  <ZoomIn size={12} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="btn-icon"
                  style={{ width: '22px', height: '22px' }}
                  title="Reset Zoom & Pan"
                  data-testid="mermaid-zoom-reset"
                >
                  <RotateCcw size={11} />
                </button>
              </div>

              {/* Copy SVG */}
              <button
                onClick={handleCopySvg}
                className="btn btn-ghost"
                style={{
                  height: '24px',
                  fontSize: '11px',
                  padding: '0 7px',
                  gap: '4px',
                  color: copiedSvg ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                }}
                title="Copy rendered SVG markup"
                data-testid="mermaid-copy-svg"
              >
                {copiedSvg ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                <span>{copiedSvg ? 'Copied' : 'SVG'}</span>
              </button>

              {/* Download SVG */}
              <button
                onClick={handleDownloadSvg}
                className="btn-icon"
                style={{ width: '24px', height: '24px' }}
                title="Download Diagram as .SVG file"
                data-testid="mermaid-download-svg"
              >
                <Download size={12} />
              </button>
            </>
          )}

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="btn btn-ghost"
            style={{
              height: '24px',
              fontSize: '11px',
              padding: '0 7px',
              gap: '4px',
              color: copiedCode ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            }}
            title="Copy raw mermaid code"
            data-testid="mermaid-copy-code"
          >
            {copiedCode ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
            <span>{copiedCode ? 'Copied' : 'Code'}</span>
          </button>

          {/* Fullscreen / Expand Modal */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="btn-icon"
            style={{ width: '24px', height: '24px', color: 'var(--accent-violet)' }}
            title="Expand to Fullscreen Preview"
            data-testid="mermaid-fullscreen-btn"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'diagram' && renderDiagramCanvas(false)}

        {viewMode === 'code' && renderCodeView()}

        {viewMode === 'split' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ borderRight: '1px solid var(--border-subtle)' }}>
              {renderDiagramCanvas(false)}
            </div>
            <div>
              {renderCodeView()}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div
          data-testid="mermaid-fullscreen-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(5, 8, 15, 0.95)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(139, 92, 246, 0.25)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  color: 'var(--accent-violet)',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                <Workflow size={14} />
                <span>{diagramInfo.label} Preview</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Press Esc or Close button to exit
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Zoom Controls in Modal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <button
                  onClick={handleZoomOut}
                  className="btn-icon"
                  style={{ width: '26px', height: '26px' }}
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    minWidth: '45px',
                    textAlign: 'center',
                    color: 'var(--text-primary)',
                  }}
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="btn-icon"
                  style={{ width: '26px', height: '26px' }}
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="btn-icon"
                  style={{ width: '26px', height: '26px' }}
                  title="Reset Zoom & Pan"
                >
                  <RotateCcw size={12} />
                </button>
              </div>

              {/* Copy SVG */}
              <button
                onClick={handleCopySvg}
                className="btn btn-ghost"
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  color: copiedSvg ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                }}
              >
                {copiedSvg ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                <span>{copiedSvg ? 'Copied SVG' : 'Copy SVG'}</span>
              </button>

              {/* Download SVG */}
              <button
                onClick={handleDownloadSvg}
                className="btn btn-ghost"
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                <Download size={13} />
                <span>Export SVG</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="btn btn-ghost"
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  color: 'var(--accent-rose)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                }}
                data-testid="mermaid-close-fullscreen"
              >
                <Minimize2 size={13} />
                <span>Exit Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Modal Body Canvas */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {renderDiagramCanvas(true)}
          </div>
        </div>
      )}
    </div>
  );
});
