import type { Editor } from '@tiptap/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectionUtils } from '../../src/utils/selectionUtils';

type MockMark = {
  type: { name: string };
  attrs?: Record<string, unknown>;
};

type MockParentNode = {
  type: { name: string };
  attrs: Record<string, unknown>;
};

// Mock Editor and Selection
const createMockEditor = (
  selectionRange: { from: number; to: number; empty: boolean },
  text = '',
  marks: MockMark[] = [],
  parentNode: MockParentNode = { type: { name: 'paragraph' }, attrs: {} },
) => {
  return {
    state: {
      doc: {
        textBetween: vi.fn().mockReturnValue(text),
      },
      selection: {
        from: selectionRange.from,
        to: selectionRange.to,
        empty: selectionRange.empty,
        $from: {
          parent: parentNode,
          marks: () => marks, // Return the marks passed to the factory
        },
        content: () => ({
          content: [],
        }),
      },
    },
    isActive: vi.fn().mockImplementation((markType) => {
      return marks.some((m) => m.type.name === markType);
    }),
    getAttributes: vi.fn().mockReturnValue({}),
  };
};

describe('SelectionUtils', () => {
  describe('getSelectionMarkdownSyntax', () => {
    it('should return node info if selection is empty (cursor position)', () => {
      const editor = createMockEditor({ from: 0, to: 0, empty: true }) as unknown as Editor;
      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info).not.toBeNull();
      expect(info?.markdownSyntax).toBe('(段落)');
    });

    it('should return plain text for simple selection', () => {
      const editor = createMockEditor(
        { from: 0, to: 5, empty: false },
        'Hello',
      ) as unknown as Editor;
      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.markdownSyntax).toBe('Hello');
      expect(info?.selectedText).toBe('Hello');
    });

    it('should detect active marks', () => {
      // Mock marks on the selection
      const marks = [{ type: { name: 'bold' } }];
      const editor = createMockEditor(
        { from: 0, to: 5, empty: false },
        'Bold Text',
        marks,
      ) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('Bold');
    });

    it('should handle blockquote selection', () => {
      const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Quote', [], {
        type: { name: 'blockquote' },
        attrs: {},
      }) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('Blockquote');
      expect(info?.markdownSyntax).toContain('> Quote');
    });

    it('should handle listItem selection', () => {
      const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Item', [], {
        type: { name: 'listItem' },
        attrs: {},
      }) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('List Item');
      expect(info?.markdownSyntax).toContain('- Item');
    });

    it('should handle codeBlock selection', () => {
      const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'code', [], {
        type: { name: 'codeBlock' },
        attrs: { language: 'js' },
      }) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('Code Block');
      expect(info?.markdownSyntax).toContain('```js');
    });

    it('should handle link mark', () => {
      const marks = [{ type: { name: 'link' }, attrs: { href: 'http://example.com' } }];
      const editor = createMockEditor(
        { from: 0, to: 5, empty: false },
        'Link',
        marks,
      ) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('Link');
      expect(info?.markdownSyntax).toBe('[Link](http://example.com)');
    });
  });
});
