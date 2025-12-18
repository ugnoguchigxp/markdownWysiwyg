import type { Editor, JSONContent } from '@tiptap/core';

/**
 * Language option for code blocks
 */
export interface ILanguageOption {
  value: string;
  label: string;
}

/**
 * Selection information
 */
export interface ISelectionInfo {
  selectedText: string;
  markdownSyntax: string;
  nodeType: string;
  marks: string[];
  from?: number;
  to?: number;
}

/**
 * Main editor props
 */
export interface IMarkdownEditorProps {
  // Content (required)
  value?: string; // Markdown string (preferred)
  onChange?: (value: string) => void;

  // Deprecated / Internal
  initialContent?: string; // @deprecated Use value instead
  onMarkdownChange?: (markdown: string) => void; // @deprecated Use onChange instead

  // Editor settings
  editable?: boolean; // Enable editing (default: true)

  // Feature toggles
  enableMermaid?: boolean; // Mermaid diagrams (default: false)
  enableImage?: boolean; // Image insertion (default: true)
  enableTable?: boolean; // Tables (default: true)
  enableCodeBlock?: boolean; // Code blocks (default: true)
  enableLink?: boolean; // Links (default: true)

  publicImagePathPrefix?: string;

  // Mermaid settings (required if enableMermaid=true)
  mermaidLib?: unknown; // Mermaid library instance

  // Styling
  className?: string;
  style?: React.CSSProperties;

  // Events
  onBlur?: () => void;
  onFocus?: () => void;
  onContentChange?: (content: JSONContent) => void;
  onSelectionChange?: (selectionInfo: ISelectionInfo | null) => void;
  onEditorReady?: (editor: Editor) => void;

  // Advanced settings
  extensions?: unknown[]; // Custom TipTap extensions
  supportedLanguages?: ILanguageOption[]; // Code block languages
  showSyntaxStatus?: boolean; // Show syntax status bar (default: follows debug/editable)
  showToolbar?: boolean; // Show toolbar (default: true)
  enableVerticalScroll?: boolean; // Enable vertical scrolling (default: true)
  autoHeight?: boolean; // Auto-adjust height (default: false)
  showDownloadButton?: boolean; // Show download button (default: false)
  downloadFilename?: string; // Download filename (default: 'document.md')
  showPasteDebug?: boolean; // Show paste debug panel (default: false)
  debug?: boolean; // Debug mode - shows syntax status and paste debug (default: false)
}

/**
 * i18n translation keys (for external i18n systems)
 * Use these keys with your i18n library (e.g., react-i18next, next-i18n)
 */
export const I18N_KEYS = {
  placeholder: 'markdown_editor.placeholder',
  deleteButton: 'markdown_editor.delete_button',
  renderButton: 'markdown_editor.render_button',
  cancelButton: 'markdown_editor.cancel_button',
  editSource: 'markdown_editor.edit_source',
  downloadImage: 'markdown_editor.download_image',
  fullscreen: 'markdown_editor.fullscreen',
  closeFullscreen: 'markdown_editor.close_fullscreen',
  insertTable: 'markdown_editor.insert_table',
  insertCodeBlock: 'markdown_editor.insert_code_block',
  insertImage: 'markdown_editor.insert_image',
  insertLink: 'markdown_editor.insert_link',
  bold: 'markdown_editor.bold',
  italic: 'markdown_editor.italic',
  strikethrough: 'markdown_editor.strikethrough',
  code: 'markdown_editor.code',
  heading: 'markdown_editor.heading',
  bulletList: 'markdown_editor.bullet_list',
  orderedList: 'markdown_editor.ordered_list',
  blockquote: 'markdown_editor.blockquote',
  horizontalRule: 'markdown_editor.horizontal_rule',
  download: 'markdown_editor.download',
  loadingEditor: 'markdown_editor.loading_editor',
  convertingMarkdown: 'markdown_editor.converting_markdown',
  linesCompleted: 'markdown_editor.lines_completed',
  pasteDebugPanel: 'markdown_editor.paste_debug_panel',
  clear: 'markdown_editor.clear',
  type: 'markdown_editor.type',
  content: 'markdown_editor.content',
  result: 'markdown_editor.result',
  openHeadingMenu: 'markdown_editor.open_heading_menu',
  closeHeadingMenu: 'markdown_editor.close_heading_menu',
  openDownloadMenu: 'markdown_editor.open_download_menu',
  closeDownloadMenu: 'markdown_editor.close_download_menu',
  exportMenuTitle: 'markdown_editor.export_menu_title',
  exportMenuDescription: 'markdown_editor.export_menu_description',
  markdownFile: 'markdown_editor.markdown_file',
  saveAsMarkdownFile: 'markdown_editor.save_as_markdown_file',
  sampleText: 'markdown_editor.sample_text',
  insert: 'markdown_editor.insert',
  close: 'markdown_editor.close',
  update: 'markdown_editor.update',
  link: {
    open: 'markdown_editor.link.open',
    edit: 'markdown_editor.link.edit',
    linkText: 'markdown_editor.link.text',
    url: 'markdown_editor.link.url',
    enterLinkText: 'markdown_editor.link.enter_text',
    urlPlaceholder: 'markdown_editor.link.url_placeholder',
  },
  syntaxStatus: {
    help: 'markdown_editor.syntax_status.help',
    selectedText: 'markdown_editor.syntax_status.selected_text',
    markdownSyntax: 'markdown_editor.syntax_status.markdown_syntax',
    styles: 'markdown_editor.syntax_status.styles',
    nodeType: 'markdown_editor.syntax_status.node_type',
  },
  tableToolbar: {
    confirmDeleteTable: 'markdown_editor.table_toolbar.confirm_delete_table',
    insertRowAbove: 'markdown_editor.table_toolbar.insert_row_above',
    insertRowBelow: 'markdown_editor.table_toolbar.insert_row_below',
    deleteRow: 'markdown_editor.table_toolbar.delete_row',
    insertColumnLeft: 'markdown_editor.table_toolbar.insert_column_left',
    insertColumnRight: 'markdown_editor.table_toolbar.insert_column_right',
    deleteColumn: 'markdown_editor.table_toolbar.delete_column',
    mergeCells: 'markdown_editor.table_toolbar.merge_cells',
    splitCell: 'markdown_editor.table_toolbar.split_cell',
    toggleHeaderRow: 'markdown_editor.table_toolbar.toggle_header_row',
    toggleHeaderColumn: 'markdown_editor.table_toolbar.toggle_header_column',
    deleteTable: 'markdown_editor.table_toolbar.delete_table',
    headerRow: 'markdown_editor.table_toolbar.header_row',
    headerColumn: 'markdown_editor.table_toolbar.header_column',
  },
  tableEdgeControls: {
    addRowAbove: 'markdown_editor.table_edge_controls.add_row_above',
    addRowBelow: 'markdown_editor.table_edge_controls.add_row_below',
    addColumnLeft: 'markdown_editor.table_edge_controls.add_column_left',
    addColumnRight: 'markdown_editor.table_edge_controls.add_column_right',
  },
  table: {
    rowOperations: 'markdown_editor.table.row_operations',
    addRowAbove: 'markdown_editor.table.add_row_above',
    addRowBelow: 'markdown_editor.table.add_row_below',
    deleteRow: 'markdown_editor.table.delete_row',
    columnOperations: 'markdown_editor.table.column_operations',
    addColumnLeft: 'markdown_editor.table.add_column_left',
    addColumnRight: 'markdown_editor.table.add_column_right',
    deleteColumn: 'markdown_editor.table.delete_column',
    deleteTable: 'markdown_editor.table.delete_table',
    cancel: 'markdown_editor.table.cancel',
  },
  emoji: {
    button: 'markdown_editor.emoji.button',
    pickerTitle: 'markdown_editor.emoji.picker_title',
    searchPlaceholder: 'markdown_editor.emoji.search_placeholder',
    recentlyUsed: 'markdown_editor.emoji.recently_used',
    clearRecent: 'markdown_editor.emoji.clear_recent',
    noResults: 'markdown_editor.emoji.no_results',
    categories: {
      smileys: 'markdown_editor.emoji.categories.smileys',
      people: 'markdown_editor.emoji.categories.people',
      animals: 'markdown_editor.emoji.categories.animals',
      food: 'markdown_editor.emoji.categories.food',
      activities: 'markdown_editor.emoji.categories.activities',
      travel: 'markdown_editor.emoji.categories.travel',
      objects: 'markdown_editor.emoji.categories.objects',
      symbols: 'markdown_editor.emoji.categories.symbols',
      flags: 'markdown_editor.emoji.categories.flags',
    },
  },
  image: {
    button: 'markdown_editor.image.button',
    pickerTitle: 'markdown_editor.image.picker_title',
    urlLabel: 'markdown_editor.image.url_label',
    urlPlaceholder: 'markdown_editor.image.url_placeholder',
    altLabel: 'markdown_editor.image.alt_label',
    altPlaceholder: 'markdown_editor.image.alt_placeholder',
    insert: 'markdown_editor.image.insert',
  },
} as const;

type NestedValues<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? { [K in keyof T]: NestedValues<T[K]> }[keyof T]
    : never;

export type I18nKey = NestedValues<typeof I18N_KEYS>;

/**
 * Emoji data structure
 */
export interface IEmoji {
  /** Emoji character (e.g., "😀") */
  char: string;
  /** English name for search and accessibility (e.g., "grinning face") */
  name: string;
  /** Search keywords (e.g., ["happy", "smile"]) */
  keywords: string[];
  /** Category ID */
  category: EmojiCategory;
}

export type EmojiCategory =
  | 'smileys'
  | 'people'
  | 'animals'
  | 'food'
  | 'activities'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags';

/**
 * Category metadata for display
 */
export interface IEmojiCategoryMeta {
  id: EmojiCategory;
  icon: string; // Representative emoji
  i18nKey: string; // I18N key for category name
}
