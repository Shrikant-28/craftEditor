import { Note } from '../types/note';
import { createSampleAudioBase64, generateWaveform } from '../utils/audioUtils';

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-voice-demo',
    title: 'Voice Memo: Q4 Sprint Planning & Architecture Review',
    content: `# Voice Memo: Q4 Sprint Planning & Architecture Review

*Recorded audio note discussing upcoming sprint goals and audio feature implementation.*

### Action Items from Recording:
- [x] Integrate Web Audio API and MediaRecorder for voice memos
- [x] Implement dynamic frequency soundwave visualizer
- [x] Enable interactive waveform seek scrubber & playback speed toggle
- [ ] Connect cloud sync for binary audio storage

> 🎙️ **Voice Memo:**
> "Hey team, just summarizing our morning standup. We decided to prioritize the voice note capability with interactive waveform scrubbing and real-time speech transcription. Please make sure the audio files persist directly in the local store and can be exported as markdown or webm."`,
    category: 'Product',
    tags: ['voice-memo', 'planning', 'audio', 'sprint'],
    isPinned: true,
    createdAt: '2026-10-26T09:30:00.000Z',
    updatedAt: '2026-10-26T10:15:00.000Z',
    voiceRecordings: [
      {
        id: 'voice-demo-1',
        audioData: createSampleAudioBase64(3.2),
        duration: 3,
        recordedAt: '2026-10-26T09:32:00.000Z',
        mimeType: 'audio/wav',
        transcript: 'Hey team, just summarizing our morning standup. We decided to prioritize the voice note capability with interactive waveform scrubbing and real-time speech transcription. Please make sure the audio files persist directly in the local store.',
        waveform: generateWaveform(36, 'voice-demo-1'),
      },
    ],
  },
  {
    id: 'note-1',
    title: 'Electron + React Desktop Architecture',
    content: `# Desktop Architecture Overview

This desktop application combines **Electron 34**, **React 19**, and **Vite 6** with TypeScript.

## Key Layers
1. **Main Process (\`electron/main.ts\`)**:
   - Manages native BrowserWindow lifecycle
   - Handles OS system dialogs and file system I/O
   - Implements IPC endpoints with \`ipcMain.handle\`
2. **Preload Script (\`electron/preload.ts\`)**:
   - Uses \`contextBridge.exposeInMainWorld\` for zero-risk sandboxing
   - Exposes typed \`window.electronAPI\`
3. **Renderer Process (\`src/\`)**:
   - Fast React UI powered by Vite HMR
   - Client-side weighted token search engine (<1ms)
   - Synchronizes seamlessly with local disk storage via IPC`,
    category: 'Engineering',
    tags: ['electron', 'react', 'architecture', 'vite'],
    isPinned: true,
    createdAt: '2026-10-20T09:00:00.000Z',
    updatedAt: '2026-10-25T14:30:00.000Z',
  },
  {
    id: 'note-2',
    title: 'Search Mechanics: How Smart Search Works in Modern Notes Apps',
    content: `# Understanding Notes App Search Algorithms

Modern notes applications (such as Apple Notes, Obsidian, Notion, Bear) use a multi-stage search pipeline:

### 1. Tokenization & Syntax Parsing
- Query terms are normalized and split into distinct search tokens.
- Specialized operators are parsed:
  - \`tag:name\` for instant tag filtering
  - \`is:pinned\` for status checks
  - \`"exact phrase"\` for substring preservation

### 2. Weighted Ranking (Scoring)
- **Title match:** Highest weight (Title startsWith > Title includes)
- **Tag matches:** Medium-high weight
- **Content match frequency:** Scaled term frequency (TF)
- **Recency & Pinning:** Boost recent and pinned notes

### 3. Contextual Snippet Extraction & Highlighting
- Finds the earliest occurrence of any matched token in the document body.
- Slices a window around the match with ellipsis markers.
- Renders highlighted \`<mark>\` tokens inside the title and snippet preview.`,
    category: 'Research',
    tags: ['search', 'algorithm', 'notes', 'ux'],
    isPinned: true,
    createdAt: '2026-10-22T11:15:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
  },
  {
    id: 'note-3',
    title: 'Product Roadmap & Q4 Milestones',
    content: `### Q4 Milestone Checklist

- [x] Complete Electron Desktop Shell integration
- [x] Implement instantaneous token search and snippet extraction
- [x] Add Dark Mode design system with glassmorphism
- [ ] Add offline SQLite database synchronization
- [ ] Implement cloud backup and collaborative syncing
- [ ] Native markdown rendering with syntax highlighting

Target release window: End of November. Weekly status reviews every Monday at 10:00 AM IST.`,
    category: 'Product',
    tags: ['roadmap', 'milestones', 'planning'],
    isPinned: false,
    createdAt: '2026-10-18T16:45:00.000Z',
    updatedAt: '2026-10-24T18:20:00.000Z',
  },
  {
    id: 'note-4',
    title: 'TypeScript Performance & Bundle Optimization',
    content: `### Vite & esbuild Compilation Optimization Tips

1. **Path Aliasing**:
   - Configure \`@/*\` in both \`tsconfig.json\` and \`vite.config.ts\` for clean relative imports.
2. **Node Integration**:
   - Never turn on \`nodeIntegration: true\` in renderer. Always route file and OS access through \`preload.ts\`.
3. **Search Indexing**:
   - In-memory note search executes in <1ms for thousands of notes.
   - For 100k+ notes, consider Web Workers or SQLite FTS5 (Full Text Search).`,
    category: 'Engineering',
    tags: ['typescript', 'performance', 'vite'],
    isPinned: false,
    createdAt: '2026-10-15T13:20:00.000Z',
    updatedAt: '2026-10-23T11:10:00.000Z',
  },
  {
    id: 'note-5',
    title: 'Design System & Dark Mode Color Palette',
    content: `# Modern Glassmorphic Dark Mode Tokens

- **Background Deep**: \`#0b0f19\`
- **Surface Elevation 1**: \`#111827\`
- **Surface Elevation 2**: \`#1f2937\`
- **Accent Primary**: \`#06b6d4\` (Cyan glow)
- **Accent Secondary**: \`#8b5cf6\` (Violet gradient)
- **Glass Border**: \`rgba(255, 255, 255, 0.08)\`
- **Text Primary**: \`#f9fafb\`
- **Text Muted**: \`#9ca3af\`

Backdrop filter blur with subtle borders gives a sleek, high-end Apple macOS / Windows 11 Fluent look.`,
    category: 'Design',
    tags: ['design', 'css', 'darkmode', 'ui'],
    isPinned: false,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-25T16:00:00.000Z',
  },
];
