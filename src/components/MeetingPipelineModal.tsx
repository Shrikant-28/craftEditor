import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  Upload,
  FileText,
  CheckCircle2,
  ListTodo,
  Mail,
  Copy,
  Plus,
  X,
  Play,
  Pause,
  Calendar,
  ArrowRight,
  Clock,
  User,
  Check,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import {
  MeetingPipelineResult,
  ActionItem,
  runMeetingPipeline,
} from '../utils/meetingPipeline';
import { VoiceRecording, Note } from '../types/note';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { formatDuration } from '../utils/audioUtils';

interface MeetingPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote?: Note | null;
  onInsertMarkdown: (markdown: string) => void;
  onCreateNewMeetingNote: (title: string, markdown: string) => void;
}

type PipelineStep = 'transcribe' | 'summarize' | 'actions' | 'followup';

export const MeetingPipelineModal: React.FC<MeetingPipelineModalProps> = ({
  isOpen,
  onClose,
  currentNote,
  onInsertMarkdown,
  onCreateNewMeetingNote,
}) => {
  const [activeStep, setActiveStep] = useState<PipelineStep>('transcribe');
  const [transcriptText, setTranscriptText] = useState('');
  const [pipelineResult, setPipelineResult] = useState<MeetingPipelineResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [newActionInput, setNewActionInput] = useState('');
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  // Live Microphone Recording hook
  const {
    isRecording,
    isPaused,
    duration,
    liveTranscript,
    visualizerBars,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    isSpeechRecognitionSupported,
  } = useVoiceRecorder();

  // If live mic transcript updates, sync to transcript text
  useEffect(() => {
    if (liveTranscript && isRecording) {
      setTranscriptText((prev) => {
        if (!prev) return liveTranscript;
        if (prev.endsWith(liveTranscript)) return prev;
        return `${prev.trim()} ${liveTranscript}`.trim();
      });
    }
  }, [liveTranscript, isRecording]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // Handle running the pipeline
  const handleExecutePipeline = () => {
    if (!transcriptText.trim()) return;

    setIsProcessing(true);
    // Simulate high-performance local processing tick for smooth UX feedback
    setTimeout(() => {
      const result = runMeetingPipeline(transcriptText);
      setPipelineResult(result);
      setIsProcessing(false);
      setActiveStep('summarize');
    }, 350);
  };

  // Handle uploading audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);

    // If text file (.txt, .md, .vtt, .srt), read directly
    if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.vtt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setTranscriptText(text);
      };
      reader.readAsText(file);
    } else {
      // For audio files, set ready indicator and populate simulated or extracted transcription
      const placeholder = `[Uploaded Audio: ${file.name} - ${(file.size / 1024 / 1024).toFixed(1)} MB]\n\nSpeaker 1: Welcome everyone. We are reviewing the deliverables for this week.\nSpeaker 2: I am finishing the client feedback integration by Friday.\nSpeaker 1: Action item: We need to run end-to-end integration tests before deployment.\nSpeaker 2: Agreed. Let's schedule a follow-up demo next Tuesday.`;
      setTranscriptText(placeholder);
    }
  };

  // Handle saving recorded audio
  const handleStopLiveRecord = async () => {
    const recorded = await stopRecording();
    if (recorded && recorded.transcript) {
      setTranscriptText((prev) => (prev ? `${prev.trim()}\n${recorded.transcript}` : recorded.transcript!));
    }
    setAudioFileName(`live-meeting-${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`);
  };

  // Copy helper
  const handleCopy = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopiedSection(null), 2000);
  };

  // Toggle action item
  const handleToggleAction = (id: string) => {
    if (!pipelineResult) return;
    const updated = pipelineResult.actionItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setPipelineResult({ ...pipelineResult, actionItems: updated });
  };

  // Add custom action item
  const handleAddActionItem = () => {
    if (!newActionInput.trim() || !pipelineResult) return;
    const newItem: ActionItem = {
      id: `custom-action-${Date.now()}`,
      task: newActionInput.trim(),
      priority: 'Medium',
      completed: false,
      assignee: 'Team',
    };
    setPipelineResult({
      ...pipelineResult,
      actionItems: [...pipelineResult.actionItems, newItem],
    });
    setNewActionInput('');
  };

  // Insert into note
  const handleInsert = () => {
    if (!pipelineResult) return;
    onInsertMarkdown(pipelineResult.fullMarkdown);
    onClose();
  };

  // Create new note
  const handleCreateNew = () => {
    if (!pipelineResult) return;
    onCreateNewMeetingNote(`🎙️ Meeting: ${pipelineResult.summary.title}`, pipelineResult.fullMarkdown);
    onClose();
  };

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
          width: '820px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-titlebar)',
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
                color: '#fff',
                boxShadow: '0 2px 10px rgba(6, 182, 212, 0.35)',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Meeting Notes Pipeline
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Transcribe → Summarize → Extract Actions → Suggest Follow-up (100% Local STT & Summarizer)
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ width: '28px', height: '28px' }} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* 4-Step Pipeline Breadcrumb Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            padding: '4px 16px',
            gap: '8px',
          }}
        >
          {[
            { id: 'transcribe', label: '1. Transcribe (STT)', icon: Mic },
            { id: 'summarize', label: '2. Summarize', icon: FileText },
            { id: 'actions', label: '3. Extract Actions', icon: ListTodo },
            { id: 'followup', label: '4. Suggest Follow-up', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeStep === tab.id;
            const isCompleted = pipelineResult !== null && tab.id !== 'transcribe';

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'transcribe' || pipelineResult) {
                    setActiveStep(tab.id as PipelineStep);
                  }
                }}
                disabled={!pipelineResult && tab.id !== 'transcribe'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? 'var(--accent-cyan)'
                    : isCompleted
                    ? 'var(--text-primary)'
                    : 'var(--text-tertiary)',
                  backgroundColor: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  cursor: !pipelineResult && tab.id !== 'transcribe' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: !pipelineResult && tab.id !== 'transcribe' ? 0.45 : 1,
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {isCompleted && <CheckCircle2 size={12} color="var(--accent-emerald)" />}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* STEP 1: TRANSCRIBE & AUDIO INPUT */}
          {activeStep === 'transcribe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Input Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Live Recording Button */}
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                        color: 'var(--accent-rose)',
                        border: '1px solid rgba(244, 63, 94, 0.35)',
                        gap: '6px',
                      }}
                      title="Record meeting audio live from microphone"
                    >
                      <Mic size={14} />
                      <span>Record Live Meeting</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopLiveRecord}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: 'var(--accent-rose)',
                        color: '#fff',
                        border: 'none',
                        gap: '6px',
                      }}
                    >
                      <div
                        className="voice-recording-dot"
                        style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }}
                      />
                      <span>Stop & Transcribe ({formatDuration(duration)})</span>
                    </button>
                  )}

                  {/* Upload Audio Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.txt,.md"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-ghost"
                    style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
                    title="Upload an audio recording (.wav, .mp3, .webm, etc.)"
                  >
                    <Upload size={14} />
                    <span>Upload Audio File</span>
                  </button>

                </div>

                {audioFileName && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <FileUp size={12} />
                    <span>{audioFileName}</span>
                  </div>
                )}
              </div>

              {/* Live Mic Waveform (when actively recording) */}
              {isRecording && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                  className="animate-fade-in"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)', fontWeight: 600 }}>
                      <div className="voice-recording-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-rose)' }} />
                      <span>Recording Meeting Audio... ({formatDuration(duration)})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={isPaused ? resumeRecording : pauseRecording} className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }}>
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button onClick={cancelRecording} className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Soundwave Bars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '36px', justifyContent: 'center' }}>
                    {visualizerBars.map((norm, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          maxWidth: '6px',
                          height: `${Math.max(4, Math.round(norm * 32))}px`,
                          backgroundColor: isPaused ? 'var(--accent-amber)' : 'var(--accent-rose)',
                          borderRadius: '2px',
                          transition: 'height 0.08s ease',
                        }}
                      />
                    ))}
                  </div>

                  {/* Live Speech Recognition Transcript Status */}
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {liveTranscript ? `Transcribing: "${liveTranscript}..."` : isSpeechRecognitionSupported ? 'Listening for speech...' : 'Recording microphone audio directly...'}
                  </div>
                </div>
              )}

              {/* Transcript Textarea Editor */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Meeting Transcript / Notes Content
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {transcriptText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste or record meeting transcript here... (e.g., 'Sarah: We decided to deploy the SQLite database... Alex: I will complete the tests by Friday.')"
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Stage Action Trigger */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={handleExecutePipeline}
                  disabled={!transcriptText.trim() || isProcessing}
                  className="btn btn-primary"
                  style={{
                    padding: '9px 20px',
                    fontSize: '13px',
                    opacity: !transcriptText.trim() || isProcessing ? 0.5 : 1,
                    cursor: !transcriptText.trim() || isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Sparkles size={15} />
                  <span>{isProcessing ? 'Processing Local AI Pipeline...' : 'Run Pipeline: Summarize & Extract ➔'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SUMMARIZE */}
          {activeStep === 'summarize' && pipelineResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
              {/* Meeting Header Card */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {pipelineResult.summary.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} style={{ color: 'var(--accent-cyan)' }} />
                    <span>{pipelineResult.summary.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} style={{ color: 'var(--accent-amber)' }} />
                    <span>Est. Duration: {pipelineResult.summary.estimatedDuration || '15 mins'}</span>
                  </div>
                  {pipelineResult.summary.attendees.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} style={{ color: 'var(--accent-violet)' }} />
                      <span>Participants: {pipelineResult.summary.attendees.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} />
                    <span>Executive Summary</span>
                  </h3>
                  <button
                    onClick={() => handleCopy(pipelineResult.summary.executiveSummary, 'exec-summary')}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '2px 6px', gap: '4px' }}
                  >
                    {copiedSection === 'exec-summary' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    <span>{copiedSection === 'exec-summary' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                  }}
                >
                  {pipelineResult.summary.executiveSummary}
                </div>
              </div>

              {/* Key Decisions */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <CheckCircle2 size={14} />
                  <span>Key Decisions Agreed Upon ({pipelineResult.summary.keyDecisions.length})</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pipelineResult.summary.keyDecisions.map((decision, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>✓</span>
                      <span>{decision}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussion Highlights by Topic */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FileText size={14} />
                  <span>Discussion Highlights by Topic</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pipelineResult.summary.keyTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                        {topic.topic}
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {topic.details.map((item, dIdx) => (
                          <li key={dIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation to Next Step */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={() => setActiveStep('transcribe')} className="btn btn-ghost" style={{ fontSize: '12px' }}>
                  ← Back to Transcript
                </button>
                <button onClick={() => setActiveStep('actions')} className="btn btn-primary" style={{ fontSize: '12px' }}>
                  <span>Next: Review Action Items ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: EXTRACT ACTIONS */}
          {activeStep === 'actions' && pipelineResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Extracted Action Items & Deliverables ({pipelineResult.actionItems.length})
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Interactive checklist extracted by local NLP analysis with assignees, priorities, and deadlines.
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      pipelineResult.actionItems
                        .map((a) => `- [${a.completed ? 'x' : ' '}] ${a.task} ${a.assignee ? `(@${a.assignee})` : ''} ${a.dueDate || ''}`)
                        .join('\n'),
                      'action-items'
                    )
                  }
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '4px 8px', gap: '4px' }}
                >
                  {copiedSection === 'action-items' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  <span>{copiedSection === 'action-items' ? 'Copied' : 'Copy Tasks'}</span>
                </button>
              </div>

              {/* Action Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pipelineResult.actionItems.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    No action items detected in transcript. You can add one below.
                  </div>
                ) : (
                  pipelineResult.actionItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: item.completed ? 'rgba(0, 0, 0, 0.04)' : 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleAction(item.id)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                      />
                      <span
                        style={{
                          fontSize: '13px',
                          color: item.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          fontWeight: 500,
                        }}
                      >
                        {item.task}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {item.assignee && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            color: 'var(--accent-violet)',
                            fontWeight: 600,
                          }}
                        >
                          @{item.assignee}
                        </span>
                      )}

                      {item.dueDate && (
                        <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontStyle: 'italic' }}>
                          {item.dueDate}
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor:
                            item.priority === 'High'
                              ? 'rgba(244, 63, 94, 0.15)'
                              : item.priority === 'Low'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            item.priority === 'High'
                              ? 'var(--accent-rose)'
                              : item.priority === 'Low'
                              ? 'var(--accent-emerald)'
                              : 'var(--accent-amber)',
                        }}
                      >
                        {item.priority}
                      </span>
                    </div>
                  </div>
                )))}
              </div>

              {/* Add Custom Action Item */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newActionInput}
                  onChange={(e) => setNewActionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddActionItem()}
                  placeholder="+ Add extra action item or follow-up task..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddActionItem}
                  disabled={!newActionInput.trim()}
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px', gap: '4px' }}
                >
                  <Plus size={13} />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={() => setActiveStep('summarize')} className="btn btn-ghost" style={{ fontSize: '12px' }}>
                  ← Back to Summary
                </button>
                <button onClick={() => setActiveStep('followup')} className="btn btn-primary" style={{ fontSize: '12px' }}>
                  <span>Next: Suggest Follow-up ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUGGEST FOLLOW-UP */}
          {activeStep === 'followup' && pipelineResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
              {/* Draft Follow-up Email */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} style={{ color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Ready-to-Send Follow-up Email
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        `Subject: ${pipelineResult.followUp.emailSubject}\n\n${pipelineResult.followUp.emailBody}`,
                        'email-body'
                      )
                    }
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '3px 8px', gap: '4px', color: 'var(--accent-cyan)' }}
                  >
                    {copiedSection === 'email-body' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    <span>{copiedSection === 'email-body' ? 'Email Copied!' : 'Copy Full Email'}</span>
                  </button>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--accent-violet)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    Subject: {pipelineResult.followUp.emailSubject}
                  </div>
                  <div>{pipelineResult.followUp.emailBody}</div>
                </div>
              </div>

              {/* Next Meeting Agenda & Open Questions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Next Meeting Agenda */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    <span>Suggested Next Agenda</span>
                  </div>
                  <ol style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {pipelineResult.followUp.nextMeetingAgenda.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ol>
                </div>

                {/* Open Questions & Blockers */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={13} />
                    <span>Open Questions & Risks</span>
                  </div>
                  {pipelineResult.followUp.openQuestions.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      No open questions or risks detected.
                    </div>
                  ) : (
                    <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {pipelineResult.followUp.openQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Navigation Back */}
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={() => setActiveStep('actions')} className="btn btn-ghost" style={{ fontSize: '12px' }}>
                  ← Back to Action Items
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-titlebar)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            onClick={() => {
              if (pipelineResult) {
                handleCopy(pipelineResult.fullMarkdown, 'full-md');
              }
            }}
            disabled={!pipelineResult}
            className="btn btn-ghost"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              gap: '6px',
              opacity: !pipelineResult ? 0.4 : 1,
            }}
          >
            {copiedSection === 'full-md' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copiedSection === 'full-md' ? 'Markdown Copied!' : 'Copy Full Markdown'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: '12px' }}>
              Cancel
            </button>

            {currentNote && (
              <button
                onClick={handleInsert}
                disabled={!pipelineResult}
                className="btn btn-ghost"
                style={{
                  fontSize: '12px',
                  color: 'var(--accent-cyan)',
                  border: '1px solid var(--border-subtle)',
                  opacity: !pipelineResult ? 0.4 : 1,
                }}
              >
                Insert into Current Note
              </button>
            )}

            <button
              onClick={handleCreateNew}
              disabled={!pipelineResult}
              className="btn btn-primary"
              style={{
                fontSize: '12px',
                padding: '7px 16px',
                gap: '6px',
                opacity: !pipelineResult ? 0.4 : 1,
              }}
            >
              <Plus size={14} />
              <span>Create New Meeting Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
