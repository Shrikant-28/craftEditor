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
- [x] Native markdown rendering with syntax highlighting
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

## Core Process Architecture

\`\`\`typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

export function createDesktopWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    backgroundColor: '#0b0f19',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.loadURL('http://localhost:5173');
  return mainWindow;
}
\`\`\`

## Key Layers Summary

| Layer | Technology | Primary Responsibility |
| :--- | :--- | :--- |
| **Main Process** | Electron & Node.js | Window management, Native dialogs, Disk I/O |
| **Preload Bridge** | ContextBridge | Typed secure IPC exposure (\`window.electronAPI\`) |
| **Renderer** | React 19 & Vite | Native Markdown with syntax highlighting, Voice UI |

\`\`\`bash
# Build production bundle
npm run build:vite && npm run build:electron
\`\`\``,
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

\`\`\`python
# Zero-allocation token parser
def parse_search_query(query: str) -> dict:
    tokens = query.strip().split()
    tags = [t[4:] for t in tokens if t.startswith("tag:")]
    keywords = [t for t in tokens if not t.startswith("tag:")]
    return {"tags": tags, "keywords": keywords}
\`\`\`

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
- [x] Native markdown rendering with syntax highlighting
- [x] Dual-pane live Split View mode
- [ ] Add offline SQLite database synchronization
- [ ] Implement cloud backup and collaborative syncing

### Target Release Milestones

| Milestone | Target Date | Owner | Status |
| :--- | :---: | :---: | :---: |
| Native Markdown & Code Highlighter | Oct 26 | Frontend Team | **Completed** |
| Memory & Heap Optimizations | Oct 26 | Core Engineering | **Completed** |
| Offline SQLite Engine | Nov 15 | Backend Team | In Progress |

Target release window: End of November. Weekly status reviews every Monday at 10:00 AM IST.`,
    category: 'Product',
    tags: ['roadmap', 'milestones', 'planning'],
    isPinned: false,
    createdAt: '2026-10-18T16:45:00.000Z',
    updatedAt: '2026-10-26T12:00:00.000Z',
  },
  {
    id: 'note-4',
    title: 'Database Schema & Query Optimization',
    content: `### SQL Schema for Local Offline Notes Sync

\`\`\`sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_pinned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fast Full-Text Search index
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='rowid'
);
\`\`\`

Querying with snippet extraction:
\`\`\`sql
SELECT title, snippet(notes_fts, 1, '<mark>', '</mark>', '...', 15)
FROM notes_fts
WHERE notes_fts MATCH 'electron architecture'
ORDER BY rank;
\`\`\``,
    category: 'Engineering',
    tags: ['sql', 'database', 'sqlite', 'performance'],
    isPinned: false,
    createdAt: '2026-10-15T13:20:00.000Z',
    updatedAt: '2026-10-23T11:10:00.000Z',
  },
  {
    id: 'note-5',
    title: 'Design System & Dark Mode Color Palette',
    content: `# Modern Glassmorphic Dark Mode Tokens

\`\`\`json
{
  "theme": "dark-aura",
  "colors": {
    "bgDeep": "#0b0f19",
    "surfaceElevated": "#111827",
    "accentCyan": "#06b6d4",
    "accentViolet": "#8b5cf6",
    "accentEmerald": "#10b981",
    "borderSubtle": "rgba(255, 255, 255, 0.08)"
  }
}
\`\`\`

- **Background Deep**: \`#0b0f19\`
- **Surface Elevation 1**: \`#111827\`
- **Accent Primary**: \`#06b6d4\` (Cyan glow)
- **Accent Secondary**: \`#8b5cf6\` (Violet gradient)

Backdrop filter blur with subtle borders gives a sleek, high-end Apple macOS / Windows 11 Fluent look.`,
    category: 'Design',
    tags: ['design', 'css', 'darkmode', 'ui'],
    isPinned: false,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-25T16:00:00.000Z',
  },
];
