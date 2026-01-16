import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Typography from '@tiptap/extension-typography';
import { type Editor, type JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { useRef } from 'react';

import JsonToMarkdownConverter from '../converters/JsonToMarkdownConverter';
import { CustomCodeBlock } from '../extensions/CustomCodeBlock';
import { createLinkClickExtension } from '../extensions/LinkClickExtension';
import { createMarkdownPasteExtension } from '../extensions/MarkdownPasteExtension';
import { createMarkdownShortcutsExtension } from '../extensions/MarkdownShortcutsExtension';
import { createTableRightClickExtension } from '../extensions/TableRightClickExtension';
import type { ExtendedEditor } from '../types/editor';
import { createLogger } from '../utils/logger';
import { normalizeUrlOrNull } from '../utils/security';
import { type ISelectionInfo, SelectionUtils } from '../utils/selectionUtils';

const logger = createLogger('useMarkdownEditor');

interface UseMarkdownEditorProps {
  value?: string;
  initialContent?: string;
  editable: boolean;
  placeholder: string;
  publicImagePathPrefix?: string;
  onContentChange?: (content: JSONContent) => void;
  onChange?: (markdown: string) => void;
  onMarkdownChange?: (markdown: string) => void;
  onSelectionChange?: (selection: ISelectionInfo) => void;
  onEditorReady?: (editor: Editor) => void;
  onImageSourceSelect?: (file: File) => string | Promise<string>;
  isUpdating: boolean;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  setProcessingProgress: (progress: { processed: number; total: number }) => void;
  setSelectionInfo: (info: ISelectionInfo | null) => void;
  setContent: (content: JSONContent) => void;
  handleLinkContextMenu: (
    event: React.MouseEvent,
    linkData: { href: string; text: string; from: number; to: number },
  ) => void;
  handleTableContextMenu: (event: React.MouseEvent) => void;
  pendingImagesRef: React.MutableRefObject<Map<string, File>>;
}

const EDITOR_CLASS_NAMES =
  'markdown-wysiwyg-editor prose-mirror-content min-h-[300px] p-ui-modal focus:outline-none';

export const useMarkdownEditor = ({
  value,
  initialContent,
  editable,
  placeholder,
  publicImagePathPrefix,
  onContentChange,
  onChange,
  onMarkdownChange,
  onSelectionChange,
  onEditorReady,
  onImageSourceSelect,
  isUpdating,
  isProcessing,
  setIsProcessing,
  setProcessingProgress,
  setSelectionInfo,
  setContent,
  handleLinkContextMenu,
  handleTableContextMenu,
  pendingImagesRef,
}: UseMarkdownEditorProps) => {
  const lowlight = createLowlight(common);
  // biome-ignore lint/suspicious/noExplicitAny: ProseMirror Node type definition is elusive
  const lastEmittedDocRef = useRef<any>(null);

  const editor = useEditor({
    enableContentCheck: false,
    emitContentError: true,
    onContentError: ({ error }) => {
      logger.warn('🚨 TipTap Content Error (handled):', error);
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        blockquote: {
          HTMLAttributes: {
            class: 'blockquote-custom',
          },
        },
      }),
      CustomCodeBlock.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 40,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: {
          class: 'markdown-advance-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        validate: (href) => {
          return !!normalizeUrlOrNull(href);
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm border border-border my-2',
        },
      }),
      CharacterCount,
      Typography,
      createLinkClickExtension(handleLinkContextMenu),
      createTableRightClickExtension(handleTableContextMenu),
      createMarkdownShortcutsExtension(),
      createMarkdownPasteExtension(
        setIsProcessing,
        setProcessingProgress,
        () => {
          if (editor && onChange) {
            try {
              const json = editor.getJSON();
              const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
              onChange(markdown);
            } catch (error) {
              logger.warn('⚠️ Failed to update onChange after paste:', error);
            }
          }
        },
        {
          publicImagePathPrefix,
        },
      ),
    ],
    content: value || initialContent || '',
    editable,
    editorProps: {
      attributes: {
        class: EDITOR_CLASS_NAMES,
        'data-placeholder': placeholder,
      },
      handleDrop: (view, event) => {
        if (!editable) return false;

        const files = Array.from(event.dataTransfer?.files || []);
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));

        // If dropping images, let the parent component handle it
        // This prevents double insertion (once by TipTap, once by parent onDrop)
        // and allows parent to handle cursor positioning logic using refs
        if (imageFiles.length > 0) {
          return false;
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (!editable) return false;

        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter((item) => item.type.startsWith('image/'));

        if (imageItems.length > 0) {
          event.preventDefault();

          for (const item of imageItems) {
            const file = item.getAsFile();
            if (file) {
              const handleUrl = (url: string) => {
                if (url) {
                  if (url.startsWith('blob:')) {
                    pendingImagesRef.current.set(url, file);
                  }
                  const { state } = view;
                  const { selection } = state;
                  const transaction = state.tr.replaceWith(
                    selection.from,
                    selection.to,
                    state.schema.nodes.image.create({ src: url }),
                  );
                  view.dispatch(transaction);
                }
              };

              if (onImageSourceSelect) {
                Promise.resolve(onImageSourceSelect(file))
                  .then(handleUrl)
                  .catch((error) => {
                    logger.error('Failed to handle pasted image:', error);
                  });
              } else {
                const blobUrl = URL.createObjectURL(file);
                handleUrl(blobUrl);
              }
            }
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdating || (editor as ExtendedEditor).__preventUpdate || isProcessing) {
        return;
      }

      const { doc } = editor.state;

      const json = editor.getJSON();
      setContent(json);

      if (onContentChange) {
        onContentChange(json);
      }

      // Only convert if listeners exist
      if (onChange || onMarkdownChange) {
        try {
          const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
          if (onChange) onChange(markdown);
          if (onMarkdownChange) onMarkdownChange(markdown);

          // Update reference
          lastEmittedDocRef.current = doc;
        } catch (error) {
          logger.warn('⚠️ Markdown conversion failed in onUpdate:', error);
        }
      }
    },
    onBlur: ({ editor }) => {
      // Optimization: Skip conversion if document hasn't changed since last update
      if (lastEmittedDocRef.current && editor.state.doc.eq(lastEmittedDocRef.current)) {
        return;
      }

      const hasListeners = onChange || onMarkdownChange;
      if (hasListeners) {
        try {
          const json = editor.getJSON();
          const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
          if (onChange) onChange(markdown);
          if (onMarkdownChange) onMarkdownChange(markdown);

          lastEmittedDocRef.current = editor.state.doc;
        } catch (error) {
          logger.warn('⚠️ Markdown conversion failed in onBlur:', error);
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      try {
        const newSelectionInfo = SelectionUtils.getSelectionMarkdownSyntax(editor);
        setSelectionInfo(newSelectionInfo);

        if (onSelectionChange && newSelectionInfo) {
          onSelectionChange(newSelectionInfo);
        }
      } catch (error) {
        logger.warn('⚠️ MarkdownEditor: Selection update failed:', error);
        setSelectionInfo(null);
      }
    },
    onCreate: ({ editor }) => {
      try {
        if (onEditorReady) {
          onEditorReady(editor);
        }
      } catch (error) {
        logger.warn('⚠️ MarkdownEditor: onEditorReady callback failed:', error);
      }
    },
  });

  return {
    editor,
  };
};
