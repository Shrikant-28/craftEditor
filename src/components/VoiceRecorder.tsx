import React, { useEffect } from 'react';
import {
  Mic,
  Pause,
  Play,
  Square,
  Check,
  X,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { VoiceRecording } from '../types/note';
import { formatDuration } from '../utils/audioUtils';

interface VoiceRecorderProps {
  onSaveRecording: (recording: VoiceRecording) => void;
  onClose: () => void;
  onInsertTranscriptDirectly?: (text: string) => void;
  autoStart?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSaveRecording,
  onClose,
  onInsertTranscriptDirectly,
  autoStart = true,
}) => {
  const {
    isRecording,
    isPaused,
    duration,
    liveTranscript,
    visualizerBars,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    isSpeechRecognitionSupported,
  } = useVoiceRecorder();

  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
  }, [autoStart, startRecording]);

  const handleSave = async () => {
    const recording = await stopRecording();
    if (recording) {
      onSaveRecording(recording);
      if (onInsertTranscriptDirectly && recording.transcript) {
        onInsertTranscriptDirectly(recording.transcript);
      }
    }
    onClose();
  };

  const handleCancel = () => {
    cancelRecording();
    onClose();
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        backgroundColor: '#0c1122',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        padding: '18px 20px',
        boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15)',
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="animate-fade-in"
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isPaused
                ? 'var(--accent-amber)'
                : isRecording
                ? 'var(--accent-rose)'
                : 'var(--accent-cyan)',
              boxShadow: isRecording && !isPaused
                ? '0 0 10px var(--accent-rose)'
                : 'none',
              animation: isRecording && !isPaused ? 'pulse 1.2s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6' }}>
            {isPaused ? 'Recording Paused' : isRecording ? 'Recording Voice Note...' : 'Voice Recorder'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 700,
              color: isPaused ? 'var(--accent-amber)' : 'var(--accent-cyan)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {formatDuration(duration)}
          </span>
        </div>

        <button
          onClick={handleCancel}
          className="btn-icon"
          style={{ width: '28px', height: '28px', color: 'var(--text-tertiary)' }}
          title="Cancel Recording"
        >
          <X size={16} />
        </button>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            fontSize: '12px',
            marginBottom: '14px',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Animated Soundwave Frequency Visualizer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          height: '52px',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0 16px',
          marginBottom: '14px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {visualizerBars.map((norm, idx) => {
          const barHeight = Math.max(4, Math.round(norm * 44));
          const isCenter = Math.abs(idx - 12) < 6;
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                maxWidth: '8px',
                height: `${barHeight}px`,
                background: isRecording && !isPaused
                  ? isCenter
                    ? 'linear-gradient(180deg, #22d3ee, #8b5cf6)'
                    : 'linear-gradient(180deg, #06b6d4, #3b82f6)'
                  : 'rgba(255, 255, 255, 0.15)',
                borderRadius: '3px',
                transition: 'height 0.08s ease',
                boxShadow: isRecording && !isPaused && norm > 0.4
                  ? '0 0 8px rgba(6, 182, 212, 0.6)'
                  : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Live Speech Recognition Transcription Box */}
      {isRecording && (
        <div
          style={{
            minHeight: '34px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '6px',
            padding: '6px 12px',
            marginBottom: '14px',
            fontSize: '12px',
            color: liveTranscript ? '#e2e8f0' : 'var(--text-tertiary)',
            fontStyle: liveTranscript ? 'normal' : 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          <span>
            {liveTranscript
              ? liveTranscript
              : isSpeechRecognitionSupported
              ? 'Listening... speak clearly to transcribe live'
              : 'Recording audio directly (Speech dictation supported in browsers with Web Speech API)'}
          </span>
        </div>
      )}

      {/* Action Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <button
          onClick={handleCancel}
          className="btn btn-ghost"
          style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-rose)' }}
        >
          <Trash2 size={13} />
          <span>Discard</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Pause / Resume Button */}
          {isRecording && (
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="btn btn-ghost"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                color: isPaused ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              }}
              title={isPaused ? 'Resume recording' : 'Pause recording'}
            >
              {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Not recording yet: Start button */}
          {!isRecording && (
            <button
              onClick={startRecording}
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <Mic size={14} />
              <span>Start Recording</span>
            </button>
          )}

          {/* Save Recording Button */}
          {isRecording && (
            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{
                fontSize: '12px',
                padding: '6px 16px',
                backgroundColor: 'var(--accent-emerald)',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
              }}
              title="Finish and attach voice note"
            >
              <Check size={14} />
              <span>Save Voice Note</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
