## Phase 0 — Foundation & Infrastructure (do first)

### Local AI Runtime
- [ ] Set up `node-llama-cpp` (or `@electron/llm`) in a **utility process**
- [ ] Expose a stable `LanguageModel` API to the renderer via IPC
- [ ] Add model download manager (progress, pause/resume, disk usage)
- [ ] Add model registry (small/medium/large tiers by device RAM)
- [ ] Implement hardware capability detection (RAM, GPU, CPU)
- [ ] Add fallback: disable AI features gracefully if no model installed

### Embeddings & Vector Store
- [ ] Choose embedding model (e.g., `all-MiniLM-L6-v2` via Transformers.js)
- [ ] Run embeddings locally in a worker/utility process
- [ ] Set up vector store (SQLite + `sqlite-vec`)
- [ ] Implement note chunking strategy (by heading / token window)
- [ ] Build background indexing queue (new/edited/deleted notes)
- [ ] Add index rebuild / re-index all action
- [ ] Add "delete AI index" control

### Hybrid Router & Privacy Layer
- [ ] Build model router (local vs cloud decision engine)
- [ ] Add online/offline detection
- [ ] Add user setting: Offline-only / Hybrid / Cloud-preferred
- [ ] Add per-note "never send to cloud" flag
- [ ] Implement redaction preview before any cloud call
- [ ] Add cloud AI audit log
- [ ] Add offline request queue for cloud-enhanced tasks
- [ ] Add API key management (secure storage via `safeStorage`)

### AI UX Shell
- [ ] AI side panel UI
- [ ] Command palette (invoke any AI action)
- [ ] Inline selection toolbar (summarize, rewrite, etc.)
- [ ] Streaming response rendering
- [ ] Citation/source preview component
- [ ] Online/offline + local/cloud status badges
- [ ] Cancel / retry controls for AI requests
- [ ] Loading + skeleton states
- [ ] Error states with actionable messages

---

## Phase 1 — P0 MVP Features

### Semantic Search
- [ ] Query embedding on-device
- [ ] Vector similarity search over index
- [ ] Hybrid search (keyword BM25 + vector) with score fusion
- [ ] Result snippets with highlighted matches
- [ ] Filters (tag, date, folder)
- [ ] Optional cloud rerank toggle

### Ask My Notes (RAG Q&A)
- [ ] Query → embed → retrieve top-k chunks
- [ ] Context assembly with token budgeting
- [ ] Local LLM answer generation (streamed)
- [ ] Citation rendering (link back to note + chunk)
- [ ] "Sources" panel per answer
- [ ] Follow-up question support (conversation context)
- [ ] Cloud escalation for complex queries
- [ ] Respect per-note cloud-block rules

### Summarize Note / Selection
- [ ] Summarize full note
- [ ] Summarize selection
- [ ] Summary styles: bullets / short / executive / TL;DR
- [ ] Insert summary into note / append / copy
- [ ] Cloud boost for long notes

### Action Item & Deadline Extraction
- [ ] Extract tasks, owners, dates, decisions
- [ ] One-click "add to checklist / to-do"
- [ ] Highlight source text for each item
- [ ] Cloud boost for messy transcripts

### Auto-Title / Auto-Tag / Related Notes
- [ ] Title suggestion on new note
- [ ] Tag suggestions (accept/dismiss)
- [ ] "Related notes" sidebar via embedding similarity
- [ ] Backlink suggestions
- [ ] Bulk re-tag / cleanup assistant
- [ ] Cloud boost for abstract tags

### Offline Voice Transcription
- [ ] Integrate `whisper.cpp` bindings
- [ ] Mic capture + live transcription
- [ ] Audio file import → transcript
- [ ] Timestamped segments
- [ ] Speaker diarization (basic)
- [ ] Insert transcript into note
- [ ] Optional cloud transcription fallback

### Writing Assistant
- [ ] Rewrite / shorten / expand
- [ ] Fix grammar & spelling
- [ ] Change tone (formal, casual, concise)
- [ ] Inline diff preview (accept / reject)
- [ ] Cloud boost for creative/formal writing

### Local AI Agent Commands
- [ ] Tool definitions: create note, tag, link, move, search
- [ ] Tool-calling loop with local LLM
- [ ] Confirmation step for destructive actions
- [ ] Command palette integration
- [ ] Cloud boost for multi-step commands

### Privacy Controls
- [ ] Offline-only global toggle
- [ ] Per-note cloud block
- [ ] Redaction preview modal
- [ ] Audit log viewer
- [ ] Clear AI data action (index, logs, cache)

---

## Phase 2 — P1 High-Value Features

### Meeting Notes Pipeline
- [ ] Transcribe → summarize → extract actions → suggest follow-up
- [ ] One-click pipeline from audio import
- [ ] Attendee / date / topic detection
- [ ] Cloud cleanup for noisy audio

### OCR for Images & PDFs
- [ ] Local OCR (Tesseract / PaddleOCR)
- [ ] Drag-drop image/PDF → extracted text
- [ ] Layout-aware extraction for tables
- [ ] Cloud vision boost toggle

### Daily / Weekly Digest
- [ ] Aggregate recent notes
- [ ] "What I worked on / what's pending" summary
- [ ] Schedule (daily/weekly) or manual trigger
- [ ] Cloud cross-note trend analysis

### Smart Templates
- [ ] Generate template from prompt
- [ ] Generate template from existing note
- [ ] Template library with categories
- [ ] Cloud domain-specific templates

### Duplicate & Conflict Detection
- [ ] Near-duplicate note detection (embeddings)
- [ ] Contradiction/decision conflict detection
- [ ] Merge / link suggestions
- [ ] Cloud reasoning for nuanced conflicts

### Translation
- [ ] Translate selection / full note
- [ ] Side-by-side view
- [ ] Local small translation model
- [ ] Cloud high-quality translation toggle

### Flashcards / Quiz Generation
- [ ] Generate Q&A cards from note
- [ ] Spaced-repetition export (Anki-compatible)
- [ ] Quiz mode UI
- [ ] Cloud boost for pedagogy

### Advanced Transformations
- [ ] Note → report
- [ ] Note → outline
- [ ] Note → presentation draft
- [ ] Note → email draft
- [ ] Cloud high-quality generation toggle

### Knowledge Graph Suggestions
- [ ] Entity extraction (people, projects, concepts)
- [ ] Suggested links / missing connections
- [ ] Graph view UI
- [ ] Cloud deeper relationship discovery

### Shared Workspace AI
- [ ] Permission-aware retrieval
- [ ] Team action item extraction
- [ ] Shared digest
- [ ] Cloud AI with access control enforcement

---

## Phase 3 — P2 Advanced / Differentiating

### Multi-Document Research Synthesis
- [ ] Select multiple notes → synthesize themes
- [ ] Contradiction & gap analysis
- [ ] Cloud large-context synthesis

### Trend & Insight Discovery
- [ ] Local clustering of notes by theme
- [ ] "Themes in my notes" report
- [ ] Cloud trend / contradiction analysis

### Voice Q&A Over Notes
- [ ] Voice query → STT → RAG → spoken answer (TTS)
- [ ] Cloud LLM for richer answers

### Multimodal Note Understanding
- [ ] Image captioning on-device
- [ ] Diagram/screenshot understanding
- [ ] Cloud vision model toggle

### Agentic Workflows
- [ ] Scheduled digests
- [ ] Auto-organize inbox
- [ ] Auto-link related notes
- [ ] Rule builder UI
- [ ] Cloud planning for complex workflows

### Explain / Teach Mode
- [ ] Explain note at beginner / intermediate / expert level
- [ ] Generate analogies & examples
- [ ] Cloud deeper explanations

### AI Cleanup / Formatting
- [ ] Normalize messy notes into structured docs
- [ ] Style matching to user's writing
- [ ] Cloud formatting boost

### Model Marketplace
- [ ] Browse / install local models
- [ ] Model benchmarks & recommendations by device
- [ ] Auto-update models

---

## Cross-Cutting Concerns

### Performance
- [ ] Ensure UI thread never blocks on AI
- [ ] Lazy-load models on first use
- [ ] Cancel in-flight inference on navigation
- [ ] Cache embeddings & summaries
- [ ] Streaming everywhere (no blocking waits)

### Security & Privacy
- [ ] Encrypt local AI cache at rest
- [ ] Secure API key storage
- [ ] No telemetry on note content by default
- [ ] Explicit consent flow for cloud AI
- [ ] Data export (index, logs) & full deletion

### Reliability
- [ ] Graceful degradation when model missing/corrupt
- [ ] Retry & backoff for cloud calls
- [ ] Offline queue flush on reconnect
- [ ] Model integrity checks (checksums)

### UX Polish
- [ ] Onboarding: install first model, explain offline vs cloud
- [ ] Keyboard shortcuts for all AI actions
- [ ] Undo support for AI-inserted content
- [ ] Accessible (screen reader, contrast, focus)
- [ ] Localized UI strings

### Testing
- [ ] Unit tests for router, chunker, redactor
- [ ] Integration tests for RAG pipeline
- [ ] E2E tests for AI panel (Playwright)
- [ ] Offline-mode test matrix (no network, slow network, flaky)
- [ ] Model-swap compatibility tests
- [ ] Privacy tests: cloud-blocked note never leaves device

### Observability (opt-in)
- [ ] Local-only AI usage stats (latency, tokens)
- [ ] Diagnostics export for bug reports (no content)
- [ ] Crash reporting for AI utility process

---

## Suggested Sprint Order (MVP → Ship)

1. **Sprint 1–2:** Phase 0 infrastructure (runtime, embeddings, router, AI shell)
2. **Sprint 3:** Semantic search + Summarize + Auto-title/tag
3. **Sprint 4:** Ask My Notes (RAG) with citations
4. **Sprint 5:** Voice transcription + Action item extraction
5. **Sprint 6:** Writing assistant + Agent commands + Privacy controls
6. **Sprint 7:** Stabilization, testing, onboarding → **MVP ship**
7. **Sprint 8+:** Phase 2 features by user demand
