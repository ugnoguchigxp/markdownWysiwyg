import React, { useState, useCallback, useEffect } from 'react';

import { EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';

import { createLogger } from '../utils/logger';

import { MarkdownTipTapConverter } from '../converters/MarkdownTipTapConverter';

import { useEditorState } from '../hooks/useEditorState';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useTableToolbar } from '../hooks/useTableToolbar';
import type { ExtendedEditor } from '../types/editor';
import type { ISelectionInfo } from '../utils/selectionUtils';

import { LinkContextMenu } from './LinkContextMenu';
import { MarkdownSyntaxStatus } from './MarkdownSyntaxStatus';
import { MarkdownToolbar } from './MarkdownToolbar';
import { TableContextMenu } from './TableContextMenu';
import { TableEdgeControls } from './TableEdgeControls';
import { TableToolbar } from './TableToolbar';

import { UPDATE_LOCK_RELEASE_MS } from '../constants/editor';
import JsonToMarkdownConverter from '../converters/JsonToMarkdownConverter';
import { setMermaidLib } from '../extensions/mermaidRegistry';
import type { IMarkdownEditorProps } from '../types/index';
import { isValidUrl, normalizeUrlOrNull } from '../utils/security';

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
  placeholder = 'Start typing...',
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
  texts,
}) => {
  const [, setContent] = useState<JSONContent>();
  const [selectionInfo, setSelectionInfo] = useState<ISelectionInfo | null>(null);
  const [pasteEvents, setPasteEvents] = useState<IPasteEvent[]>([]);

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

  // Link context menu state
  const [linkContextMenu, setLinkContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    linkData: { href: string; text: string } | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    linkData: null,
  });

  const [tableContextMenu, setTableContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  const editorElementRef = React.useRef<HTMLDivElement>(null);

  // Link context menu event handler
  const handleLinkContextMenu = useCallback(
    (event: React.MouseEvent, linkData: { href: string; text: string }) => {
      event.preventDefault();
      event.stopPropagation();

      setLinkContextMenu({
        visible: true,
        position: { x: event.clientX, y: event.clientY },
        linkData,
      });
    },
    [],
  );

  // Table context menu event handler
  const handleTableContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setTableContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleCloseLinkContextMenu = useCallback(() => {
    setLinkContextMenu({
      visible: false,
      position: { x: 0, y: 0 },
      linkData: null,
    });
  }, []);

  const handleCloseTableContextMenu = useCallback(() => {
    setTableContextMenu({
      visible: false,
      position: { x: 0, y: 0 },
    });
  }, []);

  // Global click to close context menu
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Close if clicked outside TableContextMenu
      const target = event.target as HTMLElement;
      if (!target.closest('.table-context-menu')) {
        setTableContextMenu({
          visible: false,
          position: { x: 0, y: 0 },
        });
      }
      // Close if clicked outside LinkContextMenu
      if (!target.closest('.link-context-menu')) {
        setLinkContextMenu({
          visible: false,
          position: { x: 0, y: 0 },
          linkData: null,
        });
      }
    };

    if (tableContextMenu.visible || linkContextMenu.visible) {
      document.addEventListener('click', handleGlobalClick);
      return () => document.removeEventListener('click', handleGlobalClick);
    }

    return undefined;
  }, [tableContextMenu.visible, linkContextMenu.visible]);

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

  const handleShowHelp = () => {
    logger.info('📚 Markdown help requested');
    // Implement help functionality as needed
  };

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

  // Add TableToolbar hook
  const tableToolbar = useTableToolbar(editor);

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

  // Get selected text and Markdown insertion handler
  const handleInsertMarkdown = async (markdown: string, cursorOffset?: number) => {
    if (!editor) return;

    logger.debug(`🎨 Inserting markdown: "${markdown}"`);

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();

    // Simple formatting (bold / italic / strike / inline code) should use
    // TipTap commands directly so that the visual style is applied immediately.
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

    // Handle headings with TipTap commands
    if (markdown.match(/^#+\s$/)) {
      const level = markdown.trim().length as 1 | 2 | 3 | 4 | 5 | 6;
      logger.debug(`🎯 Heading: level=${level}, selectedText="${selectedText}"`);
      if (selectedText) {
        // Replace selected text with heading
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
        // Set current block as heading
        const result = editor
          .chain()
          .setHeading({ level })
          .focus(undefined, { scrollIntoView: false })
          .run();
        logger.debug(`✅ Set heading result: ${result}`);
      }
      return;
    }

    // Handle bullet list
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

    // Handle ordered list
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

    // Handle blockquote
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

    // Handle code block
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

    // For other cases (code blocks, etc.)
    if (selectedText && !markdown.match(/^(```|#|>|-|\d+\.)\s?/)) {
      insertText = markdown;
    }

    logger.debug(`📝 Final insert text: "${insertText}"`);

    try {
      // Delete selection range
      if (selectedText) {
        editor.commands.deleteRange({ from, to });
      }

      // Convert Markdown to TipTap JSON and insert (same process as paste)
      // Detect all Markdown formatting
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
        table: insertText.includes('|') && insertText.includes('\n') && insertText.includes('---'),
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

        // Security check: Execute URL validation for links
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

        // Set circular reference prevention flag
        const originalPreventUpdate = (editor as ExtendedEditor).__preventUpdate;
        (editor as ExtendedEditor).__preventUpdate = true;

        const markdownJson = await MarkdownTipTapConverter.markdownToTipTapJson(insertText, {
          publicImagePathPrefix,
        });
        logger.debug('📄 Converted JSON - nodes:', markdownJson?.content?.length || 0);

        if (markdownJson.content && markdownJson.content.length > 0) {
          logger.debug('📄 Inserting content - nodes:', markdownJson.content.length);

          // Try direct TipTap JSON insertion - insert content array directly
          const insertSuccess = editor.commands.insertContent(markdownJson.content);
          logger.debug('📄 Direct JSON insert success:', insertSuccess);

          // Check editor state after insertion
          setTimeout(() => {
            const currentContent = editor.getJSON();
            logger.debug(
              '📄 Editor content after insertion - nodes:',
              currentContent?.content?.length || 0,
            );
          }, 100);

          // If failed, try insertion as HTML string
          if (!insertSuccess) {
            // Insert as Markdown when JSON insertion fails
            const markdown = MarkdownTipTapConverter.tipTapJsonToMarkdown(markdownJson);
            insertPlainText(markdown);
          }

          // setLastMarkdown(insertText); // Removed: Not needed
          logger.info('✅ Content inserted successfully');
        } else {
          // Fallback: Insert as plain text
          logger.warn('⚠️ JSON conversion failed, inserting as plain text');
          insertPlainText(insertText);
        }

        setTimeout(() => {
          (editor as ExtendedEditor).__preventUpdate = originalPreventUpdate;
          setIsUpdating(false);
          logger.debug('✅ Markdown insert update locks released');
        }, UPDATE_LOCK_RELEASE_MS);
      } else {
        // Insert plain Markdown (headings, lists, etc.) as is
        insertPlainText(insertText);

        // Adjust cursor position if cursorOffset is specified
        if (cursorOffset !== undefined && cursorOffset > 0) {
          const currentPos = editor.state.selection.from;
          const newPos = currentPos - (insertText.length - cursorOffset);
          editor.commands.setTextSelection(newPos);
        }
      }

      editor.commands.focus();
    } catch (error) {
      logger.error('❌ Error inserting markdown:', error);
      // Fallback on error
      insertPlainText(insertText);
      editor.commands.focus();
    }
  };

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
      <div className="flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div
        className={`border border-gray-300 dark:border-gray-700 bg-[var(--mw-bg-canvas)] rounded-md shadow-sm ${enableVerticalScroll ? 'h-full' : 'min-h-fit'} flex flex-col relative`}
      >
        {/* Processing indicator (top right) */}
        {isProcessing && (
          <div className="absolute top-2 right-2 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center space-x-2 min-w-48">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              <div className="text-xs">
                <div className="font-medium text-gray-700">Converting Markdown</div>
                <div className="text-gray-500">
                  {processingProgress.processed}/{processingProgress.total} lines completed
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${processingProgress.total > 0 ? (processingProgress.processed / processingProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {effectiveShowToolbar && (
          <div
            className="border-b p-2 rounded-t-lg transition-colors duration-200"
            style={{
              backgroundColor: 'var(--mw-toolbar-bg)',
              borderColor: 'var(--mw-toolbar-border)',
            }}
          >
            <MarkdownToolbar
              onInsertMarkdown={handleInsertMarkdown}
              onShowHelp={handleShowHelp}
              selectedText={selectionInfo?.selectedText || ''}
              disabled={!editable}
              editor={editor}
              showDownloadButton={showDownloadButton}
              onDownloadAsMarkdown={handleDownloadAsMarkdown}
              texts={texts}
            />
          </div>
        )}
        <div
          className={`relative ${enableVerticalScroll ? 'flex-1 overflow-hidden' : 'overflow-visible'} ${editable ? 'cursor-text' : 'cursor-default'}`}
          ref={editorElementRef}
          onMouseDown={(e) => {
            // Make entire editor area clickable
            if (editor && editable) {
              // If clicked location is not inside EditorContent, focus editor
              const target = e.target as HTMLElement;
              const proseMirrorElement = editorElementRef.current?.querySelector(
                '.ProseMirror',
              ) as HTMLElement;

              if (proseMirrorElement && !proseMirrorElement.contains(target)) {
                // Move cursor to end of editor
                const { state } = editor;
                const lastPosition = state.doc.content.size;
                editor.chain().focus().setTextSelection(lastPosition).run();
              } else if (!target.closest('.ProseMirror')) {
                // Focus even if outside of ProseMirror element is clicked
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
        {effectiveShowSyntaxStatus && (
          <MarkdownSyntaxStatus selectionInfo={selectionInfo} className="rounded-b-md" />
        )}

        {effectiveShowPasteDebug && (
          <div className="bg-gray-50 border-t border-gray-200 p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Paste Debug Panel</h3>
              <button
                type="button"
                onClick={clearPasteEvents}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2">
              {pasteEvents.map((event) => (
                <div
                  key={`${event.timestamp}-${event.type}`}
                  className="text-xs bg-white p-2 rounded border border-gray-300"
                >
                  <div className="font-semibold">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <div>Type: {event.type}</div>
                  <div className="truncate">Content: {event.content}</div>
                  <div className="truncate text-green-600">Result: {event.result}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
        texts={texts}
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
