import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownTipTapConverter } from '../../src/converters/MarkdownTipTapConverter';
import type { ExtendedEditor } from '../../src/types/editor';
import type { ILogger } from '../../src/utils/logger';
import { handleMarkdownPaste } from '../../src/utils/pasteHandler';

// Mock MarkdownTipTapConverter
vi.mock('../../src/converters/MarkdownTipTapConverter', () => ({
  MarkdownTipTapConverter: {
    processMarkdownInSmallChunksWithRender: vi.fn(),
  },
}));

describe('pasteHandler', () => {
  let mockEditor: {
    commands: {
      deleteSelection: ReturnType<typeof vi.fn>;
      insertContent: ReturnType<typeof vi.fn>;
      deleteRange: ReturnType<typeof vi.fn>;
      setTextSelection: ReturnType<typeof vi.fn>;
    };
    state: {
      selection: {
        from: number;
      };
    };
    __isProcessing: boolean;
  };
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
  };
  let setIsProcessing: ReturnType<typeof vi.fn>;
  let setProcessingProgress: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEditor = {
      commands: {
        deleteSelection: vi.fn(),
        insertContent: vi.fn(),
        deleteRange: vi.fn(),
        setTextSelection: vi.fn(),
      },
      state: {
        selection: {
          from: 100,
        },
      },
      __isProcessing: false,
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
    };

    setIsProcessing = vi.fn();
    setProcessingProgress = vi.fn();

    vi.clearAllMocks();
  });

  describe('handleMarkdownPaste', () => {
    it('should insert plain text immediately', async () => {
      const plainText = 'Hello World';
      await handleMarkdownPaste({
        editor: mockEditor as unknown as ExtendedEditor,
        plainText,
        logger: mockLogger as unknown as ILogger,
        setIsProcessing,
        setProcessingProgress,
        largeTextThreshold: 1000,
      });

      expect(mockEditor.commands.deleteSelection).toHaveBeenCalled();
      expect(mockEditor.commands.insertContent).toHaveBeenCalledWith([
        {
          type: 'paragraph',
          content: [{ type: 'text', text: plainText }],
        },
      ]);
    });

    it('should skip processing if text is too large', async () => {
      const plainText = 'Large Text'.repeat(100);
      await handleMarkdownPaste({
        editor: mockEditor as unknown as ExtendedEditor,
        plainText,
        logger: mockLogger as unknown as ILogger,
        setIsProcessing,
        setProcessingProgress,
        largeTextThreshold: 10, // Small threshold to trigger skip
      });

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Large text detected'));
      expect(MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender).not.toHaveBeenCalled();
    });

    it('should process markdown if text is within threshold', async () => {
      const plainText = '# Heading';

      // Simulate selection moving forward after insert
      const initialFrom = 100;
      mockEditor.state.selection.from = initialFrom;

      mockEditor.commands.insertContent.mockImplementation(() => {
        mockEditor.state.selection.from = initialFrom + plainText.length;
      });

      await handleMarkdownPaste({
        editor: mockEditor as unknown as ExtendedEditor,
        plainText,
        logger: mockLogger as unknown as ILogger,
        setIsProcessing,
        setProcessingProgress,
        largeTextThreshold: 1000,
      });

      expect(setIsProcessing).toHaveBeenCalledWith(true);
      // Verify safe range deleting extracted start/end
      expect(mockEditor.commands.deleteRange).toHaveBeenCalledWith({
        from: initialFrom,
        to: initialFrom + plainText.length,
      });
      expect(MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender).toHaveBeenCalled();
      expect(setIsProcessing).toHaveBeenCalledWith(false);
    });

    it('should NOT process if nothing was inserted (invalid range)', async () => {
      const plainText = '# Heading';

      // Simulate NO selection movement (insert failed or empty)
      const initialFrom = 100;
      mockEditor.state.selection.from = initialFrom;

      mockEditor.commands.insertContent.mockImplementation(() => {
        // selection.from stays 100
      });

      await handleMarkdownPaste({
        editor: mockEditor as unknown as ExtendedEditor,
        plainText,
        logger: mockLogger as unknown as ILogger,
        setIsProcessing,
        setProcessingProgress,
        largeTextThreshold: 1000,
      });

      expect(setIsProcessing).toHaveBeenCalledWith(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Nothing inserted'));
      expect(mockEditor.commands.deleteRange).not.toHaveBeenCalled();
      expect(MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender).not.toHaveBeenCalled(); // Should assume processing completes safely but loops skipped?
      // Actually code calls setIsProcessing(false) in finally
      expect(setIsProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle errors during processing', async () => {
      const plainText = '# Heading';
      const error = new Error('Processing failed');

      // Simulate valid insert
      const initialFrom = 100;
      mockEditor.state.selection.from = initialFrom;
      mockEditor.commands.insertContent.mockImplementation(() => {
        mockEditor.state.selection.from = initialFrom + plainText.length;
      });

      vi.mocked(
        MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender,
      ).mockRejectedValueOnce(error);

      await handleMarkdownPaste({
        editor: mockEditor as unknown as ExtendedEditor,
        plainText,
        logger: mockLogger as unknown as ILogger,
        setIsProcessing,
        setProcessingProgress,
        largeTextThreshold: 1000,
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Sequential rendering failed'),
        error,
      );
      // Should restore plain text at ORIGINAL startPos
      expect(mockEditor.commands.setTextSelection).toHaveBeenCalledWith(initialFrom);
      expect(mockEditor.commands.insertContent).toHaveBeenCalledTimes(2); // Initial + Restore
    });
  });
});
