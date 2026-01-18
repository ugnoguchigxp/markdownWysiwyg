import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../utils/pasteHandler', () => ({
  handleMarkdownPaste: vi.fn(() => Promise.resolve()),
}));

import { handleMarkdownPaste } from '../utils/pasteHandler';
import { createMarkdownPasteExtension } from './MarkdownPasteExtension';

type ExtensionWithPlugins = {
  editor?: { __isProcessing?: boolean };
  config: {
    addProseMirrorPlugins: () => Array<{
      spec: {
        props: {
          handlePaste: (view: unknown, event: ClipboardEvent, slice: unknown) => boolean;
        };
      };
    }>;
  };
};

const getPlugin = (ext: ExtensionWithPlugins) => ext.config.addProseMirrorPlugins.call(ext)[0];

const createClipboardEvent = (text: string | null) => {
  const event = new Event('paste') as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: text === null ? undefined : { getData: () => text },
  });
  return event;
};

describe('MarkdownPasteExtension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores paste when clipboard data is missing', () => {
    const ext = createMarkdownPasteExtension(vi.fn(), vi.fn()) as unknown as ExtensionWithPlugins;
    ext.editor = { __isProcessing: false };

    const plugin = getPlugin(ext);
    const event = createClipboardEvent(null);

    expect(plugin.spec.props.handlePaste({}, event, {})).toBe(false);
  });

  it('ignores paste when there is no markdown', () => {
    const ext = createMarkdownPasteExtension(vi.fn(), vi.fn()) as unknown as ExtensionWithPlugins;
    ext.editor = { __isProcessing: false };

    const plugin = getPlugin(ext);
    const event = createClipboardEvent('just plain text');

    expect(plugin.spec.props.handlePaste({}, event, {})).toBe(false);
    expect(handleMarkdownPaste).not.toHaveBeenCalled();
  });

  it('processes markdown paste and notifies completion', async () => {
    const setIsProcessing = vi.fn();
    const setProcessingProgress = vi.fn();
    const onPasteComplete = vi.fn();
    const ext = createMarkdownPasteExtension(
      setIsProcessing,
      setProcessingProgress,
      onPasteComplete,
    ) as unknown as ExtensionWithPlugins;
    ext.editor = { __isProcessing: false };

    const plugin = getPlugin(ext);
    const event = createClipboardEvent('# Title');

    expect(plugin.spec.props.handlePaste({}, event, {})).toBe(true);

    await Promise.resolve();

    expect(handleMarkdownPaste).toHaveBeenCalledWith(
      expect.objectContaining({
        editor: ext.editor,
        plainText: '# Title',
        setIsProcessing,
        setProcessingProgress,
      }),
    );
    expect(onPasteComplete).toHaveBeenCalled();
  });

  it('blocks rapid repeated pastes', () => {
    vi.useFakeTimers();

    const ext = createMarkdownPasteExtension(vi.fn(), vi.fn()) as unknown as ExtensionWithPlugins;
    ext.editor = { __isProcessing: false };
    const plugin = getPlugin(ext);
    const event = createClipboardEvent('# Title');

    vi.setSystemTime(new Date(1000));
    expect(plugin.spec.props.handlePaste({}, event, {})).toBe(true);
    vi.setSystemTime(new Date(1200));
    expect(plugin.spec.props.handlePaste({}, event, {})).toBe(true);
    vi.setSystemTime(new Date(1300));
    expect(plugin.spec.props.handlePaste({}, event, {})).toBe(false);

    vi.useRealTimers();
  });
});
