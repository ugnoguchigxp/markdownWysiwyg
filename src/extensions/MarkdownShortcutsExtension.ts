import { Extension } from '@tiptap/core';

// Markdown shortcuts extension for typing shortcuts like ```
export const createMarkdownShortcutsExtension = () => Extension.create({
  name: 'markdownShortcuts',

  addInputRules() {
    // Complete infinite loop prevention: Disable all Input Rules
    return [];
  },
});
