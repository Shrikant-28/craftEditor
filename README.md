# Aura Notes — Modern Desktop Application

A sleek, high-performance desktop notes and knowledge application built with **Electron 34**, **React 19**, **Vite 6**, and **TypeScript**, featuring local ACID **SQLite 3 relational storage**, voice recording & audio playback, speech-to-text dictation, and an intelligent in-memory search engine with responsive dark and light modes.

![Aura Notes — Desktop App Overview](screenshots/1.png)

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22 and v24)
- **OS**: Windows 10/11 (or macOS / Linux)

### 2. Development Mode
Runs the Vite frontend development server with Hot Module Replacement (HMR) and concurrently boots the Electron desktop application:
```bash
npm run dev
```

### 3. Production Build
Compiles TypeScript, bundles the React web application via Vite, and bundles Electron Main & Preload scripts with esbuild:
```bash
npm run build
```

### 4. Run Packaged Desktop Shell
Runs the local production bundle in Electron:
```bash
npm run dev:electron
```

### 5. Run Test Suite
Executes the comprehensive Vitest unit and integration test suite:
```bash
npm run test
```

---

## 📦 Windows Release Packaging & Version Maintenance

The project includes an end-to-end automated Windows release pipeline with automated SemVer version bumping, SHA-256 integrity verification, and NSIS installer generation.

### Release Commands

```bash
# Full release with automated patch version bump (e.g. 1.0.1 -> 1.0.2):
npm run release

# Release with minor version bump (e.g. 1.0.1 -> 1.1.0):
npm run release -- --bump minor

# Release with major version bump (e.g. 1.1.0 -> 2.0.0):
npm run release -- --bump major

# Release with an explicit custom version:
npm run release -- --version 1.5.0

# Rebuild release keeping the existing version:
npm run release -- --no-bump

# Quick release (skips test suite):
npm run release:quick

# Standalone portable .exe (no installer):
npm run release:portable

# Quick unpacked directory test:
npm run release:dir
```

### Native Windows Scripts
You can also run the release directly from PowerShell or Command Prompt:
```powershell
# Windows Command Prompt batch script:
.\release.bat
.\release.bat --bump minor

# Windows PowerShell script with typed parameters:
.\release.ps1
.\release.ps1 -Bump minor
.\release.ps1 -Version 2.0.0
.\release.ps1 -SkipTests
.\release.ps1 -NoBump
```

### Output Distributables
Release artifacts are saved in the `release/` directory:
- **NSIS Setup Installer**: [`release/Aura Notes-Setup-<version>.exe`](file:///d:/Shrikant/practice/rea/release/) (Full Windows installer with desktop shortcut, start menu shortcut, and clean uninstaller)
- **Standalone Unpacked Binary**: [`release/win-unpacked/Aura Notes.exe`](file:///d:/Shrikant/practice/rea/release/win-unpacked/Aura%20Notes.exe)
- **Integrity Checksums**: [`release/checksums.txt`](file:///d:/Shrikant/practice/rea/release/checksums.txt) (SHA-256 hashes of all released binaries)
- **Release Audit Log**: [`release/release-history.json`](file:///d:/Shrikant/practice/rea/release/release-history.json) (Persistent release history with versions, timestamps, and artifact hashes)

### In-App Version Display & Standalone Bumping
- **Dynamic Version Badge**: The current version is rendered live in the custom **TitleBar** pill badge (`v1.0.1`) and in the **Sidebar** footer next to the SQLite database indicator.
- **Standalone SemVer Increment**: To bump version numbers without packaging:
  ```bash
  npm run version:patch    # e.g. 1.0.1 -> 1.0.2
  npm run version:minor    # e.g. 1.0.1 -> 1.1.0
  npm run version:major    # e.g. 1.0.1 -> 2.0.0
  ```

---

## 🏗️ Architecture Overview

```
d:/Shrikant/practice/rea/
├── electron/
│   ├── main.ts              # Window lifecycle, frameless controls, IPC handlers
│   ├── preload.ts           # Sandboxed contextBridge API exposing window.electronAPI
│   └── database.ts          # SQLite 3 ACID relational database engine (sql.js WASM)
├── src/
│   ├── components/
│   │   ├── TitleBar.tsx     # Frameless custom title bar, version badge, theme switch, window buttons
│   │   ├── Sidebar.tsx      # Categories, tag filters, quick views (pinned/all/voice), DB sync status
│   │   ├── SearchBar.tsx    # Multi-facet search input with Ctrl+K shortcut & latency monitor
│   │   ├── NoteList.tsx     # Filtered note cards with highlighted snippets and pin toggle
│   │   ├── NoteEditor.tsx   # Markdown editor & live preview, tag editor, speech dictation
│   │   ├── MarkdownRenderer.tsx # Highlighting markdown renderer with code block copy
│   │   ├── MeetingPipelineModal.tsx # Audio pipeline and meeting note summary modal
│   │   ├── VoiceRecorder.tsx # Voice note recorder with live microphone timer and waveform
│   │   └── VoicePlayer.tsx  # Integrated HTML5 Web Audio player with progress scrub and speed controls
│   ├── __tests__/           # Comprehensive Vitest test suite
│   │   ├── audioRecordAndPlay.test.tsx # Audio recording & playback validation
│   │   ├── dictation.test.tsx          # Speech recognition & live typing tests
│   │   ├── meetingPipeline.test.tsx    # Note transcription & audio modal tests
│   │   └── themeSwitcher.test.tsx      # Dark / Light mode switching tests
│   ├── types/
│   │   ├── electron.d.ts    # TypeScript definitions for window.electronAPI and SystemInfo
│   │   └── note.ts          # Note, VoiceRecording, and SearchFilter interfaces
│   ├── utils/
│   │   ├── audioUtils.ts    # Audio chunking, WebM conversion, and duration calculations
│   │   └── searchEngine.ts  # Token lexer, weighted scoring, and contextual snippet extraction
│   ├── App.tsx              # Root application state, responsive layout, and DB sync
│   ├── index.css            # Custom glassmorphic dark and light theme tokens
│   └── main.tsx             # React DOM entry point
├── scripts/
│   ├── release.js           # Automated Windows release build & packaging script
│   ├── bump-version.js      # SemVer version management utility
│   └── create-icon.ps1      # PowerShell .NET bicubic icon converter (.ico / .png)
├── electron-builder.json    # Electron packaging configuration for Windows NSIS
├── release.bat              # Native Windows batch release launcher
├── release.ps1              # Native PowerShell release launcher
├── package.json             # App manifest, dependencies, and build scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration with __APP_VERSION__ injection
```

---

## 💾 Local SQLite 3 Relational Storage

Unlike standard notes apps that store unindexed JSON files or localStorage strings, Aura Notes stores all data locally in an ACID-compliant **SQLite 3 database** (`aura_notes.sqlite`) in `app.getPath('userData')`:

- **Relational Tables**:
  - `notes`: Stores `id`, `title`, `content`, `category`, `is_pinned`, `created_at`, `updated_at`.
  - `tags`: Relational note tag mapping (`note_id`, `tag`).
  - `voice_recordings`: Stores voice memos and metadata associated with notes.
- **WebAssembly Engine**: Powered by `sql.js` WebAssembly for zero-dependency native execution without binary recompilation across Windows versions.
- **Auto-Sync & Recovery**: Changes are automatically committed with transactional safety.

---

## 🎙️ Voice Memos & Speech-to-Text Dictation

- **In-App Voice Recording**: Record high-fidelity audio notes with live duration timers and waveform visualizers ([`VoiceRecorder.tsx`](file:///d:/Shrikant/practice/rea/src/components/VoiceRecorder.tsx)).
- **HTML5 Web Audio Player**: Integrated playback with seek scrub bar, speed toggle (`1x`, `1.25x`, `1.5x`, `2x`), and error recovery ([`VoicePlayer.tsx`](file:///d:/Shrikant/practice/rea/src/components/VoicePlayer.tsx)).
- **Live Speech Dictation**: Hands-free voice-to-text typing directly into note content with interim transcript previews and microphone permission handling.

---

## 🔍 How Search Works in Notes Apps (Evidence & Mechanics)

Aura Notes implements an advanced, multi-stage search engine modeled after industry benchmarks (Apple Notes, Obsidian, Bear):

### 1. Token Lexing & Operator Parsing
Queries are normalized and split into distinct facets:
- **Free terms**: split by whitespace, case-folded.
- **Exact phrases**: extracted from double quotes (e.g. `"quarterly goals"`).
- **Tag filters**: extracted via `tag:xyz` or `#xyz`.
- **Category filters**: extracted via `category:xyz` or `cat:xyz`.
- **Pin filter**: extracted via `is:pinned`.

*Implementation:* [`src/utils/searchEngine.ts`](file:///d:/Shrikant/practice/rea/src/utils/searchEngine.ts#L17-L55)

### 2. Weighted Relevance Scoring
Matches across different fields are ranked according to human reading priority:
| Match Location | Weight Points | Rationale |
|---|---|---|
| **Exact Title Match** | `+100` | Exact intent match |
| **Title Starts With** | `+60` | High prefix relevance |
| **Title Contains** | `+40` | Partial title relevance |
| **Tag Match** | `+35` | Intentional categorization |
| **Exact Quoted Phrase** | `+80 (Title) / +40 (Body)` | Explicit phrase preservation |
| **Content Body Match** | `+15` (+ up to `+25` TF) | Term frequency in body |
| **Pinned Note** | `+10` | User priority boost |
| **Recency (<7 days)** | `+0` to `+5` | Freshness decay bonus |

*Implementation:* [`src/utils/searchEngine.ts`](file:///d:/Shrikant/practice/rea/src/utils/searchEngine.ts#L112-L215)

### 3. Contextual Snippet Extraction
Instead of showing the first 100 characters of a note, the engine finds the first occurrence of any query token in the document body and extracts a focused window around it with ellipsis markers (`...match...`).

*Implementation:* [`src/utils/searchEngine.ts`](file:///d:/Shrikant/practice/rea/src/utils/searchEngine.ts#L80-L107)

### 4. Dynamic Highlight Rendering
Tokens are safely regex-escaped and wrapped with `<mark class="search-highlight">` tags, providing instant visual feedback in both the note title and body snippet.

*Implementation:* [`src/utils/searchEngine.ts`](file:///d:/Shrikant/practice/rea/src/utils/searchEngine.ts#L60-L75)

---

## 🎨 Design & Desktop Features

- **Dark & Light Mode**: Seamless theme switching with curated HSL color tokens that preserve contrast, readability, and glassmorphism.
- **Responsive Layout**: Adaptive layout supporting full desktop widescreen, laptop, tablet, and mobile drawer views.
- **Frameless Window**: Custom draggable title bar with smooth maximize, minimize, and close window controls.
- **Native File Export**: Export notes to Markdown (`.md`) or plain text (`.txt`) using native OS save dialogs.
- **Keyboard Shortcuts**: Press `Ctrl+K` or `/` from anywhere to focus search.
- **Zero-Trust Security**: Electron runs with `contextIsolation: true`, `nodeIntegration: false`, and sandboxed `preload.ts`.
