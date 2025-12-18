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
  isUpdating: boolean;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  setProcessingProgress: (progress: { processed: number; total: number }) => void;
  setSelectionInfo: (info: ISelectionInfo | null) => void;
  setContent: (content: JSONContent) => void;
  handleLinkContextMenu: (
    event: React.MouseEvent,
    linkData: { href: string; text: string },
  ) => void;
  handleTableContextMenu: (event: React.MouseEvent) => void;
}

const EDITOR_CLASS_NAMES =
  'prose prose-base max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-h2:text-xl prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-1 prose-h3:text-lg prose-p:text-gray-700 prose-p:leading-tight prose-strong:text-gray-900 prose-strong:font-semibold prose-em:text-gray-800 prose-code:bg-red-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-red-700 prose-code:border prose-code:border-red-200 prose-pre:bg-slate-700 prose-pre:text-gray-200 prose-pre:rounded-md prose-pre:p-4 prose-pre:shadow-inner prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50 prose-blockquote:py-3 prose-blockquote:rounded-r-md prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-gray-700 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-a:break-words prose-table:border-collapse prose-th:border-2 prose-th:border-gray-400 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:border-2 prose-td:border-gray-400 prose-td:px-3 prose-td:py-2 prose-hr:border-gray-300 p-4 focus:outline-none text-gray-700';

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
  isUpdating,
  isProcessing,
  setIsProcessing,
  setProcessingProgress,
  setSelectionInfo,
  setContent,
  handleLinkContextMenu,
  handleTableContextMenu,
}: UseMarkdownEditorProps) => {
  const lowlight = createLowlight(common);

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
    },
    onUpdate: ({ editor }) => {
      if (isUpdating || (editor as ExtendedEditor).__preventUpdate || isProcessing) {
        return;
      }

      const json = editor.getJSON();
      setContent(json);

      if (onContentChange) {
        onContentChange(json);
      }

      if (onChange) {
        try {
          const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
          onChange(markdown);
        } catch (error) {
          logger.warn('⚠️ Markdown conversion failed in onUpdate:', error);
        }
      }

      if (onMarkdownChange) {
        try {
          const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
          onMarkdownChange(markdown);
        } catch (error) {
          logger.warn('⚠️ Markdown conversion failed in onUpdate:', error);
        }
      }
    },
    onBlur: ({ editor }) => {
      if (onMarkdownChange) {
        try {
          const json = editor.getJSON();
          const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
          if (onChange) {
            onChange(markdown);
          }
          if (onMarkdownChange) {
            onMarkdownChange(markdown);
          }
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

  return editor;
};
