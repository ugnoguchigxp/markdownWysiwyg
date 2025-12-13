import { describe, expect, it } from 'vitest';
import { MarkdownTipTapConverter } from '../../src/converters/MarkdownTipTapConverter';

describe('MarkdownTipTapConverter', () => {
  describe('markdownToTipTapJson', () => {
    it('should convert plain text to paragraph', async () => {
      const markdown = 'Hello World';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      });
    });

    it('should convert bold text', async () => {
      const markdown = '**Bold Text**';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0].content?.[0]).toMatchObject({
        type: 'text',
        text: 'Bold Text',
        marks: [{ type: 'bold' }],
      });
    });

    it('should convert italic text', async () => {
      const markdown = '*Italic Text*';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0].content?.[0]).toMatchObject({
        type: 'text',
        text: 'Italic Text',
        marks: [{ type: 'italic' }],
      });
    });

    it('should convert strike text', async () => {
      const markdown = '~~Strike Text~~';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0].content?.[0]).toMatchObject({
        type: 'text',
        text: 'Strike Text',
        marks: [{ type: 'strike' }],
      });
    });

    it('should convert inline code', async () => {
      const markdown = '`const a = 1;`';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0].content?.[0]).toMatchObject({
        type: 'text',
        text: 'const a = 1;',
        marks: [{ type: 'code' }],
      });
    });

    it('should convert headings', async () => {
      const markdown = '# Heading 1';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0]).toMatchObject({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Heading 1' }],
      });
    });

    it('should convert unordered list', async () => {
      const markdown = '- Item 1\n- Item 2';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0]).toMatchObject({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }],
          },
        ],
      });
    });

    it('should convert ordered list', async () => {
      const markdown = '1. Item 1\n2. Item 2';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0]).toMatchObject({
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }],
          },
        ],
      });
    });

    it('should convert blockquote', async () => {
      const markdown = '> Quote';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0]).toMatchObject({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Quote' }],
          },
        ],
      });
    });

    it('should convert code block', async () => {
      const markdown = '```javascript\nconsole.log("Hello");\n```';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0]).toMatchObject({
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'console.log("Hello");' }],
      });
    });

    it('should convert table', async () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
      const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);
      expect(json.content?.[0].type).toBe('table');
      // More detailed checks can be added if needed
    });
  });

  describe('tipTapJsonToMarkdown', () => {
    it('should convert paragraph to plain text', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      };
      const markdown = MarkdownTipTapConverter.tipTapJsonToMarkdown(json);
      expect(markdown).toBe('Hello World');
    });

    it('should convert bold text', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Bold Text', marks: [{ type: 'bold' }] }],
          },
        ],
      };
      const markdown = MarkdownTipTapConverter.tipTapJsonToMarkdown(json);
      expect(markdown).toBe('**Bold Text**');
    });

    // Add more reverse conversion tests as needed
  });
});
