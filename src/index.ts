/**
 * Markdown WYSIWYG Editor
 * Main entry point
 */

// Styles

// Main components
export { MarkdownEditor } from './components/MarkdownEditor';
export { MarkdownToolbar } from './components/MarkdownToolbar';
export { MarkdownSyntaxStatus } from './components/MarkdownSyntaxStatus';
export { LinkContextMenu } from './components/LinkContextMenu';
export { TableContextMenu } from './components/TableContextMenu';
export { TableToolbar } from './components/TableToolbar';
export { TableEdgeControls } from './components/TableEdgeControls';
export { EmojiPicker } from './components/EmojiPicker';
export { ImagePicker } from './components/ImagePicker';

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

// i18n
export { I18nProvider, useI18n, defaultT } from './i18n/I18nContext';
export type { Translator } from './i18n/I18nContext';

// Utils
export { createLogger, createContextLogger } from './utils/logger';
export { SelectionUtils } from './utils/selectionUtils';

// Types
export type {
  IMarkdownEditorProps,
  ILanguageOption,
  ISelectionInfo,
  I18nKey,
  IEmoji,
  EmojiCategory,
  IEmojiCategoryMeta,
} from './types/index';

export { I18N_KEYS } from './types/index';

// Constants (for advanced customization)
export { EMOJI_DATA, EMOJI_CATEGORIES, EMOJI_BY_CATEGORY } from './constants/emojiData';
