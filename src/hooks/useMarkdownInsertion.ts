import { useCallback } from 'react';

import { UPDATE_LOCK_RELEASE_MS } from '../constants/editor';
import { MarkdownTipTapConverter } from '../converters/MarkdownTipTapConverter';
import type { ExtendedEditor } from '../types/editor';
import { createLogger } from '../utils/logger';
import { isValidUrl } from '../utils/security';

const logger = createLogger('useMarkdownInsertion');

interface UseMarkdownInsertionOptions {
  editor: ExtendedEditor | null;
  publicImagePathPrefix?: string;
  setIsUpdating: (value: boolean) => void;
}

export const useMarkdownInsertion = ({
  editor,
  publicImagePathPrefix,
  setIsUpdating,
}: UseMarkdownInsertionOptions) => {
  const insertPlainText = useCallback(
    (text: string) => {
      if (!editor) {
        return;
      }

      const lines = text.split('\n');
      const content = lines.map((line) => ({
        type: 'paragraph',
        content: line.length > 0 ? [{ type: 'text', text: line }] : [],
      }));
      editor.commands.insertContent(content);
    },
    [editor],
  );

  const handleInsertMarkdown = useCallback(
    async (markdown: string, cursorOffset?: number) => {
      if (!editor) return;

      logger.debug(`🎨 Inserting markdown: "${markdown}"`);

      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();

      if (markdown === '****') {
        editor.chain().toggleBold().focus(undefined, { scrollIntoView: false }).run();
        return;
      }

      if (markdown === '**') {
        editor.chain().toggleItalic().focus(undefined, { scrollIntoView: false }).run();
        return;
      }

      if (markdown === '~~~~') {
        editor.chain().toggleStrike().focus(undefined, { scrollIntoView: false }).run();
        return;
      }

      if (markdown === '``') {
        editor.chain().toggleCode().focus(undefined, { scrollIntoView: false }).run();
        return;
      }

      if (markdown.match(/^#+\s$/)) {
        const level = markdown.trim().length as 1 | 2 | 3 | 4 | 5 | 6;
        logger.debug(`🎯 Heading: level=${level}, selectedText="${selectedText}"`);
        if (selectedText) {
          const result = editor
            .chain()
            .deleteRange({ from, to })
            .insertContent({
              type: 'heading',
              attrs: { level },
              content: [{ type: 'text', text: selectedText }],
            })
            .focus(undefined, { scrollIntoView: false })
            .run();
          logger.debug(`✅ Heading insertion result: ${result}`);
        } else {
          const result = editor
            .chain()
            .setHeading({ level })
            .focus(undefined, { scrollIntoView: false })
            .run();
          logger.debug(`✅ Set heading result: ${result}`);
        }
        return;
      }

      if (markdown === '- ') {
        logger.debug(`🎯 Bullet list: selectedText="${selectedText}"`);
        if (selectedText) {
          const result = editor
            .chain()
            .deleteRange({ from, to })
            .insertContent({
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: selectedText }] }],
                },
              ],
            })
            .focus(undefined, { scrollIntoView: false })
            .run();
          logger.debug(`✅ Bullet list insertion result: ${result}`);
        } else {
          const result = editor
            .chain()
            .toggleBulletList()
            .focus(undefined, { scrollIntoView: false })
            .run();
          logger.debug(`✅ Toggle bullet list result: ${result}`);
        }
        return;
      }

      if (markdown.match(/^\d+\.\s$/)) {
        if (selectedText) {
          editor
            .chain()
            .deleteRange({ from, to })
            .insertContent({
              type: 'orderedList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: selectedText }] }],
                },
              ],
            })
            .focus(undefined, { scrollIntoView: false })
            .run();
        } else {
          editor.chain().toggleOrderedList().focus(undefined, { scrollIntoView: false }).run();
        }
        return;
      }

      if (markdown === '> ') {
        if (selectedText) {
          editor
            .chain()
            .deleteRange({ from, to })
            .insertContent({
              type: 'blockquote',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: selectedText }] }],
            })
            .focus(undefined, { scrollIntoView: false })
            .run();
        } else {
          editor.chain().toggleBlockquote().focus(undefined, { scrollIntoView: false }).run();
        }
        return;
      }

      if (markdown === '```\n\n```') {
        if (selectedText) {
          editor
            .chain()
            .deleteRange({ from, to })
            .insertContent({
              type: 'codeBlock',
              content: [{ type: 'text', text: selectedText }],
            })
            .focus(undefined, { scrollIntoView: false })
            .run();
        } else {
          editor.chain().toggleCodeBlock().focus(undefined, { scrollIntoView: false }).run();
        }
        return;
      }

      let insertText = markdown;

      if (selectedText && !markdown.match(/^(```|#|>|-|\d+\.)\s?/)) {
        insertText = markdown;
      }

      logger.debug(`📝 Final insert text: "${insertText}"`);

      try {
        if (selectedText) {
          editor.commands.deleteRange({ from, to });
        }

        logger.debug('🔍 Checking formatting for text:', insertText);

        const formatChecks = {
          bold: insertText.includes('**'),
          italic: insertText.includes('*') && !insertText.includes('**'),
          strikethrough: insertText.includes('~~'),
          code: insertText.includes('`'),
          blockquote: insertText.startsWith('> '),
          bulletList: insertText.startsWith('- '),
          orderedList: /^\d+\.\s/.test(insertText),
          link: insertText.includes('[') && insertText.includes('](') && insertText.includes(')'),
          table:
            insertText.includes('|') && insertText.includes('\n') && insertText.includes('---'),
          heading: insertText.startsWith('#'),
        };

        logger.debug('🔍 Format checks:', formatChecks);

        const hasFormatting =
          formatChecks.bold ||
          formatChecks.italic ||
          formatChecks.strikethrough ||
          formatChecks.code ||
          formatChecks.blockquote ||
          formatChecks.bulletList ||
          formatChecks.orderedList ||
          formatChecks.link ||
          formatChecks.table ||
          formatChecks.heading;

        logger.debug('🔍 Has formatting:', hasFormatting);

        if (hasFormatting) {
          logger.debug(`🔄 Converting to JSON for formatting: "${insertText}"`);

          setIsUpdating(true);

          const originalPreventUpdate = editor.__preventUpdate;
          editor.__preventUpdate = true;

          try {
            if (insertText.includes('[') && insertText.includes('](') && insertText.includes(')')) {
              const linkMatch = insertText.match(/\[([^\]]+)\]\(([^)]+)\)/);
              if (linkMatch) {
                const linkUrl = linkMatch[2];
                if (linkUrl && !isValidUrl(linkUrl)) {
                  logger.warn('⚠️ Invalid URL detected, treating as plain text:', linkUrl);
                  insertPlainText(insertText);
                  return;
                }
                logger.debug('✅ Valid URL detected, proceeding with link creation');
              }
            }

            const markdownJson = await MarkdownTipTapConverter.markdownToTipTapJson(insertText, {
              publicImagePathPrefix,
            });
            logger.debug('📄 Converted JSON - nodes:', markdownJson?.content?.length || 0);

            if (markdownJson.content && markdownJson.content.length > 0) {
              logger.debug('📄 Inserting content - nodes:', markdownJson.content.length);

              const insertSuccess = editor.commands.insertContent(markdownJson.content);
              logger.debug('📄 Direct JSON insert success:', insertSuccess);

              setTimeout(() => {
                const currentContent = editor.getJSON();
                logger.debug(
                  '📄 Editor content after insertion - nodes:',
                  currentContent?.content?.length || 0,
                );
              }, 100);

              if (!insertSuccess) {
                const normalized = MarkdownTipTapConverter.tipTapJsonToMarkdown(markdownJson);
                insertPlainText(normalized);
              }

              logger.info('✅ Content inserted successfully');
            } else {
              logger.warn('⚠️ JSON conversion failed, inserting as plain text');
              insertPlainText(insertText);
            }
          } finally {
            setTimeout(() => {
              editor.__preventUpdate = originalPreventUpdate;
              setIsUpdating(false);
              logger.debug('✅ Markdown insert update locks released');
            }, UPDATE_LOCK_RELEASE_MS);
          }
        } else {
          insertPlainText(insertText);

          if (cursorOffset !== undefined && cursorOffset > 0) {
            const currentPos = editor.state.selection.from;
            const newPos = currentPos - (insertText.length - cursorOffset);
            editor.commands.setTextSelection(newPos);
          }
        }

        editor.commands.focus();
      } catch (error) {
        logger.error('❌ Error inserting markdown:', error);
        insertPlainText(insertText);
        editor.commands.focus();
      }
    },
    [editor, insertPlainText, publicImagePathPrefix, setIsUpdating],
  );

  return { handleInsertMarkdown };
};
