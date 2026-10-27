import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MermaidPreviewer, detectDiagramType } from '../components/MermaidPreviewer';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { NoteEditor } from '../components/NoteEditor';
import { Note } from '../types/note';
import { MERMAID_TEMPLATES } from '../utils/mermaidTemplates';

describe('Mermaid Diagram Previewer Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectDiagramType utility', () => {
    it('detects flowchart and graph diagrams', () => {
      expect(detectDiagramType('graph TD\nA-->B').label).toBe('Flowchart');
      expect(detectDiagramType('flowchart LR\nA-->B').label).toBe('Flowchart');
    });

    it('detects sequence diagrams', () => {
      expect(detectDiagramType('sequenceDiagram\nAlice->>Bob: Hello').label).toBe('Sequence Diagram');
    });

    it('detects mindmaps', () => {
      expect(detectDiagramType('mindmap\nroot((Idea))\n  Feature').label).toBe('Mindmap');
    });

    it('detects class diagrams', () => {
      expect(detectDiagramType('classDiagram\nclass Note').label).toBe('Class Diagram');
    });

    it('detects state diagrams', () => {
      expect(detectDiagramType('stateDiagram-v2\n[*] --> Active').label).toBe('State Diagram');
    });

    it('detects gantt charts and pie charts', () => {
      expect(detectDiagramType('gantt\ntitle Roadmap').label).toBe('Gantt Chart');
      expect(detectDiagramType('pie title Distribution\n"A": 50').label).toBe('Pie Chart');
    });

    it('detects git graphs', () => {
      expect(detectDiagramType('gitGraph\ncommit').label).toBe('Git Graph');
    });

    it('defaults to Mermaid Diagram for general diagrams', () => {
      expect(detectDiagramType('customUnknownDiagram\nx').label).toBe('Mermaid Diagram');
    });
  });

  describe('MermaidPreviewer Component', () => {
    const sampleFlowchart = `graph TD
    A[Start] --> B{Decide}
    B -->|Yes| C[Approved]
    B -->|No| D[Rejected]`;

    it('renders diagram preview with type badge and canvas', async () => {
      render(<MermaidPreviewer code={sampleFlowchart} />);

      expect(screen.getByText('Flowchart')).toBeDefined();
      expect(screen.getByText(/4\s+lines/)).toBeDefined();

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-canvas')).toBeDefined();
      });
    });

    it('allows toggling between Diagram, Split, and Code view modes', async () => {
      render(<MermaidPreviewer code={sampleFlowchart} />);
      await waitFor(() => {
        expect(screen.getByTestId('mermaid-canvas')).toBeDefined();
      });

      // Default is Diagram mode
      expect(screen.getByTestId('mermaid-canvas')).toBeDefined();
      expect(screen.queryByTestId('mermaid-code-view')).toBeNull();

      // Switch to Code mode
      fireEvent.click(screen.getByTestId('mermaid-view-code-btn'));
      expect(screen.getByTestId('mermaid-code-view')).toBeDefined();
      expect(screen.queryByTestId('mermaid-canvas')).toBeNull();
      expect(screen.getByText('A[Start] --> B{Decide}')).toBeDefined();

      // Switch to Split mode
      fireEvent.click(screen.getByTestId('mermaid-view-split-btn'));
      expect(screen.getByTestId('mermaid-canvas')).toBeDefined();
      expect(screen.getByTestId('mermaid-code-view')).toBeDefined();

      // Switch back to Diagram mode
      fireEvent.click(screen.getByTestId('mermaid-view-diagram-btn'));
      expect(screen.getByTestId('mermaid-canvas')).toBeDefined();
      expect(screen.queryByTestId('mermaid-code-view')).toBeNull();
    });

    it('supports interactive zoom in, zoom out, and reset zoom', async () => {
      render(<MermaidPreviewer code={sampleFlowchart} />);
      await waitFor(() => {
        expect(screen.getByTestId('mermaid-canvas')).toBeDefined();
      });

      const zoomLabel = screen.getByTestId('mermaid-zoom-level');
      expect(zoomLabel.textContent).toBe('100%');

      // Zoom in
      fireEvent.click(screen.getByTestId('mermaid-zoom-in'));
      expect(zoomLabel.textContent).toBe('120%');

      fireEvent.click(screen.getByTestId('mermaid-zoom-in'));
      expect(zoomLabel.textContent).toBe('140%');

      // Zoom out
      fireEvent.click(screen.getByTestId('mermaid-zoom-out'));
      expect(zoomLabel.textContent).toBe('120%');

      // Reset
      fireEvent.click(screen.getByTestId('mermaid-zoom-reset'));
      expect(zoomLabel.textContent).toBe('100%');
    });

    it('supports copying rendered SVG and raw code to clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(<MermaidPreviewer code={sampleFlowchart} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-copy-svg')).toBeDefined();
      });

      // Copy SVG
      fireEvent.click(screen.getByTestId('mermaid-copy-svg'));
      expect(writeTextMock).toHaveBeenCalled();
      expect(screen.getByText('Copied')).toBeDefined();

      // Copy Code
      fireEvent.click(screen.getByTestId('mermaid-copy-code'));
      expect(writeTextMock).toHaveBeenCalledWith(sampleFlowchart);
    });

    it('supports downloading diagram as SVG', async () => {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-download');
      window.URL.revokeObjectURL = vi.fn();

      render(<MermaidPreviewer code={sampleFlowchart} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-download-svg')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('mermaid-download-svg'));
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('opens and closes fullscreen expand modal', async () => {
      render(<MermaidPreviewer code={sampleFlowchart} />);
      await waitFor(() => {
        expect(screen.getByTestId('mermaid-canvas')).toBeDefined();
      });

      expect(screen.queryByTestId('mermaid-fullscreen-modal')).toBeNull();

      // Open fullscreen
      fireEvent.click(screen.getByTestId('mermaid-fullscreen-btn'));
      expect(screen.getByTestId('mermaid-fullscreen-modal')).toBeDefined();
      expect(screen.getByText('Exit Fullscreen')).toBeDefined();

      // Close fullscreen
      fireEvent.click(screen.getByTestId('mermaid-close-fullscreen'));
      expect(screen.queryByTestId('mermaid-fullscreen-modal')).toBeNull();
    });

    it('displays error banner gracefully on diagram syntax failure', async () => {
      const invalidCode = 'syntax_error_mock_trigger graph TD\ninvalid';
      render(<MermaidPreviewer code={invalidCode} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-error-banner')).toBeDefined();
      });

      expect(screen.getByText('Diagram Syntax Error')).toBeDefined();
      expect(screen.getByText(/Parse error on line 1/)).toBeDefined();

      // Click switch to code view
      fireEvent.click(screen.getByText('Switch to Code View to Edit'));
      expect(screen.getByTestId('mermaid-code-view')).toBeDefined();
    });
  });

  describe('MarkdownRenderer Integration', () => {
    it('automatically renders mermaid code blocks as interactive MermaidPreviewer', async () => {
      const markdown = `# Architecture Overview\n\nHere is our system flow:\n\n\`\`\`mermaid\ngraph TD\nClient --> Server\n\`\`\`\n\nOther notes.`;

      render(<MarkdownRenderer content={markdown} />);

      expect(screen.getByText('Architecture Overview')).toBeDefined();
      expect(screen.getByText('Here is our system flow:')).toBeDefined();

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-previewer')).toBeDefined();
        expect(screen.getByText('Flowchart')).toBeDefined();
      });
    });

    it('renders normal code blocks with standard CodeBlock component', () => {
      const markdown = `\`\`\`javascript\nconst x = 42;\n\`\`\``;

      render(<MarkdownRenderer content={markdown} />);

      expect(screen.queryByTestId('mermaid-previewer')).toBeNull();
      expect(screen.getByText('JavaScript')).toBeDefined();
      expect(screen.getByText('const')).toBeDefined();
    });
  });

  describe('NoteEditor Toolbar Mermaid Picker Integration', () => {
    const mockNote: Note = {
      id: 'note-mermaid-1',
      title: 'Diagram Project',
      content: 'Initial text',
      category: 'Work',
      tags: ['diagram'],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('renders Mermaid toolbar button and opens template menu with templates', () => {
      const handleUpdate = vi.fn();
      render(
        <NoteEditor
          note={mockNote}
          onUpdateNote={handleUpdate}
          onDeleteNote={vi.fn()}
          categories={['Work']}
        />
      );

      const mermaidBtn = screen.getByTestId('toolbar-mermaid-btn');
      expect(mermaidBtn).toBeDefined();

      // Open menu
      fireEvent.click(mermaidBtn);
      expect(screen.getByTestId('mermaid-template-menu')).toBeDefined();
      expect(screen.getByText('Insert Diagram')).toBeDefined();
      expect(screen.getByText('Flowchart (Decision Logic)')).toBeDefined();
      expect(screen.getByText('Sequence Diagram')).toBeDefined();
      expect(screen.getByText('Mindmap')).toBeDefined();
    });

    it('inserts selected Mermaid template into note content', () => {
      const handleUpdate = vi.fn();
      render(
        <NoteEditor
          note={mockNote}
          onUpdateNote={handleUpdate}
          onDeleteNote={vi.fn()}
          categories={['Work']}
        />
      );

      // Open template menu
      fireEvent.click(screen.getByTestId('toolbar-mermaid-btn'));

      // Click on Sequence Diagram template
      fireEvent.click(screen.getByTestId('insert-mermaid-sequence'));

      expect(handleUpdate).toHaveBeenCalled();
      const updatedNote = handleUpdate.mock.calls[0][0];
      expect(updatedNote.content).toContain('```mermaid\nsequenceDiagram');
    });
  });
});
