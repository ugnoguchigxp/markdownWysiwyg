import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18nContext';
import { FloatingToolbar } from './FloatingToolbar';

vi.mock('@tiptap/extension-table', () => ({}));

function createMockEditor() {
  const toggleBoldMock = vi.fn().mockReturnValue({ run: vi.fn() });
  const toggleItalicMock = vi.fn().mockReturnValue({ run: vi.fn() });
  const toggleStrikeMock = vi.fn().mockReturnValue({ run: vi.fn() });
  const toggleCodeMock = vi.fn().mockReturnValue({ run: vi.fn() });
  const focusMock = vi.fn().mockReturnValue({ run: vi.fn() });

  const chain = vi.fn().mockReturnValue({
    toggleBold: toggleBoldMock,
    toggleItalic: toggleItalicMock,
    toggleStrike: toggleStrikeMock,
    toggleCode: toggleCodeMock,
    focus: focusMock,
  });

  const commands = {
    insertTable: vi.fn(() => true),
    insertContent: vi.fn(() => true),
  };

  return {
    chain,
    commands,
    extensionManager: { extensions: [{ name: 'table' }] },
    toggleBold: toggleBoldMock,
    toggleItalic: toggleItalicMock,
    toggleStrike: toggleStrikeMock,
    toggleCode: toggleCodeMock,
  } as unknown as Editor;
}

function renderWithWrapper(ui: React.ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('FloatingToolbar - Component behavior', () => {
  let mockEditor: ReturnType<typeof createMockEditor>;
  const defaultOnInsertMarkdown = vi.fn();
  const defaultOnDownloadAsMarkdown = vi.fn();

  beforeEach(() => {
    mockEditor = createMockEditor();
    defaultOnInsertMarkdown.mockClear();
    defaultOnDownloadAsMarkdown.mockClear();
  });

  describe('Rendering based on props', () => {
    it('renders when both visible and editable are true', () => {
      const { container } = renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 100, left: 200 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const toolbar = container.querySelector('.floating-toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
      const { container } = renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={false}
          position={{ top: 100, left: 200 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const toolbar = container.querySelector('.floating-toolbar');
      expect(toolbar).not.toBeInTheDocument();
    });

    it('does not render when editable is false', () => {
      const { container } = renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 100, left: 200 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={false}
        />,
      );

      const toolbar = container.querySelector('.floating-toolbar');
      expect(toolbar).not.toBeInTheDocument();
    });

    it('applies position styles to the toolbar', () => {
      const { container } = renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 150, left: 300 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const toolbar = container.querySelector('.floating-toolbar') as HTMLElement;
      expect(toolbar.style.top).toBe('150px');
      expect(toolbar.style.left).toBe('300px');
    });
  });

  describe('Props forwarding to MarkdownToolbar', () => {
    it('passes editor prop correctly', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('passes selectedText to MarkdownToolbar', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
          selectedText="Hello World"
        />,
      );

      const boldButton = screen.getByTitle('Bold');
      expect(boldButton).toBeInTheDocument();
    });

    it('passes disabled state based on editable prop', () => {
      const { container } = renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={false}
        />,
      );

      const toolbar = container.querySelector('.floating-toolbar');
      expect(toolbar).not.toBeInTheDocument();
    });

    it('passes showDownloadButton to MarkdownToolbar', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
          showDownloadButton={true}
          onDownloadAsMarkdown={defaultOnDownloadAsMarkdown}
        />,
      );

      const downloadButton = screen.getByTitle('Download');
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('Editor commands interaction', () => {
    it('shows formatting buttons when text is selected in floating mode', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
          selectedText="selected text"
        />,
      );

      expect(screen.getByTitle('Bold')).toBeInTheDocument();
      expect(screen.getByTitle('Italic')).toBeInTheDocument();
      expect(screen.getByTitle('Strikethrough')).toBeInTheDocument();
      expect(screen.getByTitle('Code')).toBeInTheDocument();
    });

    it('shows insertion buttons when no text is selected in floating mode', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
          selectedText=""
        />,
      );

      expect(screen.queryByTitle('Bold')).not.toBeInTheDocument();
      expect(screen.getByTitle('Quote')).toBeInTheDocument();
      expect(screen.getByTitle('FileCode')).toBeInTheDocument();
      expect(screen.getByTitle('List')).toBeInTheDocument();
      expect(screen.getByTitle('ListOrdered')).toBeInTheDocument();
    });

    it('calls onInsertMarkdown for blockquote button', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const blockquoteButton = screen.getByTitle('Quote');
      fireEvent.click(blockquoteButton);

      expect(defaultOnInsertMarkdown).toHaveBeenCalledWith('> ');
    });

    it('calls onInsertMarkdown for bullet list button', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const listButton = screen.getByTitle('List');
      fireEvent.click(listButton);

      expect(defaultOnInsertMarkdown).toHaveBeenCalledWith('- ');
    });

    it('calls onInsertMarkdown for ordered list button', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const orderedListButton = screen.getByTitle('ListOrdered');
      fireEvent.click(orderedListButton);

      expect(defaultOnInsertMarkdown).toHaveBeenCalledWith('1. ');
    });

    it('calls onInsertMarkdown for code block button', () => {
      renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const codeBlockButton = screen.getByTitle('FileCode');
      fireEvent.click(codeBlockButton);

      expect(defaultOnInsertMarkdown).toHaveBeenCalledWith('```\n\n```');
    });
  });

  describe('Event handling', () => {
    it('has correct CSS classes for positioning', () => {
      const { container } = renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const toolbar = container.querySelector('.floating-toolbar') as HTMLElement;
      expect(toolbar.className).toContain('absolute');
      expect(toolbar.className).toContain('z-50');
      expect(toolbar.className).toContain('-translate-x-1/2');
      expect(toolbar.className).toContain('transition-opacity');
    });
  });

  describe('CSS styling', () => {
    it('has correct CSS classes for positioning', () => {
      const { container } = renderWithWrapper(
        <FloatingToolbar
          editor={mockEditor}
          visible={true}
          position={{ top: 0, left: 0 }}
          onInsertMarkdown={defaultOnInsertMarkdown}
          editable={true}
        />,
      );

      const toolbar = container.querySelector('.floating-toolbar') as HTMLElement;
      expect(toolbar.className).toContain('absolute');
      expect(toolbar.className).toContain('z-50');
      expect(toolbar.className).toContain('-translate-x-1/2');
      expect(toolbar.className).toContain('transition-opacity');
    });
  });
});
