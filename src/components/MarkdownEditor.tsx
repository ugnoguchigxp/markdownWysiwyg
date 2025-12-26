import React, { useState, useCallback, useEffect } from 'react';

import { EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';

import { createLogger } from '../utils/logger';

import { useEditorState } from '../hooks/useEditorState';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useMarkdownInsertion } from '../hooks/useMarkdownInsertion';
import { useTableToolbar } from '../hooks/useTableToolbar';
import { useEditorContextMenus } from '../hooks/useEditorContextMenus';
import type { ExtendedEditor } from '../types/editor';
import type { ISelectionInfo } from '../utils/selectionUtils';

import { EditorChrome } from './EditorChrome';
import { LinkContextMenu } from './LinkContextMenu';
import { TableContextMenu } from './TableContextMenu';
import { TableEdgeControls } from './TableEdgeControls';
import { TableToolbar } from './TableToolbar';

import { UPDATE_LOCK_RELEASE_MS } from '../constants/editor';
import JsonToMarkdownConverter from '../converters/JsonToMarkdownConverter';
import { MarkdownTipTapConverter } from '../converters/MarkdownTipTapConverter';
import { setMermaidLib } from '../extensions/mermaidRegistry';
import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS, type IMarkdownEditorProps } from '../types/index';
import { normalizeUrlOrNull } from '../utils/security';

const logger = createLogger('MarkdownEditor');

// Paste event interface (only defined if PasteDebugPanel is available)
interface IPasteEvent {
  timestamp: number;
  type: string;
  content: string;
  result: string;
}

// Link click, table right-click, markdown shortcuts, and paste extensions

export const MarkdownEditor: React.FC<IMarkdownEditorProps> = ({
  value,
  onChange,
  initialContent, // Keep for backward compatibility or internal use
  editable = true,
  enableMermaid = false,
  publicImagePathPrefix,
  mermaidLib,
  onContentChange,
  onMarkdownChange, // Currently disabled to prevent infinite loops with TextEditor
  onSelectionChange,
  onEditorReady,
  showSyntaxStatus,
  showPasteDebug = false,
  showToolbar,
  enableVerticalScroll = true,
  autoHeight = false,
  className = '',
  showDownloadButton = false,
  downloadFilename = 'document.md',
  debug = false,
}) => {
  const [, setContent] = useState<JSONContent>();
  const [selectionInfo, setSelectionInfo] = useState<ISelectionInfo | null>(null);
  const [pasteEvents, setPasteEvents] = useState<IPasteEvent[]>([]);

  const { t } = useI18n();

  const placeholder = t(I18N_KEYS.placeholder);

  // Determine visibility based on props and editable state
  // If showToolbar is not explicitly provided, it defaults to the value of editable
  const effectiveShowToolbar = showToolbar ?? editable;
  // If showSyntaxStatus is not explicitly provided, it defaults to debug mode
  const effectiveShowSyntaxStatus = showSyntaxStatus ?? debug;
  // If showPasteDebug is not explicitly provided, it defaults to debug mode
  const effectiveShowPasteDebug = showPasteDebug || debug;

  const {
    isUpdating,
    setIsUpdating,
    isProcessing,
    setIsProcessing,
    processingProgress,
    setProcessingProgress,
  } = useEditorState();

  // Manage editor instance using global variable (used only within component)
  // onMarkdownChange will be re-enabled after TextEditor bypass

  const editorElementRef = React.useRef<HTMLDivElement>(null);
  const {
    linkContextMenu,
    tableContextMenu,
    handleLinkContextMenu,
    handleTableContextMenu,
    handleCloseLinkContextMenu,
    handleCloseTableContextMenu,
  } = useEditorContextMenus();

  const handleOpenLink = useCallback((href: string) => {
    const safeHref = normalizeUrlOrNull(href);
    if (!safeHref) {
      logger.warn('⚠️ Invalid URL blocked:', href);
      return;
    }
    window.open(safeHref, '_blank', 'noopener,noreferrer');
  }, []);

  useEffect(() => {
    if (!enableMermaid) {
      setMermaidLib(null);
      return;
    }

    if (mermaidLib && typeof (mermaidLib as { render?: unknown }).render === 'function') {
      setMermaidLib(mermaidLib as unknown as Parameters<typeof setMermaidLib>[0]);
    } else if (mermaidLib) {
      logger.warn(
        '⚠️ mermaidLib provided but does not look like Mermaid. Mermaid rendering disabled.',
      );
      setMermaidLib(null);
    }
  }, [enableMermaid, mermaidLib]);

  // handleEditLink and handleInsertMarkdown are defined after useEditor, so removed from this location

  // handleInsertMarkdown is defined after useEditor, so removed

  const clearPasteEvents = () => {
    setPasteEvents([]);
  };

  // Table operation commands (defined after useEditor, so moved later)

  // Use custom hook for editor initialization
  const editor = useMarkdownEditor({
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
  });

  // Add TableToolbar hook
  const tableToolbar = useTableToolbar(editor);
  const { handleInsertMarkdown } = useMarkdownInsertion({
    editor: editor as ExtendedEditor | null,
    publicImagePathPrefix,
    setIsUpdating,
  });

  // Self-contained Markdown conversion processing
  useEffect(() => {
    const processInitialMarkdown = async () => {
      const contentToProcess = value !== undefined ? value : initialContent;

      if (!editor) return;

      // Handle empty content
      if (!contentToProcess || !contentToProcess.trim()) {
        // Only clear if editor is not already empty to avoid loops/flashing
        if (!editor.isEmpty) {
          editor.commands.clearContent();
        }
        return;
      }

      const trimmed = contentToProcess.trim();

      // Always try to convert Markdown to JSON
      // We removed isMarkdownText check because it was too strict and caused plain text or simple markdown to be ignored
      try {
        // Prevent infinite loop:
        // If the editor is focused, we assume the user is typing and we shouldn't overwrite
        // unless the value is drastically different (which is hard to know).
        // However, for a controlled component, value should be the source of truth.
        // If we are in "viewer" mode (editable=false), we always update.
        if (editor.isFocused && editable) {
          // If focused and editable, we skip update to prevent cursor jumping and loops
          // This assumes onChange is called onBlur, so value doesn't update while typing.
          // If value updates while typing, this prevents the loop/cursor jump.
          return;
        }

        const json = await MarkdownTipTapConverter.markdownToTipTapJson(trimmed, {
          publicImagePathPrefix,
        });

        // Check code blocks
        const codeBlocks = json?.content?.filter((node) => node.type === 'codeBlock') || [];
        if (codeBlocks.length > 0) {
          codeBlocks.forEach((block, idx) => {
            const content = block.content?.[0]?.text || '';
            const lines = content.split('\n').length;
            logger.info(`CodeBlock ${idx}: ${block.attrs?.language || 'no-lang'}, ${lines} lines`);
          });
        }

        // Set conversion result to editor
        // setContent(json) will trigger onUpdate, but since we don't call onChange in onUpdate, it shouldn't loop
        editor.commands.setContent(json);
      } catch (error) {
        logger.warn('[MarkdownEditor] Automatic Markdown conversion failed:', error);
        // Fallback: Insert as plain text if conversion fails
        const lines = trimmed.split('\n');
        editor.commands.setContent({
          type: 'doc',
          content: lines.map((line) => ({
            type: 'paragraph',
            content: line.length > 0 ? [{ type: 'text', text: line }] : [],
          })),
        });
      }
    };

    // Execute conversion after editor is ready
    if (editor) {
      processInitialMarkdown();
    }
  }, [editor, initialContent, value, editable, publicImagePathPrefix]); // Execute when value changes

  // Update editor editable state when prop changes
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      logger.info('Updating editor editable state', { from: editor.isEditable, to: editable });
      editor.setEditable(editable);
      // Force update all node views
      editor.view.updateState(editor.view.state);
    }
  }, [editor, editable]);

  // Table operation commands (defined after useEditor)
  const handleAddRowAbove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const handleAddRowBelow = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const handleAddColumnBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const handleAddColumnAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const handleDeleteRow = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const handleDeleteColumn = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const handleDeleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  // Link edit handler (defined after useEditor)
  const handleEditLink = useCallback(
    (newLinkData: { href: string; text: string }) => {
      if (!editor || !linkContextMenu.linkData) return;

      logger.debug('🔗 handleEditLink called:', newLinkData);

      // Set isUpdating flag to prevent infinite loop
      setIsUpdating(true);

      // Set circular reference prevention flag
      const originalPreventUpdate = (editor as ExtendedEditor).__preventUpdate;
      (editor as ExtendedEditor).__preventUpdate = true;

      try {
        // Find and update link in editor
        const { state, dispatch } = editor.view;
        let linkUpdated = false;

        // Traverse entire document to find link
        state.doc.descendants((node, pos) => {
          if (linkUpdated) return false;

          if (node.isText && node.marks) {
            const linkMark = node.marks.find((mark) => mark.type.name === 'link');
            if (
              linkMark &&
              linkMark.attrs.href === linkContextMenu.linkData?.href &&
              node.text === linkContextMenu.linkData?.text
            ) {
              // Check link mark type
              if (!state.schema.marks.link) {
                logger.warn('Link mark type not found in schema');
                return false;
              }

              // Update link
              const from = pos;
              const to = pos + node.nodeSize;
              const newLinkMark = state.schema.marks.link.create({ href: newLinkData.href });
              const transaction = state.tr;

              // Delete existing text and insert new text with link
              transaction.delete(from, to);
              transaction.insert(from, state.schema.text(newLinkData.text, [newLinkMark]));

              dispatch(transaction);
              linkUpdated = true;
              return false;
            }
          }
          return true; // Continue with other nodes
        });

        if (!linkUpdated) {
          logger.warn('Link not found for update');
        }
      } finally {
        // Reset flags and state asynchronously
        setTimeout(() => {
          (editor as ExtendedEditor).__preventUpdate = originalPreventUpdate;
          setIsUpdating(false);
          logger.debug('✅ Link edit update locks released');
        }, UPDATE_LOCK_RELEASE_MS);
      }
    },
    [editor, linkContextMenu.linkData, setIsUpdating],
  );

  // Download functionality handler
  const handleDownloadAsMarkdown = useCallback(() => {
    if (!editor) {
      logger.warn('[MarkdownEditor] Editor not available for download');
      return;
    }

    try {
      const editorContent = editor.getJSON();
      logger.info('[MarkdownEditor] Downloading content as Markdown:', downloadFilename);
      JsonToMarkdownConverter.downloadAsMarkdown(editorContent, downloadFilename);
    } catch (error) {
      logger.error('[MarkdownEditor] Download failed:', error);
    }
  }, [editor, downloadFilename]);

  // useEffect removed: Removed as it causes infinite loops
  // Selection monitoring is sufficient with onSelectionUpdate event

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted border border-border rounded-md">
        <div className="text-muted-foreground">{t(I18N_KEYS.loadingEditor)}</div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div
        className={`border border-border bg-background rounded-md shadow-sm ${enableVerticalScroll ? 'h-full' : 'min-h-fit'} flex flex-col relative`}
      >
        {/* Processing indicator (top right) */}
        {isProcessing && (
          <div className="absolute top-2 right-2 z-50">
            <div className="bg-background border border-border rounded-lg shadow-lg p-3 flex items-center space-x-2 min-w-48">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <div className="text-xs">
                <div className="font-medium text-foreground">{t(I18N_KEYS.convertingMarkdown)}</div>
                <div className="text-muted-foreground">
                  {processingProgress.processed}/{processingProgress.total}{' '}
                  {t(I18N_KEYS.linesCompleted)}
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${processingProgress.total > 0 ? (processingProgress.processed / processingProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <EditorChrome
          editor={editor}
          selectionInfo={selectionInfo}
          editable={editable}
          effectiveShowToolbar={effectiveShowToolbar}
          effectiveShowSyntaxStatus={effectiveShowSyntaxStatus}
          effectiveShowPasteDebug={effectiveShowPasteDebug}
          showDownloadButton={showDownloadButton}
          onDownloadAsMarkdown={handleDownloadAsMarkdown}
          onInsertMarkdown={handleInsertMarkdown}
          pasteEvents={pasteEvents}
          onClearPasteEvents={clearPasteEvents}
        >
          <div
            className={`relative ${enableVerticalScroll ? 'flex-1 overflow-hidden' : 'overflow-visible'} ${editable ? 'cursor-text' : 'cursor-default'}`}
            ref={editorElementRef}
            onMouseDown={(e) => {
              // Make entire editor area clickable
              if (editor && editable) {
                const target = e.target as HTMLElement;
                const proseMirrorElement = editorElementRef.current?.querySelector(
                  '.ProseMirror',
                ) as HTMLElement;

                if (proseMirrorElement && !proseMirrorElement.contains(target)) {
                  const { state } = editor;
                  const lastPosition = state.doc.content.size;
                  editor.chain().focus().setTextSelection(lastPosition).run();
                } else if (!target.closest('.ProseMirror')) {
                  editor.commands.focus();
                }
              }
            }}
          >
            <EditorContent
              editor={editor}
              className={`markdown-editor-content ${
                autoHeight
                  ? 'markdown-editor-autoheight min-h-fit overflow-visible'
                  : enableVerticalScroll
                    ? 'h-full overflow-y-auto'
                    : 'min-h-full'
              }`}
            />
          </div>
        </EditorChrome>
      </div>

      {/* Link context menu */}
      <LinkContextMenu
        visible={linkContextMenu.visible}
        position={linkContextMenu.position}
        linkData={linkContextMenu.linkData}
        onClose={handleCloseLinkContextMenu}
        onOpenLink={handleOpenLink}
        onEditLink={handleEditLink}
      />

      {/* Table context menu */}
      <TableContextMenu
        isVisible={tableContextMenu.visible}
        position={tableContextMenu.position}
        onClose={handleCloseTableContextMenu}
        onAddRowAbove={handleAddRowAbove}
        onAddRowBelow={handleAddRowBelow}
        onAddColumnBefore={handleAddColumnBefore}
        onAddColumnAfter={handleAddColumnAfter}
        onDeleteRow={handleDeleteRow}
        onDeleteColumn={handleDeleteColumn}
        onDeleteTable={handleDeleteTable}
      />

      {/* Table toolbar */}
      {editor && (
        <TableToolbar
          editor={editor}
          visible={tableToolbar.visible}
          position={tableToolbar.position}
        />
      )}
      {/* Table edge controls */}
      <TableEdgeControls editor={editor} />
    </div>
  );
};
