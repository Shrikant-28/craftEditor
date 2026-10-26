import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceRecording } from '../types/note';
import { generateWaveform } from '../utils/audioUtils';

export interface UseVoiceRecorderResult {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  liveTranscript: string;
  visualizerBars: number[];
  error: string | null;
  startRecording: () => Promise<boolean>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<VoiceRecording | null>;
  cancelRecording: () => void;
  isSpeechRecognitionSupported: boolean;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(24).fill(0.1));
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedPeaksRef = useRef<number[]>([]);
  const transcriptRef = useRef<string>('');

  const isSpeechRecognitionSupported = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Clean up all resources
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    audioChunksRef.current = [];
    recordedPeaksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setLiveTranscript('');
    setVisualizerBars(new Array(24).fill(0.1));
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    audioChunksRef.current = [];
    recordedPeaksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone access is not supported in this environment.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      // Select best MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      let selectedMimeType = '';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type;
            break;
          }
        }
      }

      const recorderOptions: MediaRecorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Set up Web Audio API Analyser for real-time visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let lastSampleTime = 0;

          const updateVisualizer = (currentTime: number) => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            // Map frequency bins to 24 bars
            const bars: number[] = [];
            const step = Math.max(1, Math.floor(dataArray.length / 24));
            let maxAmp = 0;

            for (let i = 0; i < 24; i++) {
              const val = dataArray[i * step] || 0;
              const norm = Math.max(0.1, val / 255);
              bars.push(norm);
              if (norm > maxAmp) maxAmp = norm;
            }
            setVisualizerBars(bars);

            // Record peak for persistent waveform (sample every 150ms)
            if (currentTime - lastSampleTime > 150) {
              lastSampleTime = currentTime;
              recordedPeaksRef.current.push(Math.round(maxAmp * 100) / 100);
            }

            animationFrameRef.current = requestAnimationFrame(updateVisualizer);
          };

          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        }
      } catch (audioErr) {
        console.warn('AudioContext visualization setup error:', audioErr);
      }

      // Set up live speech recognition if supported
      if (isSpeechRecognitionSupported) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = navigator.language || 'en-US';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript;
            }
            transcriptRef.current = fullText;
            setLiveTranscript(fullText);
          };

          recognition.onerror = (err: any) => {
            console.warn('SpeechRecognition notice:', err);
          };

          recognition.onend = () => {
            // Keep recognizing if still recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              try {
                recognition.start();
              } catch {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn('SpeechRecognition failed to initialize:', speechErr);
        }
      }

      // Start recorder (request data every 500ms)
      recorder.start(500);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Timer
      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 500);

      return true;
    } catch (err: any) {
      console.error('Error starting voice recording:', err);
      let errorMsg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission was denied. Please allow microphone access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone device was found.';
      }
      setError(errorMsg);
      cleanup();
      return false;
    }
  }, [cleanup, isSpeechRecognitionSupported]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      const currentDur = duration;
      const resumeTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setDuration(currentDur + Math.floor((Date.now() - resumeTime) / 1000));
      }, 500);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }
  }, [duration]);

  const stopRecording = useCallback((): Promise<VoiceRecording | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanup();
        resolve(null);
        return;
      }

      const recordedDuration = Math.max(1, duration);
      const transcript = transcriptRef.current;
      const peaks = recordedPeaksRef.current;

      recorder.onstop = async () => {
        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          // Read blob as base64 data URL
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            // Downsample peaks to 36 bars for clean display
            let finalWaveform: number[];
            if (peaks.length >= 20) {
              finalWaveform = [];
              const step = peaks.length / 36;
              for (let i = 0; i < 36; i++) {
                const idx = Math.min(peaks.length - 1, Math.floor(i * step));
                finalWaveform.push(Math.max(0.15, Math.min(0.95, peaks[idx])));
              }
            } else {
              finalWaveform = generateWaveform(36, `rec-${Date.now()}`);
            }

            const voiceRecording: VoiceRecording = {
              id: `voice-${Date.now()}`,
              audioData: base64Data,
              duration: recordedDuration,
              recordedAt: new Date().toISOString(),
              mimeType,
              transcript: transcript.trim() || undefined,
              waveform: finalWaveform,
            };

            cleanup();
            resolve(voiceRecording);
          };

          reader.onerror = () => {
            cleanup();
            resolve(null);
          };

          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error('Error processing audio recording:', err);
          cleanup();
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error('Failed to stop media recorder:', err);
        cleanup();
        resolve(null);
      }
    });
  }, [cleanup, duration]);

  const cancelRecording = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
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
  };
}
