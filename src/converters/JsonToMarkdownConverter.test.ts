import type { JSONContent } from '@tiptap/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonToMarkdownConverter } from '../../src/converters/JsonToMarkdownConverter';

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => mockLogger,
}));

describe('JsonToMarkdownConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertToMarkdown', () => {
    it('should return empty string for empty/invalid json', () => {
      expect(JsonToMarkdownConverter.convertToMarkdown({} as unknown as JSONContent)).toBe('');
      expect(
        JsonToMarkdownConverter.convertToMarkdown({ content: [] } as unknown as JSONContent),
      ).toBe('');
    });

    it('should convert simple paragraph', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown.trim()).toBe('Hello World');
    });

    it('should convert headings', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Title' }],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown.trim()).toBe('# Title');
    });

    it('should convert bold and italic text', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'Bold',
              },
              { type: 'text', text: ' and ' },
              {
                type: 'text',
                marks: [{ type: 'italic' }],
                text: 'Italic',
              },
            ],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown.trim()).toBe('**Bold** and *Italic*');
    });

    it('should convert nested bullet lists', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Level 1' }],
                  },
                  {
                    type: 'bulletList',
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Level 2' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown).toContain('- Level 1');
      expect(markdown).toContain('  - Level 2');
    });

    it('should convert blockquotes', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Quote' }],
              },
            ],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown.trim()).toBe('> Quote');
    });

    it('should convert horizontal rules', () => {
      const json = {
        type: 'doc',
        content: [{ type: 'horizontalRule' }],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown.trim()).toBe('---');
    });

    it('should convert images', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: {
              src: 'img.png',
              alt: 'Alt',
            },
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown).toBe('![Alt](img.png)');
    });

    it('should convert code blocks', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [
              {
                type: 'text',
                text: 'console.log("Hello");',
              },
            ],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown).toBe('```javascript\nconsole.log("Hello");\n```\n\n');
    });

    it('handles ordered lists and listItem fallback', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Fallback' }] }],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown).toContain('1. First');
      expect(markdown).toContain('- Fallback');
    });

    it('converts tables with empty cells', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
                  {
                    type: 'tableCell',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'B' }],
                      },
                    ],
                  },
                ],
              },
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
                  {
                    type: 'tableCell',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'D' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown).toContain('| |B|');
      expect(markdown).toContain('|---|---|');
    });

    it('converts hard breaks and links with titles', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Line1' },
              { type: 'hardBreak' },
              {
                type: 'text',
                text: 'Link',
                marks: [{ type: 'link', attrs: { href: '/path', title: 'Title' } }],
              },
            ],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown).toContain('Line1');
      expect(markdown).toContain('[Link](/path "Title")');
    });

    it('falls back for unsupported node types', () => {
      const json = {
        type: 'doc',
        content: [
          {
            type: 'unknown',
            content: [{ type: 'text', text: 'Fallback' }],
          },
        ],
      };

      const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
      expect(markdown).toContain('Fallback');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('downloadAsMarkdown', () => {
    it('skips download for empty content', () => {
      JsonToMarkdownConverter.downloadAsMarkdown({ type: 'doc', content: [] });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('throws when download fails', () => {
      const originalCreate = URL.createObjectURL;
      URL.createObjectURL = () => {
        throw new Error('fail');
      };

      expect(() =>
        JsonToMarkdownConverter.downloadAsMarkdown({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'text' }],
            },
          ],
        }),
      ).toThrow('Markdownファイルのダウンロードに失敗しました');
      expect(mockLogger.error).toHaveBeenCalled();

      URL.createObjectURL = originalCreate;
    });
  });
});
