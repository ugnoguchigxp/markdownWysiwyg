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
  const startPos = editor.state.selection.from;

  insertPlainText(editor, plainText);
  const endPos = editor.state.selection.from;

  // STEP 2: Large text check
  if (plainText.length >= largeTextThreshold) {
    logger.info('📋 Large text detected - keeping as plain text to prevent performance issues');
    return;
  }

  editor.__isProcessing = true;
  setIsProcessing(true);
  setProcessingProgress({ processed: 0, total: plainText.split('\n').length });

  try {
    // Delete last inserted plain text (safe range)
    // Ensure we don't try to delete if nothing was inserted or unexpected state
    // We use startPos and endPos derived from actual insertion
    if (endPos > startPos) {
      editor.commands.deleteRange({ from: startPos, to: endPos });
      editor.commands.setTextSelection(startPos);

      // Execute true sequential rendering process
      await MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender(
        plainText,
        editor,
        (processed, total) => {
          setProcessingProgress({ processed, total });
        },
        markdownToTipTapOptions,
      );
    } else {
      logger.warn('⚠️ Nothing inserted or invalid range detected');
    }
  } catch (error) {
    logger.warn('⚠️ Sequential rendering failed, keeping plain text:', error);
    // Restore plain text at the original insertion position
    // We assume startPos is still valid as we just deleted from it?
    // If deleteRange succeeded, cursor is at startPos.
    editor.commands.setTextSelection(startPos);
    insertPlainText(editor, plainText);
  } finally {
    editor.__isProcessing = false;
    setIsProcessing(false);
  }
};
