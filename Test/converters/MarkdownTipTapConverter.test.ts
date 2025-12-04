import { describe, it, expect } from 'vitest';
import { MarkdownTipTapConverter } from '../../src/converters/MarkdownTipTapConverter';

describe('MarkdownTipTapConverter', () => {
    describe('markdownToTipTapJson', () => {
        it('should convert simple text', async () => {
            const markdown = 'Hello World';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.type).toBe('doc');
            expect(json.content?.[0].type).toBe('paragraph');
            expect(json.content?.[0].content?.[0].text).toBe('Hello World');
        });

        it('should convert headings', async () => {
            const markdown = '# Title';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].type).toBe('heading');
            expect(json.content?.[0].attrs?.level).toBe(1);
            expect(json.content?.[0].content?.[0].text).toBe('Title');
        });

        it('should convert code blocks', async () => {
            const markdown = '```js\nconsole.log("test");\n```';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].type).toBe('codeBlock');
            expect(json.content?.[0].attrs?.language).toBe('js');
            expect(json.content?.[0].content?.[0].text).toBe('console.log("test");');
        });

        it('should convert blockquotes', async () => {
            const markdown = '> Quote';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].type).toBe('blockquote');
            expect(json.content?.[0].content?.[0].type).toBe('paragraph');
            expect(json.content?.[0].content?.[0].content?.[0].text).toBe('Quote');
        });

        it('should convert bullet lists', async () => {
            const markdown = '- Item 1\n- Item 2';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].type).toBe('bulletList');
            expect(json.content?.[0].content).toHaveLength(2);
            expect(json.content?.[0].content?.[0].type).toBe('listItem');
            expect(json.content?.[0].content?.[0].content?.[0].content?.[0].text).toBe('Item 1');
        });

        it('should convert ordered lists', async () => {
            const markdown = '1. Item 1\n2. Item 2';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].type).toBe('orderedList');
            expect(json.content?.[0].content).toHaveLength(2);
        });

        it('should convert horizontal rules', async () => {
            const markdown = '---';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].type).toBe('horizontalRule');
        });

        it('should convert images', async () => {
            const markdown = '![Alt](http://example.com/img.png)';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].type).toBe('paragraph');
            expect(json.content?.[0].content?.[0].type).toBe('image');
            expect(json.content?.[0].content?.[0].attrs?.src).toBe('http://example.com/img.png');
            expect(json.content?.[0].content?.[0].attrs?.alt).toBe('Alt');
        });

        it('should convert links', async () => {
            const markdown = '[Link](http://example.com)';
            const json = await MarkdownTipTapConverter.markdownToTipTapJson(markdown);

            expect(json.content?.[0].content?.[0].marks?.[0].type).toBe('link');
            expect(json.content?.[0].content?.[0].marks?.[0].attrs?.href).toBe('http://example.com');
            expect(json.content?.[0].content?.[0].text).toBe('Link');
        });
    });
});
