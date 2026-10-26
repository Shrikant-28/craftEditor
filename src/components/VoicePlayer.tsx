import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Download,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { VoiceRecording } from '../types/note';
import { formatDuration, generateWaveform, downloadAudioFile } from '../utils/audioUtils';

interface VoicePlayerProps {
  recording: VoiceRecording;
  onDelete: (id: string) => void;
  onInsertTranscript?: (transcript: string) => void;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  recording,
  onDelete,
  onInsertTranscript,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [hoverBarIndex, setHoverBarIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const waveform = recording.waveform && recording.waveform.length > 0
    ? recording.waveform
    : generateWaveform(36, recording.id);

  // Sync audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.error('Audio playback failed:', err));
    }
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const targetFraction = index / waveform.length;
    const targetTime = targetFraction * (duration || recording.duration || 1);
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);

    if (!isPlaying) {
      audio.play().catch(() => {});
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleCopyTranscript = () => {
    if (!recording.transcript) return;
    navigator.clipboard.writeText(recording.transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleDownload = () => {
    const filename = `voice-note-${new Date(recording.recordedAt).toISOString().slice(0, 10)}.webm`;
    downloadAudioFile(recording.audioData, filename);
  };

  const progressFraction = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const activeBarCount = Math.floor(progressFraction * waveform.length);

  const formattedDate = new Date(recording.recordedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(17, 24, 39, 0.75)',
        border: '1px solid var(--border-subtle)',
        padding: '14px 16px',
        marginBottom: '12px',
        transition: 'all 0.2s ease',
      }}
      className="glass-card"
    >
      <audio ref={audioRef} src={recording.audioData} preload="metadata" />

      {/* Top Header: Voice Clip Name, Date, Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isPlaying ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              boxShadow: isPlaying ? '0 0 8px var(--accent-emerald)' : 'none',
              transition: 'all 0.2s ease',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6' }}>
            Voice Memo
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            • {formattedDate}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Speed Toggle */}
          <button
            onClick={handleCycleSpeed}
            className="btn-icon"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              width: '36px',
              height: '26px',
              borderRadius: '4px',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
            }}
            title="Cycle Playback Speed"
          >
            {playbackSpeed}x
          </button>

          {/* Download Audio */}
          <button
            onClick={handleDownload}
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Download Audio File"
          >
            <Download size={13} />
          </button>

          {/* Delete Audio */}
          <button
            onClick={() => onDelete(recording.id)}
            className="btn-icon"
            style={{ width: '28px', height: '28px', color: 'var(--accent-rose)' }}
            title="Delete this voice recording"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Middle Row: Play/Pause button + Waveform Bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? 'var(--accent-violet)' : 'var(--accent-cyan)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: isPlaying
              ? '0 0 14px rgba(139, 92, 246, 0.4)'
              : '0 0 14px rgba(6, 182, 212, 0.35)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>

        {/* Waveform Scrubber */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            height: '36px',
            cursor: 'pointer',
            padding: '2px 0',
          }}
        >
          {waveform.map((barAmp, idx) => {
            const isBarActive = idx <= activeBarCount;
            const isHovered = hoverBarIndex !== null && idx <= hoverBarIndex;
            const barHeight = Math.max(6, Math.round(barAmp * 32));

            return (
              <div
                key={idx}
                onClick={() => handleSeek(idx)}
                onMouseEnter={() => setHoverBarIndex(idx)}
                onMouseLeave={() => setHoverBarIndex(null)}
                style={{
                  flex: 1,
                  height: `${barHeight}px`,
                  backgroundColor: isBarActive
                    ? 'var(--accent-cyan)'
                    : isHovered
                    ? 'rgba(6, 182, 212, 0.4)'
                    : 'rgba(255, 255, 255, 0.16)',
                  borderRadius: '2px',
                  transition: 'background-color 0.1s ease, height 0.15s ease',
                  boxShadow: isBarActive && idx === activeBarCount
                    ? '0 0 8px var(--accent-cyan)'
                    : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Time Progress Display */}
        <div
          style={{
            minWidth: '76px',
            textAlign: 'right',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          {formatDuration(currentTime)} / {formatDuration(duration || recording.duration)}
        </div>
      </div>

      {/* Bottom Section: Transcript (if present) */}
      {recording.transcript && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isTranscriptOpen ? '8px' : '0',
            }}
          >
            <button
              onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
              className="btn btn-ghost"
              style={{
                fontSize: '11px',
                padding: '3px 6px',
                color: 'var(--accent-cyan)',
                gap: '4px',
              }}
            >
              <FileText size={12} />
              <span>{isTranscriptOpen ? 'Hide Transcript' : 'View Transcript'}</span>
            </button>

            {isTranscriptOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={handleCopyTranscript}
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '2px 8px', gap: '4px' }}
                  title="Copy Transcript Text"
                >
                  {copiedTranscript ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                  <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                </button>

                {onInsertTranscript && (
                  <button
                    onClick={() => onInsertTranscript(recording.transcript!)}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '2px 8px', gap: '4px', color: 'var(--accent-violet)' }}
                    title="Append transcript to markdown content"
                  >
                    <Sparkles size={11} />
                    <span>Insert into Note</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {isTranscriptOpen && (
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                fontStyle: 'italic',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              "{recording.transcript}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
