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
          marks: () => marks,
          content: () => ({
            content: [],
          }),
        },
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

    it('should return null for empty text with selection', () => {
      const editor = createMockEditor({ from: 0, to: 5, empty: false }, '   ') as unknown as Editor;
      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info).toBe(null);
    });

    it('should return null for null editor', () => {
      const info = SelectionUtils.getSelectionMarkdownSyntax(null);
      expect(info).toBe(null);
    });

    it('should handle italic mark', () => {
      const marks = [{ type: { name: 'italic' } }];
      const editor = createMockEditor(
        { from: 0, to: 5, empty: false },
        'Text',
        marks,
      ) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('Italic');
      expect(info?.markdownSyntax).toBe('*Text*');
    });

    it('should handle inline code mark', () => {
      const marks = [{ type: { name: 'code' } }];
      const editor = createMockEditor(
        { from: 0, to: 5, empty: false },
        'code',
        marks,
      ) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('Inline Code');
      expect(info?.markdownSyntax).toBe('`code`');
    });

    it('should handle strikethrough mark', () => {
      const marks = [{ type: { name: 'strike' } }];
      const editor = createMockEditor(
        { from: 0, to: 5, empty: false },
        'Text',
        marks,
      ) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('Strikethrough');
      expect(info?.markdownSyntax).toBe('~~Text~~');
    });

    it('should handle heading node', () => {
      const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Title', [], {
        type: { name: 'heading' },
        attrs: { level: 2 },
      }) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('H2');
      expect(info?.markdownSyntax).toBe('## Title');
    });

    it('should handle empty cursor in heading', () => {
      const editor = createMockEditor({ from: 0, to: 0, empty: true }, '', [], {
        type: { name: 'heading' },
        attrs: { level: 1 },
      }) as unknown as Editor;

      const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
      expect(info?.marks).toContain('H1');
      expect(info?.markdownSyntax).toBe('# (ヘッダー1)');
    });
  });

  describe('getCurrentNodeInfo', () => {
    it('should return null for null editor', () => {
      const info = SelectionUtils.getCurrentNodeInfo(null);
      expect(info).toBe(null);
    });

    it('should return node type and level for heading', () => {
      const editor = createMockEditor({ from: 0, to: 0, empty: true }, '', [], {
        type: { name: 'heading' },
        attrs: { level: 3 },
      }) as unknown as Editor;

      const info = SelectionUtils.getCurrentNodeInfo(editor);
      expect(info?.nodeType).toBe('heading');
      expect(info?.level).toBe(3);
    });

    it('should return node type for paragraph', () => {
      const editor = createMockEditor({ from: 0, to: 0, empty: true }, '', [], {
        type: { name: 'paragraph' },
        attrs: {},
      }) as unknown as Editor;

      const info = SelectionUtils.getCurrentNodeInfo(editor);
      expect(info?.nodeType).toBe('paragraph');
      expect(info?.level).toBe(undefined);
    });

    it('should return node type for codeBlock', () => {
      const editor = createMockEditor({ from: 0, to: 0, empty: true }, '', [], {
        type: { name: 'codeBlock' },
        attrs: { language: 'js' },
      }) as unknown as Editor;

      const info = SelectionUtils.getCurrentNodeInfo(editor);
      expect(info?.nodeType).toBe('codeBlock');
    });
  });
});
