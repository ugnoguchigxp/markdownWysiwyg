import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const {
  mockUseMarkdownEditor,
  mockHandleInsertMarkdown,
  mockSetMermaidLib,
  mockNormalizeUrlOrNull,
  mockMarkdownToTipTapJson,
  mockLogger,
} = vi.hoisted(() => ({
  mockUseMarkdownEditor: vi.fn(),
  mockHandleInsertMarkdown: vi.fn(),
  mockSetMermaidLib: vi.fn(),
  mockNormalizeUrlOrNull: vi.fn(),
  mockMarkdownToTipTapJson: vi.fn(),
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

let lastLinkContextMenuProps: {
  onOpenLink?: (href: string) => void;
} = {};
let lastEditorChromeProps: {
  onDownloadAsMarkdown?: () => void;
} = {};

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div data-testid="editor-content" className="ProseMirror" />,
}));

vi.mock('../../src/hooks/useMarkdownEditor', () => ({
  useMarkdownEditor: (...args: unknown[]) => mockUseMarkdownEditor(...args),
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

vi.mock('../../src/components/EditorChrome', () => ({
  EditorChrome: ({ children, ...props }: { children: React.ReactNode }) => {
    lastEditorChromeProps = props;
    return <div data-testid="editor-chrome">{children}</div>;
  },
}));

vi.mock('../../src/components/LinkContextMenu', () => ({
  LinkContextMenu: (props: { onOpenLink?: (href: string) => void }) => {
    lastLinkContextMenuProps = props;
    return null;
  },
}));

vi.mock('../../src/components/TableContextMenu', () => ({
  TableContextMenu: () => null,
}));

vi.mock('../../src/components/TableToolbar', () => ({
  TableToolbar: () => null,
}));

vi.mock('../../src/components/TableEdgeControls', () => ({
  TableEdgeControls: () => null,
}));

const mockDownloadAsMarkdown = vi.fn();

vi.mock('../../src/converters/JsonToMarkdownConverter', () => ({
  default: {
    downloadAsMarkdown: (...args: unknown[]) => mockDownloadAsMarkdown(...args),
  },
}));
vi.mock('../../src/extensions/mermaidRegistry', () => ({
  setMermaidLib: (...args: unknown[]) => mockSetMermaidLib(...args),
}));

vi.mock('../../src/utils/security', () => ({
  normalizeUrlOrNull: (...args: unknown[]) => mockNormalizeUrlOrNull(...args),
}));

vi.mock('../../src/converters/MarkdownTipTapConverter', () => ({
  MarkdownTipTapConverter: {
    markdownToTipTapJson: (...args: unknown[]) => mockMarkdownToTipTapJson(...args),
  },
}));

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => mockLogger,
}));

import { MarkdownEditor } from '../../src/components/MarkdownEditor';

const buildEditor = (overrides?: Partial<ReturnType<typeof buildEditorBase>>) => {
  const base = buildEditorBase();
  return { ...base, ...overrides };
};

const buildEditorBase = () => ({
  state: {
    doc: {
      content: {
        size: 0,
      },
    },
  },
  commands: {
    clearContent: vi.fn(),
    setContent: vi.fn(),
    focus: vi.fn(),
  },
  chain: () => ({
    focus: vi.fn().mockReturnThis(),
    setTextSelection: vi.fn().mockReturnThis(),
    run: vi.fn(),
  }),
  getJSON: vi.fn().mockReturnValue({ type: 'doc', content: [] }),
  isFocused: false,
  isEmpty: false,
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
});

describe('MarkdownEditor behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMarkdownEditor.mockReset();
    lastLinkContextMenuProps = {};
    lastEditorChromeProps = {};
  });

  it('renders loading state when editor is unavailable', () => {
    mockUseMarkdownEditor.mockReturnValue(null);
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByText('markdown_editor.loading_editor')).toBeDefined();
  });

  it('clears content when value is empty and editor is not empty', async () => {
    const editor = buildEditor({ isEmpty: false });
    mockUseMarkdownEditor.mockReturnValue(editor);

    render(<MarkdownEditor value="" onChange={() => {}} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(editor.commands.clearContent).toHaveBeenCalled();
  });

  it('skips conversion when editor is focused and editable', async () => {
    const editor = buildEditor({ isFocused: true });
    mockUseMarkdownEditor.mockReturnValue(editor);
    mockMarkdownToTipTapJson.mockResolvedValueOnce({ type: 'doc', content: [] });

    render(<MarkdownEditor value="text" onChange={() => {}} editable={true} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockMarkdownToTipTapJson).not.toHaveBeenCalled();
    expect(editor.commands.setContent).not.toHaveBeenCalled();
  });

  it('converts markdown and sets content when conversion succeeds', async () => {
    const editor = buildEditor({ isFocused: false });
    mockUseMarkdownEditor.mockReturnValue(editor);
    mockMarkdownToTipTapJson.mockResolvedValueOnce({ type: 'doc', content: [] });

    render(<MarkdownEditor value="text" onChange={() => {}} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockMarkdownToTipTapJson).toHaveBeenCalled();
    expect(editor.commands.setContent).toHaveBeenCalledWith({ type: 'doc', content: [] });
  });

  it('blocks invalid links in open handler', async () => {
    const editor = buildEditor();
    mockUseMarkdownEditor.mockReturnValue(editor);
    mockNormalizeUrlOrNull.mockReturnValueOnce(null);

    render(<MarkdownEditor value="" onChange={() => {}} />);

    await act(async () => {
      lastLinkContextMenuProps.onOpenLink?.('javascript:alert(1)');
    });

    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('opens valid links in new window', async () => {
    const editor = buildEditor();
    mockUseMarkdownEditor.mockReturnValue(editor);
    mockNormalizeUrlOrNull.mockReturnValueOnce('https://example.com');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<MarkdownEditor value="" onChange={() => {}} />);

    await act(async () => {
      lastLinkContextMenuProps.onOpenLink?.('https://example.com');
    });

    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('disables Mermaid when enableMermaid is false', async () => {
    const editor = buildEditor();
    mockUseMarkdownEditor.mockReturnValue(editor);

    render(<MarkdownEditor value="" onChange={() => {}} enableMermaid={false} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSetMermaidLib).toHaveBeenCalledWith(null);
  });

  it('rejects invalid mermaidLib when enableMermaid is true', async () => {
    const editor = buildEditor();
    mockUseMarkdownEditor.mockReturnValue(editor);

    render(<MarkdownEditor value="" onChange={() => {}} enableMermaid={true} mermaidLib={{}} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockSetMermaidLib).toHaveBeenCalledWith(null);
  });

  it('sets mermaidLib when valid', async () => {
    const editor = buildEditor();
    mockUseMarkdownEditor.mockReturnValue(editor);
    const mermaidLib = { render: () => null };

    render(
      <MarkdownEditor value="" onChange={() => {}} enableMermaid={true} mermaidLib={mermaidLib} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSetMermaidLib).toHaveBeenCalledWith(mermaidLib);
  });

  it('updates editor editable state on prop change', () => {
    const editor = buildEditor({ isEditable: true });
    mockUseMarkdownEditor.mockReturnValue(editor);

    const { rerender } = render(<MarkdownEditor value="" onChange={() => {}} editable={true} />);
    rerender(<MarkdownEditor value="" onChange={() => {}} editable={false} />);

    expect(editor.setEditable).toHaveBeenCalledWith(false);
    expect(editor.view.updateState).toHaveBeenCalled();
  });

  it('downloads markdown via handler', () => {
    const editor = buildEditor();
    mockUseMarkdownEditor.mockReturnValue(editor);

    render(
      <MarkdownEditor value="" onChange={() => {}} showDownloadButton={true} />,
    );

    lastEditorChromeProps.onDownloadAsMarkdown?.();
    expect(mockDownloadAsMarkdown).toHaveBeenCalled();
  });

  it('focuses editor when clicking outside ProseMirror', () => {
    const editor = buildEditor();
    editor.state.doc.content.size = 123;
    const chain = {
      focus: vi.fn().mockReturnThis(),
      setTextSelection: vi.fn().mockReturnThis(),
      run: vi.fn(),
    };
    editor.chain = vi.fn().mockReturnValue(chain);
    mockUseMarkdownEditor.mockReturnValue(editor);

    const { getByTestId } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const editorContent = getByTestId('editor-content');
    const wrapper = editorContent.parentElement as HTMLElement;

    const outside = document.createElement('div');
    document.body.appendChild(outside);

    act(() => {
      fireEvent.mouseDown(wrapper, { target: outside });
    });

    expect(chain.setTextSelection).toHaveBeenCalledWith(123);
    document.body.removeChild(outside);
  });
});
