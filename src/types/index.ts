import type { JSONContent, Editor } from '@tiptap/core';

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
  value?: string;                        // Markdown string (preferred)
  onChange?: (value: string) => void;

  // Deprecated / Internal
  initialContent?: string;              // @deprecated Use value instead
  onMarkdownChange?: (markdown: string) => void; // @deprecated Use onChange instead

  // Editor settings
  editable?: boolean;                   // Enable editing (default: true)
  placeholder?: string;                 // Placeholder text (default: "Start writing...")

  // Feature toggles
  enableMermaid?: boolean;              // Mermaid diagrams (default: false)
  enableImage?: boolean;                // Image insertion (default: true)
  enableTable?: boolean;                // Tables (default: true)
  enableCodeBlock?: boolean;            // Code blocks (default: true)
  enableLink?: boolean;                 // Links (default: true)

  // Mermaid settings (required if enableMermaid=true)
  mermaidLib?: unknown;                 // Mermaid library instance

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
  extensions?: unknown[];               // Custom TipTap extensions
  supportedLanguages?: ILanguageOption[]; // Code block languages
  showSyntaxStatus?: boolean;           // Show syntax status bar (default: follows debug/editable)
  showToolbar?: boolean;                // Show toolbar (default: true)
  enableVerticalScroll?: boolean;       // Enable vertical scrolling (default: true)
  autoHeight?: boolean;                 // Auto-adjust height (default: false)
  showDownloadButton?: boolean;         // Show download button (default: false)
  downloadFilename?: string;            // Download filename (default: 'document.md')
  showPasteDebug?: boolean;             // Show paste debug panel (default: false)
  debug?: boolean;                      // Debug mode - shows syntax status and paste debug (default: false)
  texts?: Partial<ITexts>;              // i18n text labels (default: DEFAULT_TEXTS)
}

/**
 * Default text labels (for i18n replacement)
 */
export const DEFAULT_TEXTS = {
  placeholder: 'Start writing...',
  deleteButton: 'Delete',
  renderButton: 'Render',
  cancelButton: 'Cancel',
  editSource: 'Edit Source',
  downloadImage: 'Download Image',
  fullscreen: 'Fullscreen',
  closeFullscreen: 'Close Fullscreen',
  insertTable: 'Insert Table',
  insertCodeBlock: 'Insert Code Block',
  insertImage: 'Insert Image',
  insertLink: 'Insert Link',
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  code: 'Inline Code',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bulletList: 'Bullet List',
  orderedList: 'Ordered List',
  blockquote: 'Blockquote',
  horizontalRule: 'Horizontal Rule',
  // Table context menu
  table: {
    rowOperations: 'Row Operations',
    addRowAbove: 'Add Row Above',
    addRowBelow: 'Add Row Below',
    deleteRow: 'Delete Row',
    columnOperations: 'Column Operations',
    addColumnLeft: 'Add Column Left',
    addColumnRight: 'Add Column Right',
    deleteColumn: 'Delete Column',
    deleteTable: 'Delete Entire Table',
    cancel: 'Cancel',
  },
};

/**
 * i18n text type
 */
export type ITexts = typeof DEFAULT_TEXTS;

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
  heading1: 'markdown_editor.heading1',
  heading2: 'markdown_editor.heading2',
  heading3: 'markdown_editor.heading3',
  bulletList: 'markdown_editor.bullet_list',
  orderedList: 'markdown_editor.ordered_list',
  blockquote: 'markdown_editor.blockquote',
  horizontalRule: 'markdown_editor.horizontal_rule',
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
} as const;
