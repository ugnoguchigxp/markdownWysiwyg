import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

import { LARGE_TEXT_THRESHOLD, PASTE_DEBOUNCE_MS } from '../constants/editor';
import type { ExtendedEditor } from '../types/editor';
import { createLogger } from '../utils/logger';
import { handleMarkdownPaste } from '../utils/pasteHandler';

const logger = createLogger('MarkdownPasteExtension');

export const createMarkdownPasteExtension = (
  setIsProcessing: (processing: boolean) => void,
  setProcessingProgress: (progress: { processed: number; total: number }) => void,
  onPasteComplete?: () => void,
  markdownToTipTapOptions?: {
    publicImagePathPrefix?: string;
  },
) => {
  let pasteCount = 0;
  let lastPasteTime = 0;

  return Extension.create({
    name: 'markdownPaste',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('markdownPaste'),
          props: {
            handlePaste: (_view, event, _slice) => {
              const now = Date.now();
              pasteCount++;

              // Infinite loop prevention: Detect rapid paste
              if (pasteCount > 2 && now - lastPasteTime < PASTE_DEBOUNCE_MS) {
                logger.error('🚨 RAPID PASTE DETECTED - Ignoring to prevent infinite loop');
                return false;
              }

              // Ignore if currently processing (strict check)
              const possibleEditor = this.editor as ExtendedEditor | null | undefined;
              if (possibleEditor?.__isProcessing) {
                // Already processing
                return false;
              }

              lastPasteTime = now;

              const clipboardData = event.clipboardData;

              if (!clipboardData) {
                logger.warn('❌ No clipboard data available');
                return false;
              }

              const plainText = clipboardData.getData('text/plain');

              if (!plainText || plainText.trim().length === 0) {
                logger.warn('❌ Empty or no plain text found');
                return false;
              }

              // Basic Markdown detection
              const hasMarkdown =
                /^#{1,6}\s|```|^\s*[-*+]\s|^\s*>\s|\[.*\]\(.*\)|\|.*\||\*\*.*\*\*/.test(plainText);

              if (!hasMarkdown) {
                // No markdown patterns
                return false; // Process as normal paste
              }

              const editor = this.editor as ExtendedEditor | null | undefined;
              if (!editor) {
                logger.error('❌ Editor not available');
                return false;
              }

              // MARKDOWN PASTE - processing (async with error handling)
              handleMarkdownPaste({
                editor,
                plainText,
                logger,
                setIsProcessing,
                setProcessingProgress,
                largeTextThreshold: LARGE_TEXT_THRESHOLD,
                markdownToTipTapOptions,
              })
                .then(() => {
                  // Notify paste completion
                  if (onPasteComplete) {
                    onPasteComplete();
                  }
                })
                .catch((error) => {
                  logger.error('🚨 Paste processing error:', error);
                  editor.__isProcessing = false;
                  setIsProcessing(false);
                });

              return true;
            },
          },
        }),
      ];
    },
  });
};
