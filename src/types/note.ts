export interface VoiceRecording {
  id: string;
  audioData: string; // Base64 Data URL (e.g. data:audio/webm;base64,...)
  duration: number; // in seconds
  recordedAt: string; // ISO timestamp
  mimeType?: string;
  transcript?: string; // Transcribed speech-to-text
  waveform?: number[]; // Normalized amplitude peaks (0.0 - 1.0) for visualizer
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  voiceRecordings?: VoiceRecording[];
}

export interface SearchMatch {
  note: Note;
  score: number;
  highlightedTitle: string;
  highlightedSnippet: string;
  matchedTags: string[];
  matchedVoice?: boolean;
}

export interface SearchFilter {
  query: string;
  tag?: string;
  category?: string;
  onlyPinned?: boolean;
  onlyVoice?: boolean;
}
