import { MarkdownTipTapConverter } from '../converters/MarkdownTipTapConverter';
import type { ExtendedEditor } from '../types/editor';
import type { ILogger } from './logger';

type SetProcessing = (processing: boolean) => void;

type SetProgress = (progress: { processed: number; total: number }) => void;

interface HandleMarkdownPasteParams {
  editor: ExtendedEditor;
  plainText: string;
  logger: ILogger;
  setIsProcessing: SetProcessing;
  setProcessingProgress: SetProgress;
  largeTextThreshold: number;
  markdownToTipTapOptions?: {
    publicImagePathPrefix?: string;
  };
}

const insertPlainText = (editor: ExtendedEditor, text: string) => {
  const lines = text.split('\n');
  const content = lines.map((line) => ({
    type: 'paragraph',
    content: line.length > 0 ? [{ type: 'text', text: line }] : [],
  }));
  editor.commands.insertContent(content);
};

export const handleMarkdownPaste = async ({
  editor,
  plainText,
  logger,
  setIsProcessing,
  setProcessingProgress,
  largeTextThreshold,
  markdownToTipTapOptions,
}: HandleMarkdownPasteParams): Promise<void> => {
  // STEP 1: Immediately insert plain text (for better user experience)
  editor.commands.deleteSelection();
  insertPlainText(editor, plainText);

  // STEP 2: True sequential rendering process
  if (plainText.length >= largeTextThreshold) {
    logger.info('📋 Large text detected - keeping as plain text to prevent performance issues');
    return;
  }

  editor.__isProcessing = true;
  setIsProcessing(true);
  setProcessingProgress({ processed: 0, total: plainText.split('\n').length });

  // Save current cursor position before any modifications
  const currentPos = editor.state.selection.from;
  const insertionStart = currentPos - plainText.length;

  try {
    // Delete last inserted plain text
    editor.commands.deleteRange({ from: insertionStart, to: currentPos });
    editor.commands.setTextSelection(insertionStart);

    // Execute true sequential rendering process
    await MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender(
      plainText,
      editor,
      (processed, total) => {
        setProcessingProgress({ processed, total });
      },
      markdownToTipTapOptions,
    );
  } catch (error) {
    logger.warn('⚠️ Sequential rendering failed, keeping plain text:', error);
    // Restore plain text at the original insertion position
    editor.commands.setTextSelection(insertionStart);
    insertPlainText(editor, plainText);
  } finally {
    editor.__isProcessing = false;
    setIsProcessing(false);
  }
};
