import { describe, expect, it } from 'vitest';
import { StaticHtmlGenerator } from './StaticHtmlGenerator';

describe('StaticHtmlGenerator', () => {
  it('should generate HTML from basic markdown', async () => {
    const markdown = '# Hello World\n\nThis is a paragraph.';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown);

    expect(html).toContain('<h1>Hello World</h1>');
    expect(html).toContain('<p>This is a paragraph.</p>');
  });

  it('should render bold, italic, and strikethrough', async () => {
    const markdown = '**Bold**, *Italic*, ~~Strike~~';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown);

    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<em>Italic</em>');
    expect(html).toContain('<s>Strike</s>');
  });

  it('should render lists', async () => {
    const markdown = '- Item 1\n- Item 2\n\n1. Number 1\n2. Number 2';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown);

    expect(html).toContain('<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>');
    expect(html).toContain('<ol><li><p>Number 1</p></li><li><p>Number 2</p></li></ol>');
  });

  it('should render blockquotes with custom class', async () => {
    const markdown = '> This is a quote';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown, {
      classNames: { blockquote: 'custom-quote-class' },
    });

    expect(html).toContain('<blockquote class="custom-quote-class">');
    expect(html).toContain('<p>This is a quote</p>');
  });

  it('should render links', async () => {
    const markdown = '[Example](https://example.com)';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown);

    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('>Example</a>');
  });

  it('should render images', async () => {
    const markdown = '![Alt Text](https://example.com/image.png)';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown);

    expect(html).toContain('src="https://example.com/image.png"');
    expect(html).toContain('alt="Alt Text"');
    expect(html).toContain(
      'style="display: block; margin-left: auto; margin-right: auto; width: auto;"',
    );
  });

  it('should render code blocks with syntax highlighting classes', async () => {
    const markdown = '```typescript\nconst x = 1;\n```';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown);

    expect(html).toContain('<pre><code class="language-typescript">');
    expect(html).toContain('const x = 1;');
  });

  it('should render table', async () => {
    const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
    const html = await StaticHtmlGenerator.generateStaticHtml(markdown);

    expect(html).toContain('<table class="markdown-advance-table"');
    expect(html).toContain('Header 1');
    expect(html).toContain('Cell 1');
    expect(html).toContain('<tbody>');
  });
});
