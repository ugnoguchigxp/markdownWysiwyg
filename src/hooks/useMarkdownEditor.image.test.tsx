import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMarkdownEditor } from '../../src/hooks/useMarkdownEditor';

// Capture useEditor options
type MockEditorInstance = {
  getJSON: ReturnType<typeof vi.fn>;
  chain: ReturnType<typeof vi.fn>;
  isDestroyed: boolean;
  state: {
    doc: {
      eq: ReturnType<typeof vi.fn>;
    };
  };
};

type CapturedEditorOptions = {
  editorProps?: {
    // biome-ignore lint/suspicious/noExplicitAny:
    handleDrop?: (view: any, event: any) => boolean;
    // biome-ignore lint/suspicious/noExplicitAny:
    handlePaste?: (view: any, event: any) => boolean;
  };
};

let capturedOptions: CapturedEditorOptions = {};
const mockEditorInstance: MockEditorInstance = {
  getJSON: vi.fn(),
  chain: vi.fn().mockReturnValue({
    focus: vi.fn().mockReturnThis(),
    run: vi.fn(),
  }),
  isDestroyed: false,
  state: {
    doc: {
      eq: vi.fn().mockReturnValue(false),
    },
  },
};

vi.mock('@tiptap/react', () => ({
  useEditor: (options: CapturedEditorOptions) => {
    capturedOptions = options;
    return mockEditorInstance;
  },
  EditorContent: () => null,
}));

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('useMarkdownEditor image handling', () => {
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
  });

  it('handleDrop calls onImageSourceSelect when image is dropped', async () => {
    const onImageSourceSelect = vi.fn().mockResolvedValue('http://example.com/image.png');
    renderHook(() => useMarkdownEditor({ ...defaultProps, onImageSourceSelect }));

    const handleDrop = capturedOptions.editorProps?.handleDrop;
    expect(handleDrop).toBeDefined();

    if (handleDrop) {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const mockEvent = {
        dataTransfer: {
          files: [mockFile],
        },
        preventDefault: vi.fn(),
      };
      const mockView = {
        state: {
          selection: { from: 0, to: 0 },
          tr: {
            replaceWith: vi.fn().mockReturnThis(),
          },
          schema: {
            nodes: {
              image: {
                create: vi.fn().mockReturnValue({}),
              },
            },
          },
        },
        dispatch: vi.fn(),
      };

      // biome-ignore lint/suspicious/noExplicitAny:
      const result = handleDrop(mockView as any, mockEvent as any);
      expect(result).toBe(false);
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();

      // Should NOT call onImageSourceSelect because hook delegates to parent
      expect(onImageSourceSelect).not.toHaveBeenCalled();

      // View dispatch should not be called
      expect(mockView.dispatch).not.toHaveBeenCalled();
    }
  });

  it('handlePaste calls onImageSourceSelect when image is pasted', async () => {
    const onImageSourceSelect = vi.fn().mockResolvedValue('http://example.com/image.png');
    renderHook(() => useMarkdownEditor({ ...defaultProps, onImageSourceSelect }));

    const handlePaste = capturedOptions.editorProps?.handlePaste;
    expect(handlePaste).toBeDefined();

    if (handlePaste) {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const mockEvent = {
        clipboardData: {
          items: [
            {
              type: 'image/png',
              getAsFile: () => mockFile,
            },
          ],
        },
        preventDefault: vi.fn(),
      };
      const mockView = {
        state: {
          selection: { from: 0, to: 0 },
          tr: {
            replaceWith: vi.fn().mockReturnThis(),
          },
          schema: {
            nodes: {
              image: {
                create: vi.fn().mockReturnValue({}),
              },
            },
          },
        },
        dispatch: vi.fn(),
      };

      // biome-ignore lint/suspicious/noExplicitAny:
      const result = handlePaste(mockView as any, mockEvent as any);
      expect(result).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      await vi.waitFor(() => {
        expect(onImageSourceSelect).toHaveBeenCalledWith(mockFile);
      });

      await vi.waitFor(() => {
        expect(mockView.dispatch).toHaveBeenCalled();
      });
    }
  });
});
