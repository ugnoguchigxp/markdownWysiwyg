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
  FileCode,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Smile,
  Strikethrough,
  Table,
} from './ui/icons';

import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS } from '../types/index';
import { createLogger } from '../utils/logger';
import { EmojiPicker } from './EmojiPicker';
import { ImagePicker } from './ImagePicker';
import { DownloadMenu } from './toolbar/DownloadMenu';
import { HeadingMenu } from './toolbar/HeadingMenu';
import { LinkModal } from './toolbar/LinkModal';
import { ToolbarButton } from './toolbar/ToolbarButton';

const log = createLogger('MarkdownToolbar');

interface MarkdownToolbarProps {
  onInsertMarkdown: (markdown: string, cursorOffset?: number) => void;
  onImageUploadComplete?: (markdownImageUrl: string) => void;
  disabled?: boolean;
  selectedText?: string;
  editor?: Editor | null; // TipTap editor instance (for table operations)
  showDownloadButton?: boolean; // Show download button flag
  onDownloadAsMarkdown?: () => void; // Markdown download handler
  isFloating?: boolean; // Whether this is a floating toolbar
  hasTextSelection?: boolean; // Whether text is currently selected
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onInsertMarkdown,
  disabled = false,
  selectedText = '',
  editor,
  showDownloadButton = false,
  onDownloadAsMarkdown,
  isFloating = false,
  hasTextSelection = false,
}) => {
  const { t } = useI18n();
  const [showHeadingMenu, setShowHeadingMenu] = React.useState(false);
  const [showLinkModal, setShowLinkModal] = React.useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showImagePicker, setShowImagePicker] = React.useState(false);

  const handleLinkClick = () => {
    setShowLinkModal(true);
  };

  const handleLinkModalClose = () => {
    setShowLinkModal(false);
  };

  const handleDownloadToggle = () => {
    setShowDownloadMenu(!showDownloadMenu);
  };

  // TipTap table insertion handler (insert as HTML table)
  const handleTableInsert = () => {
    if (!editor) {
      log.warn('⚠️ Editor instance not available - editor prop not provided');
      log.warn(
        '⚠️ This indicates the editor prop is not being passed correctly from parent components',
      );
      log.warn('⚠️ Fallback: Inserting Markdown text instead of HTML table');
      onInsertMarkdown('|  |  |\n|---|---|\n|  |  |', 0);
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
      onInsertMarkdown('|  |  |\n|---|---|\n|  |  |', 0);
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

  const handleEmojiSelect = (emoji: string) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run();
    }
  };

  const handleInsertImageMarkdown = (markdown: string) => {
    onInsertMarkdown(markdown);
    setShowImagePicker(false);
  };

  const toolbarItems = [
    {
      icon: Bold,
      title: t(I18N_KEYS.bold),
      onClick: handleToggleBold,
      group: 'text',
      requiresSelection: true, // Only show when text is selected
    },
    {
      icon: Italic,
      title: t(I18N_KEYS.italic),
      onClick: handleToggleItalic,
      group: 'text',
      requiresSelection: true,
    },
    {
      icon: Strikethrough,
      title: t(I18N_KEYS.strikethrough),
      onClick: handleToggleStrike,
      group: 'text',
      requiresSelection: true,
    },
    {
      icon: Code,
      title: t(I18N_KEYS.code),
      onClick: handleToggleInlineCode,
      group: 'code',
      requiresSelection: true,
    },
    {
      icon: Link2,
      title: t(I18N_KEYS.insertLink),
      onClick: handleLinkClick,
      group: 'media',
      requiresSelection: false, // Can be used with or without selection
    },
    {
      icon: Quote,
      title: t(I18N_KEYS.blockquote),
      onClick: handleToggleBlockquote,
      group: 'block',
      showAlways: true, // Show in both selection and non-selection modes
    },
    {
      icon: FileCode,
      title: t(I18N_KEYS.insertCodeBlock),
      onClick: handleToggleCodeBlock,
      group: 'code',
      showAlways: true, // Show in both selection and non-selection modes
    },
    {
      icon: List,
      title: t(I18N_KEYS.bulletList),
      onClick: handleToggleBulletList,
      group: 'list',
      requiresSelection: false,
    },
    {
      icon: ListOrdered,
      title: t(I18N_KEYS.orderedList),
      onClick: handleToggleOrderedList,
      group: 'list',
      requiresSelection: false,
    },
    {
      icon: ImageIcon,
      title: t(I18N_KEYS.image.button),
      onClick: () => {
        setShowImagePicker(!showImagePicker);
        setShowEmojiPicker(false);
        setShowHeadingMenu(false);
        setShowDownloadMenu(false);
      },
      group: 'media',
      requiresSelection: false,
    },
    {
      icon: Table,
      title: t(I18N_KEYS.insertTable),
      onClick: handleTableInsert,
      group: 'block',
      requiresSelection: false,
    },
    {
      icon: Smile,
      title: t(I18N_KEYS.emoji.button),
      onClick: () => setShowEmojiPicker(!showEmojiPicker),
      group: 'insert',
      requiresSelection: false,
    },
  ];

  // Filter toolbar items based on floating mode and selection state
  const filteredItems = isFloating
    ? toolbarItems.filter((item) => {
        // Always show items marked with showAlways
        if ('showAlways' in item && item.showAlways) {
          return true;
        }
        // In floating mode, show items based on selection state
        if (hasTextSelection) {
          // When text is selected, show formatting buttons
          return item.requiresSelection;
        } else {
          // When no text is selected, show insertion buttons
          return !item.requiresSelection;
        }
      })
    : toolbarItems; // In fixed mode, show all items

  return (
    <div className="mw-toolbar-root flex items-center space-x-1">
      {/* HeadingMenu - always show (works with or without selection) */}
      <HeadingMenu
        isOpen={showHeadingMenu}
        disabled={disabled}
        onToggle={() => setShowHeadingMenu(!showHeadingMenu)}
        onClose={() => setShowHeadingMenu(false)}
        onInsertMarkdown={onInsertMarkdown}
        t={t}
      />

      {/* Other toolbar items */}
      {filteredItems.map((item) => {
        const Icon = item.icon;

        return (
          <div key={`${item.group}:${item.title}`} className="relative group">
            <ToolbarButton
              icon={Icon}
              title={item.title}
              onClick={item.onClick}
              disabled={disabled}
            />

            {item.icon === Smile && showEmojiPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-ui-y z-20">
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                  disabled={disabled}
                  t={t}
                />
              </div>
            )}

            {item.icon === ImageIcon && showImagePicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-ui-y z-20">
                <ImagePicker
                  onInsertMarkdown={handleInsertImageMarkdown}
                  onClose={() => setShowImagePicker(false)}
                  disabled={disabled}
                  t={t}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Download button */}
      {showDownloadButton && (
        <DownloadMenu
          isOpen={showDownloadMenu}
          disabled={disabled}
          onToggle={handleDownloadToggle}
          onClose={() => setShowDownloadMenu(false)}
          onDownloadAsMarkdown={() => {
            if (onDownloadAsMarkdown) {
              onDownloadAsMarkdown();
            }
          }}
          t={t}
        />
      )}

      {/* Link modal */}
      <LinkModal
        isOpen={showLinkModal}
        selectedText={selectedText}
        onInsertMarkdown={onInsertMarkdown}
        onClose={handleLinkModalClose}
        t={t}
      />
    </div>
  );
};
