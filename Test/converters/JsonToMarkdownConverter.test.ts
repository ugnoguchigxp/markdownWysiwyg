import { describe, it, expect } from 'vitest';
import { JsonToMarkdownConverter } from '../../src/converters/JsonToMarkdownConverter';

describe('JsonToMarkdownConverter', () => {
    describe('convertToMarkdown', () => {
        it('should return empty string for empty/invalid json', () => {
            expect(JsonToMarkdownConverter.convertToMarkdown({} as any)).toBe('');
            expect(JsonToMarkdownConverter.convertToMarkdown({ content: [] } as any)).toBe('');
        });

        it('should convert simple paragraph', () => {
            const json = {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Hello World' }]
                    }
                ]
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
                        content: [{ type: 'text', text: 'Title' }]
                    }
                ]
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
                                text: 'Bold'
                            },
                            { type: 'text', text: ' and ' },
                            {
                                type: 'text',
                                marks: [{ type: 'italic' }],
                                text: 'Italic'
                            }
                        ]
                    }
                ]
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
                                        content: [{ type: 'text', text: 'Level 1' }]
                                    },
                                    {
                                        type: 'bulletList',
                                        content: [
                                            {
                                                type: 'listItem',
                                                content: [
                                                    {
                                                        type: 'paragraph',
                                                        content: [{ type: 'text', text: 'Level 2' }]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
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
                                content: [{ type: 'text', text: 'Quote' }]
                            }
                        ]
                    }
                ]
            };

            const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
            expect(markdown.trim()).toBe('> Quote');
        });

        it('should convert horizontal rules', () => {
            const json = {
                type: 'doc',
                content: [{ type: 'horizontalRule' }]
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
                            alt: 'Alt'
                        }
                    }
                ]
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
                                text: 'console.log("Hello");'
                            }
                        ]
                    }
                ]
            };

            const markdown = JsonToMarkdownConverter.convertToMarkdown(json);
            expect(markdown).toBe('```javascript\nconsole.log("Hello");\n```\n\n');
        });
    });
});
