import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMarkdownInsertion } from '../../src/hooks/useMarkdownInsertion';
import type { ExtendedEditor } from '../../src/types/editor';

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../src/converters/MarkdownTipTapConverter', () => ({
  MarkdownTipTapConverter: {
    markdownToTipTapJson: vi.fn(),
    tipTapJsonToMarkdown: vi.fn(),
  },
}));

vi.mock('../../src/utils/security', () => ({
  isValidUrl: vi.fn(),
}));

const buildEditor = (selectedText: string) => {
  const chain = {
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleStrike: vi.fn().mockReturnThis(),
    toggleCode: vi.fn().mockReturnThis(),
    setHeading: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    toggleBlockquote: vi.fn().mockReturnThis(),
    toggleCodeBlock: vi.fn().mockReturnThis(),
    deleteRange: vi.fn().mockReturnThis(),
    insertContent: vi.fn().mockReturnThis(),
    focus: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  const editor = {
    chain: () => chain,
    state: {
      selection: { from: 1, to: 5 },
      doc: {
        textBetween: vi.fn().mockReturnValue(selectedText),
      },
    },
    commands: {
      insertContent: vi.fn().mockReturnValue(true),
      deleteRange: vi.fn(),
      setTextSelection: vi.fn(),
      focus: vi.fn(),
    },
    getJSON: vi.fn().mockReturnValue({ type: 'doc', content: [] }),
    __preventUpdate: false,
  } as unknown as ExtendedEditor;

  return { editor, chain };
};

describe('useMarkdownInsertion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles bold for "****"', async () => {
    const { editor, chain } = buildEditor('');
    const setIsUpdating = vi.fn();

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('****');
    });

    expect(chain.toggleBold).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();
  });

  it('inserts heading with selected text', async () => {
    const { editor, chain } = buildEditor('Selected');
    const setIsUpdating = vi.fn();

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('# ');
    });

    expect(chain.deleteRange).toHaveBeenCalledWith({ from: 1, to: 5 });
    expect(chain.insertContent).toHaveBeenCalled();
    expect(chain.setHeading).not.toHaveBeenCalled();
  });

  it('toggles bullet list when no selection', async () => {
    const { editor, chain } = buildEditor('');
    const setIsUpdating = vi.fn();

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('- ');
    });

    expect(chain.toggleBulletList).toHaveBeenCalled();
  });

  it('inserts bullet list when selection exists', async () => {
    const { editor, chain } = buildEditor('Selected');
    const setIsUpdating = vi.fn();

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('- ');
    });

    expect(chain.deleteRange).toHaveBeenCalledWith({ from: 1, to: 5 });
    expect(chain.insertContent).toHaveBeenCalled();
  });

  it('inserts code block when selection exists', async () => {
    const { editor, chain } = buildEditor('Code');
    const setIsUpdating = vi.fn();

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('```\n\n```');
    });

    expect(chain.insertContent).toHaveBeenCalledWith({
      type: 'codeBlock',
      content: [{ type: 'text', text: 'Code' }],
    });
  });

  it('toggles inline code for \"``\"', async () => {
    const { editor, chain } = buildEditor('');
    const setIsUpdating = vi.fn();

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('``');
    });

    expect(chain.toggleCode).toHaveBeenCalled();
  });

  it('treats invalid links as plain text', async () => {
    const { MarkdownTipTapConverter } = await import(
      '../../src/converters/MarkdownTipTapConverter'
    );
    const { isValidUrl } = await import('../../src/utils/security');
    const { editor } = buildEditor('');
    const setIsUpdating = vi.fn();

    vi.mocked(isValidUrl).mockReturnValue(false);

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    vi.useFakeTimers();
    await act(async () => {
      await result.current.handleInsertMarkdown('[text](invalid-url)');
    });
    vi.runAllTimers();
    vi.useRealTimers();

    expect(MarkdownTipTapConverter.markdownToTipTapJson).not.toHaveBeenCalled();
    expect(editor.commands.insertContent).toHaveBeenCalled();
  });

  it('converts formatted markdown and inserts JSON', async () => {
    const { MarkdownTipTapConverter } = await import(
      '../../src/converters/MarkdownTipTapConverter'
    );
    const { editor } = buildEditor('');
    const setIsUpdating = vi.fn();

    vi.mocked(MarkdownTipTapConverter.markdownToTipTapJson).mockResolvedValue({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });

    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('**bold**');
    });
    vi.runAllTimers();
    vi.useRealTimers();

    expect(MarkdownTipTapConverter.markdownToTipTapJson).toHaveBeenCalled();
    expect(editor.commands.insertContent).toHaveBeenCalledWith([{ type: 'paragraph' }]);
    expect(setIsUpdating).toHaveBeenCalledWith(true);
  });

  it('falls back to plain text when JSON insert fails', async () => {
    const { MarkdownTipTapConverter } = await import(
      '../../src/converters/MarkdownTipTapConverter'
    );
    const { editor } = buildEditor('');
    const setIsUpdating = vi.fn();

    editor.commands.insertContent = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.mocked(MarkdownTipTapConverter.markdownToTipTapJson).mockResolvedValue({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
    vi.mocked(MarkdownTipTapConverter.tipTapJsonToMarkdown).mockReturnValue('fallback');

    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('**bold**');
    });
    vi.runAllTimers();
    vi.useRealTimers();

    expect(editor.commands.insertContent).toHaveBeenCalledTimes(2);
    expect(MarkdownTipTapConverter.tipTapJsonToMarkdown).toHaveBeenCalled();
  });

  it('adjusts cursor when cursorOffset is provided', async () => {
    const { editor } = buildEditor('');
    const setIsUpdating = vi.fn();

    const { result } = renderHook(() =>
      useMarkdownInsertion({ editor, setIsUpdating }),
    );

    await act(async () => {
      await result.current.handleInsertMarkdown('plain text', 3);
    });

    expect(editor.commands.setTextSelection).toHaveBeenCalled();
    expect(editor.commands.focus).toHaveBeenCalled();
  });
});
