import React, { useState, useCallback, useEffect } from 'react';

import { EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';

import { createLogger } from '../utils/logger';

import { useEditorContextMenus } from '../hooks/useEditorContextMenus';
import { useEditorState } from '../hooks/useEditorState';
import { useFloatingToolbar } from '../hooks/useFloatingToolbar';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useMarkdownInsertion } from '../hooks/useMarkdownInsertion';
import { useTableToolbar } from '../hooks/useTableToolbar';
import type { ExtendedEditor } from '../types/editor';
import type { ISelectionInfo } from '../utils/selectionUtils';

import { EditorChrome } from './EditorChrome';
import { FloatingToolbar } from './FloatingToolbar';
import { LinkContextMenu } from './LinkContextMenu';
import { TableContextMenu } from './TableContextMenu';
import { TableEdgeControls } from './TableEdgeControls';
import { TableToolbar } from './TableToolbar';

import { UPDATE_LOCK_RELEASE_MS } from '../constants/editor';
import JsonToMarkdownConverter from '../converters/JsonToMarkdownConverter';
import { MarkdownTipTapConverter } from '../converters/MarkdownTipTapConverter';
import { setMermaidLib } from '../extensions/mermaidRegistry';
import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS, type IMarkdownEditorProps, type ToolbarMode } from '../types/index';
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
  toolbarMode,
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

  // Determine toolbar mode with backward compatibility
  // Priority: toolbarMode > showToolbar > editable
  const effectiveToolbarMode: ToolbarMode = (() => {
    if (toolbarMode) return toolbarMode;
    if (showToolbar === false) return 'hidden';
    if (showToolbar === true || editable) return 'fixed';
    return 'hidden';
  })();
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
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const lastProcessedContentRef = React.useRef<string | undefined>(undefined);
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

  // Add FloatingToolbar hook
  const floatingToolbar = useFloatingToolbar(
    editor,
    editorElementRef,
    effectiveToolbarMode === 'floating',
  );

  // Self-contained Markdown conversion processing
  useEffect(() => {
    const processInitialMarkdown = async () => {
      const contentToProcess = value !== undefined ? value : initialContent;

      // 1. Check if content is same as last processed to prevent redundant updates
      if (contentToProcess === lastProcessedContentRef.current) {
        return;
      }

      if (!editor) return;

      // 2. Abort previous pending conversion
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Handle empty content
      if (!contentToProcess || !contentToProcess.trim()) {
        // Only clear if editor is not already empty to avoid loops/flashing
        if (!editor.isEmpty && !controller.signal.aborted) {
          editor.commands.clearContent();
          lastProcessedContentRef.current = contentToProcess;
        }
        return;
      }

      const trimmed = contentToProcess.trim();

      // Always try to convert Markdown to JSON
      try {
        // Prevent infinite loop:
        // If the editor is focused, we assume the user is typing and we shouldn't overwrite
        // unless the value is drastically different (which is hard to know).
        if (editor.isFocused && editable) {
          // If focused and editable, we skip update to prevent cursor jumping and loops
          // But update ref so we don't try again immediately
          lastProcessedContentRef.current = contentToProcess;
          return;
        }

        const json = await MarkdownTipTapConverter.markdownToTipTapJson(trimmed, {
          publicImagePathPrefix,
        });

        if (controller.signal.aborted) return;

        // Check code blocks (logging)
        const codeBlocks = json?.content?.filter((node) => node.type === 'codeBlock') || [];
        if (codeBlocks.length > 0) {
          codeBlocks.forEach((block, idx) => {
            const content = block.content?.[0]?.text || '';
            const lines = content.split('\n').length;
            logger.info(`CodeBlock ${idx}: ${block.attrs?.language || 'no-lang'}, ${lines} lines`);
          });
        }

        // Set conversion result to editor
        editor.commands.setContent(json);
        lastProcessedContentRef.current = contentToProcess;
      } catch (error) {
        if (controller.signal.aborted) return;
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
        lastProcessedContentRef.current = contentToProcess;
      }
    };

    // Execute conversion after editor is ready
    if (editor) {
      processInitialMarkdown();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [editor, initialContent, value, editable, publicImagePathPrefix]);

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
        const { state, dispatch } = editor.view;
        const { from, to } = linkContextMenu.linkData;

        // Verify that the link mark still exists at the expected position (basic safety check)
        const node = state.doc.nodeAt(from);

        // If from/to are valid numbers
        if (typeof from === 'number' && typeof to === 'number') {
          const newLinkMark = state.schema.marks.link.create({ href: newLinkData.href });
          const transaction = state.tr;

          // Allow replacing range, but consider what if user edited text meanwhile?
          // The safest is to rely on from/to if we trust they haven't shifted massively.
          // A transaction ensures atomicity.

          transaction.delete(from, to);
          transaction.insert(from, state.schema.text(newLinkData.text, [newLinkMark]));

          dispatch(transaction);
        } else {
          logger.warn('Use of old link editing fallback');
          // Fallback to old behavior if needed, or just error
        }
      } catch (error) {
        logger.error('Link update failed', error);
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
          toolbarMode={effectiveToolbarMode}
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
            {/* Floating toolbar */}
            {effectiveToolbarMode === 'floating' && (
              <FloatingToolbar
                editor={editor}
                visible={floatingToolbar.visible}
                position={floatingToolbar.position}
                onInsertMarkdown={handleInsertMarkdown}
                selectedText={selectionInfo?.selectedText || ''}
                editable={editable}
                showDownloadButton={showDownloadButton}
                onDownloadAsMarkdown={handleDownloadAsMarkdown}
              />
            )}
            <EditorContent
              editor={editor}
              className={`markdown-editor-content ${autoHeight
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
