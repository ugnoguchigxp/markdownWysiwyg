import React, { useState, useCallback, useEffect } from 'react';

import { Extension } from '@tiptap/core';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Typography from '@tiptap/extension-typography';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { Plugin, PluginKey } from 'prosemirror-state';

import { createLogger } from '../utils/logger';

import { MarkdownToolbar } from './MarkdownToolbar';
import JsonToMarkdownConverter from '../converters/JsonToMarkdownConverter';
import { MarkdownTipTapConverter } from '../converters/MarkdownTipTapConverter';
import { useTableToolbar } from '../hooks/useTableToolbar';
import { SelectionUtils, ISelectionInfo } from '../utils/selectionUtils';

import { LinkContextMenu } from './LinkContextMenu';
import { MarkdownSyntaxStatus } from './MarkdownSyntaxStatus';
import { TableContextMenu } from './TableContextMenu';
import { TableEdgeControls } from './TableEdgeControls';
import { TableToolbar } from './TableToolbar';
import { CustomCodeBlock } from '../extensions/CustomCodeBlock';

const log = createLogger('MarkdownEditor');

// TypeScript type definition improvements
interface ExtendedEditor extends Editor {
  __isProcessing?: boolean;
  __preventUpdate?: boolean;
}

// Security utility functions
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(urlObj.protocol);
  } catch (error) {
    logger.debug('URL validation failed', { url, error });
    return false;
  }
};

const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Performance optimization: Log level control
const logger = {
  debug: log.debug,
  info: log.info,
  warn: log.warn,
  error: log.error
};

// Custom Table extension is disabled for now, using TipTap standard features only

import { IMarkdownEditorProps } from '../types/index';

// Custom Table extension is disabled for now, using TipTap standard features only


// Paste event interface (only defined if PasteDebugPanel is available)
interface IPasteEvent {
  timestamp: number;
  type: string;
  content: string;
  result: string;
}

// Link click handling extension
const createLinkClickExtension = (handleContextMenu: (event: React.MouseEvent, linkData: { href: string; text: string }) => void) => Extension.create({
  name: 'linkClick',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('linkClick'),
        props: {
          handleDOMEvents: {
            contextmenu: (_, event) => {
              const target = event.target as HTMLElement;
              const linkElement = target.closest('a[href]') as HTMLAnchorElement;

              if (linkElement) {
                const href = linkElement.getAttribute('href') || '';
                const text = linkElement.textContent || '';

                logger.debug('🔗 Link right-clicked:', { href, text });

                if (href) {
                  handleContextMenu(event as unknown as React.MouseEvent, { href, text });
                  return true;
                }
              }
              return false;
            },
            click: (_, event) => {
              const target = event.target as HTMLElement;
              const linkElement = target.closest('a[href]') as HTMLAnchorElement;

              // Log click event
              if (linkElement) {
                const href = linkElement.getAttribute('href') || '';
                const text = linkElement.textContent || '';
                logger.debug('🔗 Link clicked:', {
                  href,
                  text,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  shiftKey: event.shiftKey
                });

                // Show context menu on Ctrl/Cmd+click or simple left click
                if (href) {
                  event.preventDefault();
                  event.stopPropagation();
                  handleContextMenu(event as unknown as React.MouseEvent, { href, text });
                  return true;
                }
              }
              return false;
            }
          }
        }
      })
    ];
  }
});

// Table right-click extension for context menu
const createTableRightClickExtension = (handleContextMenu: (event: React.MouseEvent) => void) => Extension.create({
  name: 'tableRightClick',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tableRightClick'),
        props: {
          handleDOMEvents: {
            contextmenu: (_, event) => {
              const target = event.target as HTMLElement;
              const tableElement = target.closest('table, th, td');

              if (tableElement && event.button === 2) {
                event.preventDefault();
                // Table right-click
                handleContextMenu(event as unknown as React.MouseEvent);
                return true;
              }
              return false;
            }
          }
        }
      })
    ];
  }
});

// Markdown shortcuts extension for typing shortcuts like ```
const createMarkdownShortcutsExtension = () => Extension.create({
  name: 'markdownShortcuts',

  addInputRules() {
    // Complete infinite loop prevention: Disable all Input Rules
    return [];
  }
});

// Progressive rendering extension - simplified safe approach
const createMarkdownPasteExtension = (
  setIsProcessing: (processing: boolean) => void,
  setProcessingProgress: (progress: { processed: number, total: number }) => void
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
              if (pasteCount > 2 && (now - lastPasteTime) < 500) {
                logger.error('🚨 RAPID PASTE DETECTED - Ignoring to prevent infinite loop');
                return false;
              }

              // Ignore if currently processing (strict check)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (this.editor && (this.editor as any).__isProcessing) {
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

              // Text preview: first 200 chars

              // Basic Markdown detection
              const hasMarkdown = /^#{1,6}\s|```|^\s*[-*+]\s|^\s*>\s|\[.*\]\(.*\)|\|.*\||\*\*.*\*\*/.test(plainText);

              if (!hasMarkdown) {
                // No markdown patterns
                return false; // Process as normal paste
              }

              try {
                const editor = this.editor;
                if (!editor) {
                  logger.error('❌ Editor not available');
                  return false;
                }

                // MARKDOWN PASTE - processing

                // STEP 1: Immediately insert plain text (for better user experience)
                editor.commands.deleteSelection();
                editor.commands.insertContent(plainText);

                // STEP 2: True sequential rendering process
                if (plainText.length < 10000) { // Relaxed text conversion limit
                  (editor as ExtendedEditor).__isProcessing = true;
                  setIsProcessing(true);
                  setProcessingProgress({ processed: 0, total: plainText.split('\n').length });

                  (async () => {
                    try {
                      // Save current cursor position
                      const currentPos = editor.state.selection.from;

                      // Delete last inserted plain text
                      const from = currentPos - plainText.length;
                      const to = currentPos;
                      editor.commands.deleteRange({ from, to });
                      editor.commands.setTextSelection(from);

                      // Execute true sequential rendering process
                      await MarkdownTipTapConverter.processMarkdownInSmallChunksWithRender(
                        plainText,
                        editor,
                        (processed, total) => {
                          setProcessingProgress({ processed, total });
                        }
                      );

                    } catch (error) {
                      logger.warn('⚠️ Sequential rendering failed, keeping plain text:', error);
                      // Restore plain text on error
                      editor.commands.insertContent(plainText);
                    } finally {
                      (editor as ExtendedEditor).__isProcessing = false;
                      setIsProcessing(false);
                    }
                  })(); // Start conversion immediately
                } else {
                  logger.info('📋 Large text detected - keeping as plain text to prevent performance issues');
                }

              } catch (error) {
                logger.error('🚨 Paste processing error:', error);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.editor as any).__isProcessing = false;
                setIsProcessing(false);
                return false;
              }

              return true;
            }
          }
        })
      ];
    }
  });
};;;;;

export const MarkdownEditor: React.FC<IMarkdownEditorProps> = ({
  value,
  onChange,
  initialContent, // Keep for backward compatibility or internal use
  placeholder = 'Start typing...',
  editable = true,
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
}) => {
  const [, setContent] = useState<JSONContent>();
  const [selectionInfo, setSelectionInfo] = useState<ISelectionInfo | null>(null);
  const [pasteEvents, setPasteEvents] = useState<IPasteEvent[]>([]);

  // Determine visibility based on props and editable state
  // If showToolbar/showSyntaxStatus is not explicitly provided, it defaults to the value of editable
  const effectiveShowToolbar = showToolbar ?? editable;
  const effectiveShowSyntaxStatus = showSyntaxStatus ?? editable;
  // const [lastMarkdown, setLastMarkdown] = useState<string>(''); // Removed: No longer needed after useEffect removal
  const [isUpdating, setIsUpdating] = useState<boolean>(false); // Prevent update loops
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Prevent paste processing loops
  const [processingProgress, setProcessingProgress] = useState<{ processed: number, total: number }>({ processed: 0, total: 0 });

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
    linkData: null
  });

  const [tableContextMenu, setTableContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  const editorElementRef = React.useRef<HTMLDivElement>(null);

  const lowlight = createLowlight(common);

  // Link context menu event handler
  const handleLinkContextMenu = useCallback((event: React.MouseEvent, linkData: { href: string; text: string }) => {
    event.preventDefault();
    event.stopPropagation();

    setLinkContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      linkData
    });
  }, []);

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
      linkData: null
    });
  }, []);

  const handleCloseTableContextMenu = useCallback(() => {
    setTableContextMenu({
      visible: false,
      position: { x: 0, y: 0 },
    });
  }, []);

  // Global click to close context menu
  // useEffect(() => {
  //   const handleGlobalClick = (event: MouseEvent) => {
  //     // Close if clicked outside TableContextMenu
  //     const target = event.target as HTMLElement;
  //     if (!target.closest('.table-context-menu')) {
  //       setTableContextMenu({
  //         visible: false,
  //         position: { x: 0, y: 0 },
  //       });
  //     }
  //     // Close if clicked outside LinkContextMenu
  //     if (!target.closest('.link-context-menu')) {
  //       setLinkContextMenu({
  //         visible: false,
  //         position: { x: 0, y: 0 },
  //         linkData: null
  //       });
  //     }
  //   };

  //   if (tableContextMenu.visible || linkContextMenu.visible) {
  //     document.addEventListener('click', handleGlobalClick);
  //     return () => document.removeEventListener('click', handleGlobalClick);
  //   }

  //   return () => {}; // Return empty function
  // }, [tableContextMenu.visible, linkContextMenu.visible]);


  const handleOpenLink = useCallback((href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  }, []);

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

  const editor = useEditor({
    // Disable TipTap schema validation to prevent empty nodes error
    enableContentCheck: false,
    emitContentError: true, // Monitor errors but disable automatic validation
    onContentError: ({ error }) => {
      logger.warn('🚨 TipTap Content Error (handled):', error);
      // Log error but continue processing
    },
    extensions: [
      StarterKit.configure({
        // Disable StarterKit's CodeBlock and Link to avoid duplication
        codeBlock: false,
        link: false,
      }),
      CustomCodeBlock.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5, // TipTap standard recommended value
        cellMinWidth: 40, // Set 40px minimum width
        lastColumnResizable: true, // Make last column resizable
        allowTableNodeSelection: true,
        HTMLAttributes: {
          class: 'markdown-advance-table'
        }
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm border border-gray-200 my-2',
        },
      }),
      CharacterCount,
      Typography,
      createLinkClickExtension(handleLinkContextMenu),
      createTableRightClickExtension(handleTableContextMenu),
      createMarkdownShortcutsExtension(),
      createMarkdownPasteExtension(setIsProcessing, setProcessingProgress),
    ],
    content: value || initialContent || '', // Use value or initialContent
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-base max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-h2:text-xl prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-1 prose-h3:text-lg prose-p:text-gray-700 prose-p:leading-tight prose-strong:text-gray-900 prose-strong:font-semibold prose-em:text-gray-800 prose-code:bg-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-base prose-code:font-mono prose-code:text-gray-900 prose-pre:bg-slate-700 prose-pre:text-gray-200 prose-pre:rounded-md prose-pre:p-4 prose-pre:shadow-inner prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50 prose-blockquote:py-3 prose-blockquote:rounded-r-md prose-ul:list-none prose-ol:list-decimal prose-li:text-gray-700 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-a:break-words prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2 prose-hr:border-gray-300 p-4 focus:outline-none text-gray-700',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      // Complete infinite loop prevention with processing flag
      if (isUpdating || (editor as ExtendedEditor).__preventUpdate || isProcessing) {
        return;
      }

      // Minimal onUpdate processing
      const json = editor.getJSON();
      setContent(json);

      // Execute ContentChange callback
      if (onContentChange) {
        onContentChange(json);
      }

      // onMarkdownChange callback completely disabled (prevent cursor forced movement and infinite loop)
      // onMarkdownChange should be executed only on onBlur or button click
    },
    onBlur: ({ editor }) => {
      // Execute Markdown conversion only in onBlur (no cursor movement)
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

        if (onSelectionChange) {
          onSelectionChange(newSelectionInfo);
        }
      } catch (error) {
        logger.warn('⚠️ MarkdownEditor: Selection update failed:', error);
        // Fallback: Set minimum selectionInfo
        setSelectionInfo(null);
      }
    },
    onCreate: ({ editor }) => {
      // Safe editor instance management (don't use global variable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__markdownAdvanceEditor__ = editor;

      // Execute onEditorReady callback
      try {
        if (onEditorReady) {
          onEditorReady(editor);
        }
      } catch (error) {
        logger.warn('⚠️ MarkdownEditor: onEditorReady callback failed:', error);
      }
    },
  });

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

        const json = await MarkdownTipTapConverter.markdownToTipTapJson(trimmed);

        // Check code blocks
        const codeBlocks = json?.content?.filter(node => node.type === 'codeBlock') || [];
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
        editor.commands.setContent(trimmed);
      }
    };

    // Execute conversion after editor is ready
    if (editor) {
      processInitialMarkdown();
    }
  }, [editor, initialContent, value, editable]); // Execute when value changes

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
  const handleEditLink = useCallback((newLinkData: { href: string; text: string }) => {
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
          const linkMark = node.marks.find(mark => mark.type.name === 'link');
          if (linkMark &&
            linkMark.attrs.href === linkContextMenu.linkData?.href &&
            node.text === linkContextMenu.linkData?.text) {

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
      }, 150);
    }
  }, [editor, linkContextMenu.linkData]);

  // Get selected text and Markdown insertion handler
  const handleInsertMarkdown = async (markdown: string, cursorOffset?: number) => {
    if (!editor) return;

    logger.debug(`🎨 Inserting markdown: "${markdown}"`);

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();

    let insertText = markdown;

    // If there's selected text, apply format
    if (selectedText && markdown.includes('*')) {
      if (markdown === '****') {
        insertText = `**${selectedText}**`; // Bold
      } else if (markdown === '**') {
        insertText = `*${selectedText}*`; // Italic
      } else if (markdown === '~~~~') {
        insertText = `~~${selectedText}~~`; // Strikethrough
      } else if (markdown === '``') {
        insertText = `\`${selectedText}\``; // Inline code
      }
    } else if (selectedText && markdown === '> ') {
      insertText = `> ${selectedText}`; // Blockquote
    } else {
      // Handle when cursorOffset is specified (cursor position adjustment)
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
        italic: (insertText.includes('*') && !insertText.includes('**')),
        strikethrough: insertText.includes('~~'),
        code: insertText.includes('`'),
        blockquote: insertText.startsWith('> '),
        bulletList: insertText.startsWith('- '),
        orderedList: /^\d+\.\s/.test(insertText),
        link: (insertText.includes('[') && insertText.includes('](') && insertText.includes(')')),
        table: (insertText.includes('|') && insertText.includes('\n') && insertText.includes('---')),
        heading: insertText.startsWith('#')
      };

      logger.debug('🔍 Format checks:', formatChecks);

      const hasFormatting = formatChecks.bold || formatChecks.italic || formatChecks.strikethrough ||
        formatChecks.code || formatChecks.blockquote || formatChecks.bulletList ||
        formatChecks.orderedList || formatChecks.link || formatChecks.table || formatChecks.heading;

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
              // Process as plain text if URL is invalid
              editor.commands.insertContent(sanitizeText(insertText));
              return;
            }
            logger.debug('✅ Valid URL detected, proceeding with link creation');
          }
        }

        // Set circular reference prevention flag
        const originalPreventUpdate = (editor as ExtendedEditor).__preventUpdate;
        (editor as ExtendedEditor).__preventUpdate = true;

        const markdownJson = await MarkdownTipTapConverter.markdownToTipTapJson(insertText);
        logger.debug('📄 Converted JSON - nodes:', markdownJson?.content?.length || 0);

        if (markdownJson.content && markdownJson.content.length > 0) {
          logger.debug('📄 Inserting content - nodes:', markdownJson.content.length);

          // Try direct TipTap JSON insertion - pass complete document structure
          const insertSuccess = editor.commands.insertContent(markdownJson);
          logger.debug('📄 Direct JSON insert success:', insertSuccess);

          // Check editor state after insertion
          setTimeout(() => {
            const currentContent = editor.getJSON();
            logger.debug('📄 Editor content after insertion - nodes:', currentContent?.content?.length || 0);
          }, 100);

          // If failed, try insertion as HTML string
          if (!insertSuccess) {
            // Insert as Markdown when JSON insertion fails
            const markdown = MarkdownTipTapConverter.tipTapJsonToMarkdown(markdownJson);
            editor.commands.insertContent(markdown);
          }

          // setLastMarkdown(insertText); // Removed: Not needed
          logger.info('✅ Content inserted successfully');
        } else {
          // Fallback: Insert as plain text
          logger.warn('⚠️ JSON conversion failed, inserting as plain text');
          editor.commands.insertContent(insertText);
        }

        setTimeout(() => {
          (editor as ExtendedEditor).__preventUpdate = originalPreventUpdate;
          setIsUpdating(false);
          logger.debug('✅ Markdown insert update locks released');
        }, 150);
      } else {
        // Insert plain Markdown (headings, lists, etc.) as is
        editor.commands.insertContent(insertText);

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
      editor.commands.insertContent(insertText);
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
      <style>
        {`
          .ProseMirror {
            font-family: "Meiryo", "メイリオ", sans-serif !important;
            line-height: 1.625 !important;
            font-size: 1rem !important;
            min-height: ${autoHeight ? 'auto' : '100%'} !important;
            width: 100% !important;
            cursor: text;
          }
          /* Text cursor setting for EditorContent area */
          .markdown-editor-content .ProseMirror {
            cursor: text;
          }
          .ProseMirror p,
          .ProseMirror li,
          .ProseMirror h1,
          .ProseMirror h2,
          .ProseMirror h3,
          .ProseMirror h4,
          .ProseMirror h5,
          .ProseMirror h6,
          .ProseMirror blockquote {
            cursor: text;
          }
          /* Make entire editor area clickable */
          .ProseMirror:empty::before {
            content: attr(data-placeholder);
            float: left;
            color: #aaa;
            pointer-events: none;
            height: 0;
          }
          .ProseMirror pre {
            background-color: rgb(51 65 85) !important;
            color: rgb(229 231 235) !important;
            border: 1px solid rgb(100 116 139) !important;
            border-radius: 0.5rem !important;
            padding: 1rem !important;
            margin: 0.75rem 0 !important;
            overflow-x: auto !important;
            max-width: 80ch !important; /* 80 character limit for code block width */
            width: 100% !important;
            white-space: pre !important;
          }
          .ProseMirror pre code {
            background-color: transparent !important;
            color: rgb(229 231 235) !important;
            padding: 0 !important;
            border: none !important;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important;
            font-size: 0.875rem !important;
            line-height: 1.625 !important;
            white-space: pre !important;
            display: block !important;
          }
          .ProseMirror ul {
            list-style-type: none !important;
            padding-left: 0 !important;
          }
          .ProseMirror li {
            position: relative !important;
            padding-left: 1.5rem !important;
          }
          .ProseMirror li::before {
            content: "•" !important;
            position: absolute !important;
            left: 0 !important;
            color: rgb(107 114 128) !important;
          }
          .ProseMirror blockquote {
            border-left: 4px solid rgb(209 213 219) !important;
            padding-left: 1rem !important;
            padding-top: 0.75rem !important;
            padding-bottom: 0.75rem !important;
            background-color: rgb(249 250 251) !important;
            border-top-right-radius: 0.375rem !important;
            border-bottom-right-radius: 0.375rem !important;
            margin: 0.75rem 0 !important;
          }
          .ProseMirror code {
            background-color: rgb(229 231 235) !important;
            color: rgb(17 24 39) !important;
            padding: 0.125rem 0.375rem !important;
            border-radius: 0.25rem !important;
            border: 1px solid rgb(209 213 219) !important;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important;
          }
          /* Table extension CSS - Phase 1 */
          .tiptap-table-enhanced .tableWrapper {
            position: relative !important;
          }
          .tiptap-table-enhanced .resize-cursor {
            cursor: col-resize !important;
            border-right: 2px solid #3b82f6 !important;
            background: rgba(59, 130, 246, 0.1) !important;
          }
          .tiptap-table-enhanced th:hover,
          .tiptap-table-enhanced td:hover {
            background-color: rgba(59, 130, 246, 0.05) !important;
            transition: background-color 0.2s ease !important;
          }
          .tiptap-table-enhanced table {
            border-collapse: separate !important;
            border-spacing: 0 !important;
            max-width: 800px !important; /* 800px maximum table width limit */
            width: auto !important; /* Variable width depending on content size */
          }
        `}
      </style>
      <div className={`border border-gray-300 rounded-md shadow-sm ${enableVerticalScroll ? 'h-full' : 'min-h-fit'} flex flex-col relative`}>
        {/* Processing indicator (top right) */}
        {isProcessing && (
          <div className="absolute top-2 right-2 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center space-x-2 min-w-48">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <div className="text-xs">
                <div className="font-medium text-gray-700">Converting Markdown</div>
                <div className="text-gray-500">
                  {processingProgress.processed}/{processingProgress.total} lines completed
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress.total > 0 ? (processingProgress.processed / processingProgress.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {effectiveShowToolbar && (
          <MarkdownToolbar
            onInsertMarkdown={handleInsertMarkdown}
            onShowHelp={handleShowHelp}
            selectedText={selectionInfo?.selectedText || ''}
            disabled={!editable}
            editor={editor}
            showDownloadButton={showDownloadButton}
            onDownloadAsMarkdown={handleDownloadAsMarkdown}
          />
        )}
        <div
          className={`relative ${enableVerticalScroll ? 'flex-1 overflow-hidden' : 'overflow-visible'}`}
          ref={editorElementRef}
          onClick={(e) => {
            // Make entire editor area clickable
            if (editor && editable) {
              // If clicked location is not inside EditorContent, focus editor
              const target = e.target as HTMLElement;
              const proseMirrorElement = editorElementRef.current?.querySelector('.ProseMirror') as HTMLElement;

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
          style={{ cursor: editable ? 'text' : 'default' }}
        >
          <EditorContent
            editor={editor}
            className={`markdown-editor-content ${autoHeight
              ? "min-h-fit overflow-visible"
              : (enableVerticalScroll ? "h-full overflow-y-auto" : "min-h-full")
              }`}
          />

        </div>
        {effectiveShowSyntaxStatus && (
          <MarkdownSyntaxStatus
            selectionInfo={selectionInfo}
            className="rounded-b-md"
          />
        )}
      </div>

      {showPasteDebug && (
        <div className="mt-3 p-4 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Paste Debug Panel</h3>
            <button
              onClick={clearPasteEvents}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {pasteEvents.map((event, idx) => (
              <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-300">
                <div className="font-semibold">{new Date(event.timestamp).toLocaleTimeString()}</div>
                <div>Type: {event.type}</div>
                <div className="truncate">Content: {event.content}</div>
                <div className="truncate text-green-600">Result: {event.result}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      <TableToolbar
        editor={editor!}
        visible={tableToolbar.visible}
        position={tableToolbar.position}
      />
      {/* Table edge controls */}
      <TableEdgeControls editor={editor} />
    </div>
  );
};
