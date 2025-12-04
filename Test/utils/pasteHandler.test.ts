import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMarkdownPaste } from '../../src/utils/pasteHandler';
import { MarkdownTipTapConverter } from '../../src/converters/MarkdownTipTapConverter';

// Mock MarkdownTipTapConverter
vi.mock('../../src/converters/MarkdownTipTapConverter', () => ({
    MarkdownTipTapConverter: {
        processMarkdownInSmallChunksWithRender: vi.fn(),
    },
}));

describe('pasteHandler', () => {
    let mockEditor: any;
    let mockLogger: any;
    let setIsProcessing: any;
    let setProcessingProgress: any;

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
                editor: mockEditor,
                plainText,
                logger: mockLogger,
                setIsProcessing,
                setProcessingProgress,
                largeTextThreshold: 1000,
            });

            expect(mockEditor.commands.deleteSelection).toHaveBeenCalled();
            expect(mockEditor.commands.insertContent).toHaveBeenCalledWith(plainText);
        });

        it('should skip processing if text is too large', async () => {
            const plainText = 'Large Text'.repeat(100);
            await handleMarkdownPaste({
                editor: mockEditor,
                plainText,
                logger: mockLogger,
                setIsProcessing,
                setProcessingProgress,
                largeTextThreshold: 10, // Small threshold to trigger skip
            });

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Large text detected'));
            expect(MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender).not.toHaveBeenCalled();
        });

        it('should process markdown if text is within threshold', async () => {
            const plainText = '# Heading';
            await handleMarkdownPaste({
                editor: mockEditor,
                plainText,
                logger: mockLogger,
                setIsProcessing,
                setProcessingProgress,
                largeTextThreshold: 1000,
            });

            expect(setIsProcessing).toHaveBeenCalledWith(true);
            expect(mockEditor.commands.deleteRange).toHaveBeenCalled();
            expect(MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender).toHaveBeenCalled();
            expect(setIsProcessing).toHaveBeenCalledWith(false);
        });

        it('should handle errors during processing', async () => {
            const plainText = '# Heading';
            const error = new Error('Processing failed');

            vi.mocked(MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender).mockRejectedValueOnce(error);

            await handleMarkdownPaste({
                editor: mockEditor,
                plainText,
                logger: mockLogger,
                setIsProcessing,
                setProcessingProgress,
                largeTextThreshold: 1000,
            });

            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Sequential rendering failed'), error);
            // Should restore plain text
            expect(mockEditor.commands.insertContent).toHaveBeenCalledTimes(2); // Initial + Restore
        });
    });
});
