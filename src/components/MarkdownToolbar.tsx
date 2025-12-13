/**
 * MarkdownToolbar - Markdown formatting toolbar
 *
 * Toolbar component for applying various Markdown formatting
 */

import React from 'react';

import type { Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Download,
  FileCode,
  Heading1,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Table,
} from 'lucide-react';

import { DEFAULT_TEXTS, type ITexts } from '../types/index';
import { createLogger } from '../utils/logger';

const log = createLogger('MarkdownToolbar');

interface MarkdownToolbarProps {
  onInsertMarkdown: (markdown: string, cursorOffset?: number) => void;
  onShowHelp: () => void;
  onImageUploadComplete?: (markdownImageUrl: string) => void;
  disabled?: boolean;
  selectedText?: string;
  editor?: Editor | null; // TipTap editor instance (for table operations)
  showDownloadButton?: boolean; // Show download button flag
  onDownloadAsMarkdown?: () => void; // Markdown download handler
  texts?: Partial<ITexts>; // i18n text labels
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onInsertMarkdown,
  onShowHelp,
  disabled = false,
  selectedText = '',
  editor,
  showDownloadButton = false,
  onDownloadAsMarkdown,
  texts = DEFAULT_TEXTS,
}) => {
  const t = { ...DEFAULT_TEXTS, ...texts };
  const [showHeadingMenu, setShowHeadingMenu] = React.useState(false);
  const [showLinkModal, setShowLinkModal] = React.useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
  const [linkText, setLinkText] = React.useState('');
  const [linkUrl, setLinkUrl] = React.useState('');

  const headingLevels = [
    {
      level: 1,
      markdown: '# ',
      className: 'text-4xl font-bold text-gray-800 dark:text-gray-100',
      preview: 'H1',
      bgColor:
        'bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-100',
    },
    {
      level: 2,
      markdown: '## ',
      className: 'text-3xl font-bold text-gray-800 dark:text-gray-100',
      preview: 'H2',
      bgColor:
        'bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-100',
    },
    {
      level: 3,
      markdown: '### ',
      className: 'text-2xl font-semibold text-gray-800 dark:text-gray-100',
      preview: 'H3',
      bgColor:
        'bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-100',
    },
    {
      level: 4,
      markdown: '#### ',
      className: 'text-xl font-semibold text-gray-800 dark:text-gray-100',
      preview: 'H4',
      bgColor:
        'bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-100',
    },
    {
      level: 5,
      markdown: '##### ',
      className: 'text-lg font-medium text-gray-800 dark:text-gray-100',
      preview: 'H5',
      bgColor:
        'bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-100',
    },
  ];

  const handleHeadingClick = (markdown: string) => {
    onInsertMarkdown(markdown);
    setShowHeadingMenu(false);
  };

  const handleLinkClick = () => {
    setLinkText(selectedText);
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const handleLinkModalClose = () => {
    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  const handleLinkModalSubmit = () => {
    if (linkUrl.trim()) {
      const linkMarkdown = `[${linkText}](${linkUrl})`;
      onInsertMarkdown(linkMarkdown);
    }
    handleLinkModalClose();
  };

  // Download functionality handler
  const handleDownloadClick = () => {
    setShowDownloadMenu(!showDownloadMenu);
  };

  const handleDownloadAsMarkdown = () => {
    if (onDownloadAsMarkdown) {
      onDownloadAsMarkdown();
    }
    setShowDownloadMenu(false);
  };

  // TipTap table insertion handler (insert as HTML table)
  const handleTableInsert = () => {
    if (!editor) {
      log.warn('⚠️ Editor instance not available - editor prop not provided');
      log.warn(
        '⚠️ This indicates the editor prop is not being passed correctly from parent components',
      );
      log.warn('⚠️ Fallback: Inserting Markdown text instead of HTML table');
      onInsertMarkdown('| Column1 | Column2 |\n|---------|----------|\n| Content1 | Content2 |', 0);
      return;
    }

    log.debug('🔧 TableInsert: Starting table insertion');
    log.debug('🔧 TableInsert: Editor instance:', !!editor);
    log.debug('🔧 TableInsert: Editor commands available:', Object.keys(editor.commands));
    log.debug(
      '🔧 TableInsert: Editor extensions:',
      editor.extensionManager.extensions.map((ext) => ext.name),
    );

    // Check if insertTable command is available
    if (!editor.commands.insertTable) {
      log.error(
        '❌ insertTable command not available. Available commands:',
        Object.keys(editor.commands),
      );
      log.debug(
        '🔍 Checking for table-related commands:',
        Object.keys(editor.commands).filter((cmd) => cmd.toLowerCase().includes('table')),
      );
    }

    try {
      log.debug('🔧 TableInsert: Attempting insertTable command...');

      // Use TipTap's table insertion command (resizable 2x2 table)
      // Using parameter format according to official documentation
      const success = editor.commands.insertTable({
        rows: 2,
        cols: 2,
        withHeaderRow: true,
      });

      log.debug('🔧 TableInsert: insertTable command result:', success);

      if (success) {
        log.debug('✅ Table inserted successfully using TipTap insertTable command');
      } else {
        log.warn('⚠️ TipTap insertTable command failed, trying JSON fallback...');

        // Fallback: Insert directly in JSON format
        const tableJson = {
          type: 'table',
          attrs: {
            'data-column-widths': '200,200',
            'data-table-width': '400',
          },
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  attrs: {},
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column1' }] }],
                },
                {
                  type: 'tableHeader',
                  attrs: {},
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column2' }] }],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  attrs: {},
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content1' }] }],
                },
                {
                  type: 'tableCell',
                  attrs: {},
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content2' }] }],
                },
              ],
            },
          ],
        };

        log.debug('🔧 TableInsert: Attempting JSON insertion - table size: 2x2');
        const jsonSuccess = editor.commands.insertContent(tableJson);
        log.debug('📋 TableInsert: JSON table insertion result:', jsonSuccess);

        if (jsonSuccess) {
          log.debug('✅ Table inserted successfully using JSON fallback');
        } else {
          log.error('❌ JSON table insertion also failed');
          throw new Error('Both insertTable and JSON insertion failed');
        }
      }
    } catch (error) {
      log.error('❌ Table insertion completely failed:', error);
      log.debug('🔧 TableInsert: Falling back to Markdown text insertion');

      // Final fallback: Markdown text
      onInsertMarkdown('| Column1 | Column2 |\n|---------|----------|\n| Content1 | Content2 |', 0);
    }
  };

  // Direct formatting handlers using TipTap commands
  const handleToggleBold = () => {
    if (!editor) return;
    editor.chain().toggleBold().focus(undefined, { scrollIntoView: false }).run();
  };

  const handleToggleItalic = () => {
    if (!editor) return;
    editor.chain().toggleItalic().focus(undefined, { scrollIntoView: false }).run();
  };

  const handleToggleStrike = () => {
    if (!editor) return;
    editor.chain().toggleStrike().focus(undefined, { scrollIntoView: false }).run();
  };

  const handleToggleInlineCode = () => {
    if (!editor) return;
    editor.chain().toggleCode().focus(undefined, { scrollIntoView: false }).run();
  };

  const handleToggleBlockquote = () => {
    if (!editor) return;
    onInsertMarkdown('> ');
  };

  const handleToggleBulletList = () => {
    if (!editor) return;
    onInsertMarkdown('- ');
  };

  const handleToggleOrderedList = () => {
    if (!editor) return;
    onInsertMarkdown('1. ');
  };

  const handleToggleCodeBlock = () => {
    if (!editor) return;
    onInsertMarkdown('```\n\n```');
  };

  const toolbarItems = [
    {
      icon: Bold,
      title: t.bold,
      onClick: handleToggleBold,
      group: 'text',
    },
    {
      icon: Italic,
      title: t.italic,
      onClick: handleToggleItalic,
      group: 'text',
    },
    {
      icon: Strikethrough,
      title: t.strikethrough,
      onClick: handleToggleStrike,
      group: 'text',
    },
    {
      icon: Code,
      title: t.code,
      onClick: handleToggleInlineCode,
      group: 'code',
    },
    {
      icon: Quote,
      title: t.blockquote,
      onClick: handleToggleBlockquote,
      group: 'block',
    },
    {
      icon: FileCode,
      title: t.insertCodeBlock,
      onClick: handleToggleCodeBlock,
      group: 'code',
    },
    {
      icon: List,
      title: t.bulletList,
      onClick: handleToggleBulletList,
      group: 'list',
    },
    {
      icon: ListOrdered,
      title: t.orderedList,
      onClick: handleToggleOrderedList,
      group: 'list',
    },
    {
      icon: Link2,
      title: t.insertLink,
      onClick: handleLinkClick,
      group: 'media',
    },
    {
      icon: Table,
      title: t.insertTable,
      onClick: handleTableInsert,
      group: 'block',
    },
  ];

  return (
    <div className="mw-toolbar-root flex items-center space-x-1">
      {/* Heading dropdown menu */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          disabled={disabled}
          data-tooltip={t.heading1}
          className={`
            w-8 h-8 flex items-center justify-center rounded transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            relative
          `}
          style={{
            color: 'var(--mw-toolbar-text)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Heading1 className="w-4 h-4" />
          <svg
            className="w-2 h-2 absolute -bottom-0.5 -right-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <title>Open heading menu</title>
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {showHeadingMenu && (
          <>
            {/* Background overlay */}
            <button
              type="button"
              aria-label="Close heading menu"
              className="fixed inset-0 z-10 bg-transparent"
              onClick={() => setShowHeadingMenu(false)}
            />

            {/* Rich dropdown menu (without title) */}
            <div
              className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-xl z-20 overflow-hidden animate-in slide-in-from-top-2 duration-200"
              style={{
                backgroundColor: 'var(--mw-toolbar-bg)',
                borderColor: 'var(--mw-toolbar-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <div className="py-2 max-h-96 overflow-y-auto">
                {headingLevels.map((heading, index) => (
                  <button
                    key={heading.level}
                    type="button"
                    onClick={() => handleHeadingClick(heading.markdown)}
                    className={`
                      w-full text-left px-4 py-3 transition-all duration-150 border-l-4 border-transparent
                    `}
                    style={{
                      backgroundColor: 'var(--mw-toolbar-bg)',
                      borderBottom:
                        index !== headingLevels.length - 1
                          ? '1px solid var(--mw-toolbar-border)'
                          : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-bg)';
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div
                            className="flex-shrink-0 w-12 h-8 rounded-md border flex items-center justify-center font-bold shadow-sm"
                            style={{
                              backgroundColor: 'var(--mw-bg-canvas)',
                              borderColor: 'var(--mw-toolbar-border)',
                              color: 'var(--mw-toolbar-text)',
                              fontSize:
                                heading.level === 1
                                  ? '18px'
                                  : heading.level === 2
                                    ? '16px'
                                    : heading.level === 3
                                      ? '14px'
                                      : '12px',
                            }}
                          >
                            {heading.preview}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div
                          className="truncate max-w-[200px]"
                          style={{ color: 'var(--mw-toolbar-text)' }}
                        >
                          Sample Text
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Other toolbar items */}
      {toolbarItems.map((item) => {
        const Icon = item.icon;

        return (
          <div key={`${item.group}:${item.title}`} className="relative group">
            <button
              type="button"
              onClick={item.onClick}
              disabled={disabled}
              data-tooltip={item.title}
              className={`
                w-8 h-8 flex items-center justify-center rounded transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              style={{
                color: 'var(--mw-toolbar-text)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Download button */}
      {showDownloadButton && (
        <div className="relative group">
          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={disabled}
            data-tooltip={t.download}
            className={`
              w-8 h-8 flex items-center justify-center rounded transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              relative
            `}
            style={{
              color: 'var(--mw-toolbar-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Download className="w-4 h-4" />
            <svg
              className="w-2 h-2 absolute -bottom-0.5 -right-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <title>Open download menu</title>
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showDownloadMenu && (
            <>
              {/* Background overlay */}
              <button
                type="button"
                aria-label="Close download menu"
                className="fixed inset-0 z-10 bg-transparent"
                onClick={() => setShowDownloadMenu(false)}
              />

              {/* Download menu */}
              <div
                className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl z-20 overflow-hidden animate-in slide-in-from-top-2 duration-200"
                style={{
                  backgroundColor: 'var(--mw-toolbar-bg)',
                  borderColor: 'var(--mw-toolbar-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                <div className="py-2">
                  <div
                    className="px-4 py-2"
                    style={{ borderBottom: '1px solid var(--mw-toolbar-border)' }}
                  >
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'var(--mw-toolbar-text)' }}
                    >
                      Export
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--mw-text-secondary)' }}>
                      Save current content
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadAsMarkdown}
                    className="w-full text-left px-4 py-3 transition-all duration-150 border-l-4 border-transparent"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: 'var(--mw-hover-bg, #f3f4f6)' }}
                      >
                        <Download className="w-3 h-3" style={{ color: 'var(--mw-toolbar-text)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium"
                          style={{ color: 'var(--mw-toolbar-text)' }}
                        >
                          Markdown File
                        </div>
                        <div className="text-xs" style={{ color: 'var(--mw-text-secondary)' }}>
                          Save document as .md file
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Help button */}
      <div className="relative group">
        <button
          type="button"
          onClick={onShowHelp}
          disabled={disabled}
          className="w-8 h-8 flex items-center justify-center rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: 'var(--mw-toolbar-text)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Help</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {/* Help button tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60]">
          Markdown Help
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-800" />
        </div>
      </div>

      {/* Link modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          {/* Background overlay (click target) */}
          <button
            type="button"
            aria-label="Close link modal"
            className="absolute inset-0"
            onClick={handleLinkModalClose}
          />

          {/* Modal body */}
          <div
            className="relative rounded-lg p-6 w-96 max-w-[90vw] mx-4 shadow-xl"
            style={{
              backgroundColor: 'var(--mw-bg-canvas)',
              color: 'var(--mw-text-primary)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--mw-heading-color)' }}>
              Insert Link
            </h3>

            <div className="space-y-4">
              {/* Link text */}
              <div>
                <label
                  htmlFor="mw-insert-link-text"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--mw-text-secondary)' }}
                >
                  Link Text
                </label>
                <input
                  id="mw-insert-link-text"
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && linkUrl.trim()) {
                      e.preventDefault();
                      handleLinkModalSubmit();
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: 'var(--mw-bg-canvas)',
                    borderColor: 'var(--mw-toolbar-border)',
                    color: 'var(--mw-text-primary)',
                  }}
                  placeholder="Enter link text"
                />
              </div>

              {/* URL */}
              <div>
                <label
                  htmlFor="mw-insert-link-url"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL
                </label>
                <input
                  id="mw-insert-link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && linkUrl.trim()) {
                      e.preventDefault();
                      handleLinkModalSubmit();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleLinkModalClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLinkModalSubmit}
                disabled={!linkUrl.trim()}
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
