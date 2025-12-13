/**
 * Markdown WYSIWYG Editor
 * Main entry point
 */

// Styles
import './index.css';

// Main components
export { MarkdownEditor } from './components/MarkdownEditor';
export { MarkdownToolbar } from './components/MarkdownToolbar';
export { MarkdownSyntaxStatus } from './components/MarkdownSyntaxStatus';
export { LinkContextMenu } from './components/LinkContextMenu';
export { TableContextMenu } from './components/TableContextMenu';
export { TableToolbar } from './components/TableToolbar';
export { TableEdgeControls } from './components/TableEdgeControls';

// Converters
export { default as JsonToMarkdownConverter } from './converters/JsonToMarkdownConverter';
export { MarkdownTipTapConverter } from './converters/MarkdownTipTapConverter';

// Extensions
export { CustomCodeBlock } from './extensions/CustomCodeBlock';
export { CodeBlockNodeView } from './extensions/CodeBlockNodeView';
export { TableForceExtension } from './extensions/TableForceExtension';
export { TableHoverExtension } from './extensions/TableHoverExtension';
export { TableResizeEnhancement } from './extensions/TableResizeEnhancement';

// Hooks
export { useTableToolbar } from './hooks/useTableToolbar';

// Utils
export { createLogger, createContextLogger } from './utils/logger';
export { SelectionUtils } from './utils/selectionUtils';

// Types
export type { IMarkdownEditorProps, ILanguageOption, ISelectionInfo, ITexts } from './types/index';

export { DEFAULT_TEXTS, I18N_KEYS } from './types/index';
