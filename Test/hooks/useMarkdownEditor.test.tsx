import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JsonToMarkdownConverter from '../../src/converters/JsonToMarkdownConverter';
import { useMarkdownEditor } from '../../src/hooks/useMarkdownEditor';

// Capture useEditor options
type MockEditorInstance = {
  getJSON: ReturnType<typeof vi.fn>;
  chain: ReturnType<typeof vi.fn>;
  isDestroyed: boolean;
};

type CapturedEditorOptions = {
  editable?: boolean;
  content?: string;
  extensions?: unknown[];
  onUpdate?: (props: { editor: MockEditorInstance }) => void;
  onBlur?: (props: { editor: MockEditorInstance }) => void;
  onCreate?: (props: { editor: MockEditorInstance }) => void;
};

let capturedOptions: CapturedEditorOptions = {};
const mockEditorInstance: MockEditorInstance = {
  getJSON: vi.fn(),
  chain: vi.fn().mockReturnValue({
    focus: vi.fn().mockReturnThis(),
    run: vi.fn(),
  }),
  isDestroyed: false,
};

vi.mock('@tiptap/react', () => ({
  useEditor: (options: CapturedEditorOptions) => {
    capturedOptions = options;
    return mockEditorInstance;
  },
}));

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../src/converters/JsonToMarkdownConverter', () => ({
  default: {
    convertToMarkdown: vi.fn(),
  },
}));

vi.mock('../../src/utils/selectionUtils', () => ({
  SelectionUtils: {
    getSelectionMarkdownSyntax: vi.fn(),
  },
}));

describe('useMarkdownEditor', () => {
  const defaultProps = {
    editable: true,
    placeholder: 'Placeholder',
    isUpdating: false,
    isProcessing: false,
    setIsProcessing: vi.fn(),
    setProcessingProgress: vi.fn(),
    setSelectionInfo: vi.fn(),
    setContent: vi.fn(),
    handleLinkContextMenu: vi.fn(),
    handleTableContextMenu: vi.fn(),
  };

  beforeEach(() => {
    capturedOptions = {};
    vi.clearAllMocks();
    mockEditorInstance.getJSON.mockReturnValue({ type: 'doc', content: [] });
  });

  it('initializes editor with correct configuration', () => {
    renderHook(() => useMarkdownEditor(defaultProps));
    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.editable).toBe(true);
    expect(capturedOptions.content).toBe('');
    // Check extensions count or specific extensions
    expect(capturedOptions.extensions).toBeDefined();
    expect(capturedOptions.extensions?.length ?? 0).toBeGreaterThan(0);
  });

  it('handles onUpdate callback', () => {
    const onChange = vi.fn();
    const onContentChange = vi.fn();
    const onMarkdownChange = vi.fn();

    renderHook(() =>
      useMarkdownEditor({
        ...defaultProps,
        onChange,
        onContentChange,
        onMarkdownChange,
      }),
    );

    vi.mocked(JsonToMarkdownConverter.convertToMarkdown).mockReturnValue('# Markdown');

    if (!capturedOptions.onUpdate) {
      throw new Error('onUpdate not captured');
    }
    const onUpdate = capturedOptions.onUpdate;

    act(() => {
      onUpdate({ editor: mockEditorInstance });
    });

    expect(defaultProps.setContent).toHaveBeenCalled();
    expect(onContentChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('# Markdown');
    expect(onMarkdownChange).toHaveBeenCalledWith('# Markdown');
  });

  it('skips onUpdate if isUpdating or isProcessing', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useMarkdownEditor({
        ...defaultProps,
        isUpdating: true,
        onChange,
      }),
    );

    if (!capturedOptions.onUpdate) {
      throw new Error('onUpdate not captured');
    }
    const onUpdate = capturedOptions.onUpdate;

    act(() => {
      onUpdate({ editor: mockEditorInstance });
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles onBlur callback', () => {
    const onChange = vi.fn();
    const onMarkdownChange = vi.fn();

    renderHook(() =>
      useMarkdownEditor({
        ...defaultProps,
        onChange,
        onMarkdownChange,
      }),
    );

    vi.mocked(JsonToMarkdownConverter.convertToMarkdown).mockReturnValue('# Markdown');

    if (!capturedOptions.onBlur) {
      throw new Error('onBlur not captured');
    }
    const onBlur = capturedOptions.onBlur;

    act(() => {
      onBlur({ editor: mockEditorInstance });
    });

    expect(onChange).toHaveBeenCalledWith('# Markdown');
    expect(onMarkdownChange).toHaveBeenCalledWith('# Markdown');
  });

  it('handles onCreate callback', () => {
    const onEditorReady = vi.fn();
    renderHook(() =>
      useMarkdownEditor({
        ...defaultProps,
        onEditorReady,
      }),
    );

    if (!capturedOptions.onCreate) {
      throw new Error('onCreate not captured');
    }
    const onCreate = capturedOptions.onCreate;

    act(() => {
      onCreate({ editor: mockEditorInstance });
    });

    expect(onEditorReady).toHaveBeenCalledWith(mockEditorInstance);
  });
});
