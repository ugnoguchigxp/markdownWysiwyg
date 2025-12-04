import { Extension, textblockTypeInputRule } from '@tiptap/core';

// Markdown shortcuts extension for typing shortcuts like ```
export const createMarkdownShortcutsExtension = () => Extension.create({
  name: 'markdownShortcuts',

  addInputRules() {
    const rules = [];

    if (this.editor.schema.nodes.heading) {
      rules.push(
        textblockTypeInputRule({
          find: /^#\s$/,
          type: this.editor.schema.nodes.heading,
          getAttributes: {
            level: 1,
          },
        }),
        textblockTypeInputRule({
          find: /^##\s$/,
          type: this.editor.schema.nodes.heading,
          getAttributes: {
            level: 2,
          },
        }),
        textblockTypeInputRule({
          find: /^###\s$/,
          type: this.editor.schema.nodes.heading,
          getAttributes: {
            level: 3,
          },
        }),
        textblockTypeInputRule({
          find: /^####\s$/,
          type: this.editor.schema.nodes.heading,
          getAttributes: {
            level: 4,
          },
        }),
        textblockTypeInputRule({
          find: /^#####\s$/,
          type: this.editor.schema.nodes.heading,
          getAttributes: {
            level: 5,
          },
        }),
        textblockTypeInputRule({
          find: /^######\s$/,
          type: this.editor.schema.nodes.heading,
          getAttributes: {
            level: 6,
          },
        })
      );
    }

    return rules;
  },
});
