export interface MermaidTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  code: string;
}

export const MERMAID_TEMPLATES: MermaidTemplate[] = [
  {
    id: 'flowchart',
    name: 'Flowchart (Decision Logic)',
    category: 'Process',
    icon: '🔀',
    description: 'Decision tree, logical flow, and conditionals',
    code: `\`\`\`mermaid
graph TD
    A[Start Request] --> B{Valid Payload?}
    B -->|Yes| C[Process & Save to Database]
    B -->|No| D[Return 400 Bad Request]
    C --> E[Notify Subscribers]
    E --> F([Finish])
    D --> F
\`\`\`
`,
  },
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    category: 'Architecture',
    icon: '⏱️',
    description: 'Service-to-service calls with timelines',
    code: `\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Desktop App
    participant Worker as Background Task
    participant DB as SQLite Storage

    User->>UI: Action Trigger
    UI->>Worker: Dispatch Job
    Worker->>DB: Query & Commit Data
    DB-->>Worker: Commit Success
    Worker-->>UI: Real-time Notification
    UI-->>User: Refresh View
\`\`\`
`,
  },
  {
    id: 'mindmap',
    name: 'Mindmap',
    category: 'Brainstorming',
    icon: '🧠',
    description: 'Hierarchical concepts, ideas, and breakdown',
    code: `\`\`\`mermaid
mindmap
  root((Aura Notes))
    Core
      React 19
      Vite Bundler
      Electron Shell
    Features
      Markdown Engine
      Mermaid Previewer
      Voice Typing
      Smart Search
    Storage
      SQLite WASM
      File System
\`\`\`
`,
  },
  {
    id: 'architecture',
    name: 'Class / System Architecture',
    category: 'Architecture',
    icon: '🏛️',
    description: 'Classes, interfaces, and relationships',
    code: `\`\`\`mermaid
classDiagram
    class Note {
        +string id
        +string title
        +string content
        +string category
        +string[] tags
        +boolean isPinned
        +save()
    }
    class VoiceNote {
        +string audioUrl
        +string transcript
        +number duration
    }
    class MermaidDiagram {
        +string code
        +string type
        +render()
        +exportSvg()
    }
    Note "1" *-- "many" VoiceNote : attaches
    Note "1" o-- "many" MermaidDiagram : previews
\`\`\`
`,
  },
  {
    id: 'state',
    name: 'State Machine',
    category: 'Process',
    icon: '🔄',
    description: 'States and event transitions',
    code: `\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Typing: User Input
    Typing --> Previewing: Switch Mode
    Previewing --> Editing: Edit Source
    Typing --> Saved: Auto Save
    Saved --> Idle: Complete
\`\`\`
`,
  },
  {
    id: 'gantt',
    name: 'Gantt Timeline',
    category: 'Project',
    icon: '📊',
    description: 'Project roadmap, phases, and milestones',
    code: `\`\`\`mermaid
gantt
    title Release Roadmap
    dateFormat YYYY-MM-DD
    section Phase 1
    Requirements & Architecture :done, p1, 2026-10-01, 2026-10-08
    Core Implementation         :done, p2, 2026-10-09, 2026-10-20
    section Phase 2
    Mermaid Diagram Previewer   :active, p3, 2026-10-21, 2026-10-27
    Full-Screen Interactive Zoom: p4, after p3, 4d
\`\`\`
`,
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    category: 'Data',
    icon: '🥧',
    description: 'Distribution and breakdown visualization',
    code: `\`\`\`mermaid
pie title Time Spent by Activity
    "Engineering & Code" : 50
    "Architecture & Design" : 25
    "Testing & Quality" : 15
    "Documentation" : 10
\`\`\`
`,
  },
  {
    id: 'gitgraph',
    name: 'Git Graph',
    category: 'DevOps',
    icon: '🌿',
    description: 'Git branching, commits, and releases',
    code: `\`\`\`mermaid
gitGraph
    commit id: "Initial Release"
    commit id: "Add Markdown"
    branch feature/mermaid-preview
    checkout feature/mermaid-preview
    commit id: "Add Mermaid Renderer"
    commit id: "Add Zoom & Fullscreen"
    checkout main
    merge feature/mermaid-preview
    commit id: "Tag v1.2.0"
\`\`\`
`,
  },
];
