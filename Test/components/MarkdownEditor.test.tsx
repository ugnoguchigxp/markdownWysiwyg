import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownEditor } from '../../src/components/MarkdownEditor';
import { I18N_KEYS } from '../../src/types/index';

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

const mockEditorCommands = {
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleStrike: vi.fn().mockReturnThis(),
  toggleCode: vi.fn().mockReturnThis(),
  setHeading: vi.fn().mockReturnThis(),
  toggleBulletList: vi.fn().mockReturnThis(),
  toggleOrderedList: vi.fn().mockReturnThis(),
  toggleBlockquote: vi.fn().mockReturnThis(),
  toggleCodeBlock: vi.fn().mockReturnThis(),
  focus: vi.fn().mockReturnThis(),
  run: vi.fn(),
  setContent: vi.fn(),
  clearContent: vi.fn(),
  insertContent: vi.fn().mockReturnValue(true),
  deleteRange: vi.fn().mockReturnThis(),
  setTextSelection: vi.fn().mockReturnThis(),
  chain: vi.fn().mockReturnThis(),
};

const mockChain = {
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleStrike: vi.fn().mockReturnThis(),
  toggleCode: vi.fn().mockReturnThis(),
  focus: vi.fn().mockReturnThis(),
  run: vi.fn(),
  setTextSelection: vi.fn().mockReturnThis(),
};

const mockEditor = {
  chain: () => mockChain,
  commands: {
    ...mockEditorCommands,
    clearContent: vi.fn(),
    setContent: vi.fn(),
    focus: vi.fn(),
  },
  getJSON: vi.fn().mockReturnValue({ type: 'doc', content: [] }),
  isFocused: false,
  isEmpty: true,
  isEditable: true,
  setEditable: vi.fn(),
  view: {
    updateState: vi.fn(),
    state: {
      doc: {
        content: {
          size: 0,
        },
      },
    },
  },
};

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div data-testid="editor-content" className="ProseMirror" />,
}));

vi.mock('../../src/hooks/useEditorState', () => ({
  useEditorState: () => ({
    isUpdating: false,
    setIsUpdating: vi.fn(),
    isProcessing: false,
    setIsProcessing: vi.fn(),
    processingProgress: { processed: 0, total: 0 },
    setProcessingProgress: vi.fn(),
  }),
}));

const mockHandleInsertMarkdown = vi.fn();

vi.mock('../../src/hooks/useMarkdownEditor', () => ({
  useMarkdownEditor: () => mockEditor,
}));

vi.mock('../../src/hooks/useMarkdownInsertion', () => ({
  useMarkdownInsertion: () => ({
    handleInsertMarkdown: mockHandleInsertMarkdown,
  }),
}));

vi.mock('../../src/hooks/useTableToolbar', () => ({
  useTableToolbar: () => ({
    visible: false,
    position: { x: 0, y: 0 },
    tableElement: null,
    showToolbar: vi.fn(),
    hideToolbar: vi.fn(),
    checkTableSelection: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useEditorContextMenus', () => ({
  useEditorContextMenus: () => ({
    linkContextMenu: { visible: false, position: { x: 0, y: 0 }, linkData: null },
    tableContextMenu: { visible: false, position: { x: 0, y: 0 } },
    handleLinkContextMenu: vi.fn(),
    handleTableContextMenu: vi.fn(),
    handleCloseLinkContextMenu: vi.fn(),
    handleCloseTableContextMenu: vi.fn(),
  }),
}));

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTestId('editor-content')).toBeDefined();
  });

  it('handles toolbar actions (Bold)', () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const boldBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.bold}"]`,
    ) as HTMLElement;
    fireEvent.click(boldBtn);
    expect(mockChain.toggleBold).toHaveBeenCalled();
    expect(mockChain.focus).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it('handles toolbar actions (Italic)', () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const italicBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.italic}"]`,
    ) as HTMLElement;
    fireEvent.click(italicBtn);
    expect(mockChain.toggleItalic).toHaveBeenCalled();
  });

  it('handles toolbar actions (Heading)', () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const headingBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.heading}"]`,
    ) as HTMLElement;
    fireEvent.click(headingBtn);
    const preview = screen.getAllByText('H1')[0];
    fireEvent.click(preview.closest('button') as HTMLElement);
    expect(mockHandleInsertMarkdown).toHaveBeenCalledWith('# ');
  });

  it('handles toolbar actions (Bullet List)', () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const bulletBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.bulletList}"]`,
    ) as HTMLElement;
    fireEvent.click(bulletBtn);
    expect(mockHandleInsertMarkdown).toHaveBeenCalledWith('- ');
  });

  it('handles toolbar actions (Quote)', () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const quoteBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.blockquote}"]`,
    ) as HTMLElement;
    fireEvent.click(quoteBtn);
    expect(mockHandleInsertMarkdown).toHaveBeenCalledWith('> ');
  });

  it('handles toolbar actions (Code Block)', () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const codeBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.insertCodeBlock}"]`,
    ) as HTMLElement;
    fireEvent.click(codeBtn);
    expect(mockHandleInsertMarkdown).toHaveBeenCalledWith('```\n', 4);
  });

  it('handles toolbar actions (Inline Code)', () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const inlineCodeBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.code}"]`,
    ) as HTMLElement;
    fireEvent.click(inlineCodeBtn);
    expect(mockChain.toggleCode).toHaveBeenCalled();
  });

  it('handles toolbar actions (Download)', () => {
    const { container } = render(
      <MarkdownEditor value="" onChange={() => {}} showDownloadButton={true} />,
    );
    const downloadBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.download}"]`,
    ) as HTMLElement;
    fireEvent.click(downloadBtn);
  });
});
