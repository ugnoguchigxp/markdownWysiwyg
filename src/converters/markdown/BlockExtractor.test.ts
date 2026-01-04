import { describe, expect, it } from 'vitest';
import { BlockExtractor } from '../../../src/converters/markdown/BlockExtractor';

describe('BlockExtractor', () => {
  it('extracts fenced code blocks', () => {
    const markdown = ['before', '```js', 'const x = 1;', '```', 'after'].join('\n');
    const { text, blocks } = BlockExtractor.extractCodeBlocks(markdown);

    expect(blocks.size).toBe(1);
    const [placeholder, data] = Array.from(blocks.entries())[0];
    expect(placeholder).toMatch(/__CODEBLOCK_/);
    expect(data.language).toBe('js');
    expect(data.code).toBe('const x = 1;');
    expect(text).toContain(placeholder);
  });

  it('extracts code block even when closing fence is missing', () => {
    const markdown = ['```', 'line1', 'line2'].join('\n');
    const { text, blocks } = BlockExtractor.extractCodeBlocks(markdown);

    expect(blocks.size).toBe(1);
    const [placeholder, data] = Array.from(blocks.entries())[0];
    expect(text.trim()).toBe(placeholder);
    expect(data.code).toBe('line1\nline2');
  });

  it('extracts tables with headers and rows', () => {
    const markdown = ['| A | B |', '|---|---|', '| 1 | 2 |'].join('\n');
    const { text, tables } = BlockExtractor.extractTables(markdown);

    expect(tables.size).toBe(1);
    const [placeholder, data] = Array.from(tables.entries())[0];
    expect(text.trim()).toBe(placeholder);
    expect(data.headers).toEqual(['A', 'B']);
    expect(data.rows).toEqual([['1', '2']]);
  });

  it('leaves non-table lines untouched', () => {
    const markdown = ['| A | B |', '| A | B |'].join('\n');
    const { text, tables } = BlockExtractor.extractTables(markdown);

    expect(tables.size).toBe(0);
    expect(text).toBe(markdown);
  });

  it('handles incomplete table structures (without separator)', () => {
    const markdown = ['| A | B |', 'non-table line'].join('\n');
    const { text, tables } = BlockExtractor.extractTables(markdown);

    expect(tables.size).toBe(0);
    expect(text).toContain('| A | B |');
  });

  it('returns null for tables with fewer than 2 lines', () => {
    const markdown = ['| Header |'].join('\n');
    const { text, tables } = BlockExtractor.extractTables(markdown);

    expect(tables.size).toBe(0);
    expect(text).toBe(markdown);
  });

  it('handles single row with pipes as non-table', () => {
    const markdown = ['| Row with pipes |'].join('\n');
    const { text, tables } = BlockExtractor.extractTables(markdown);

    expect(tables.size).toBe(0);
    expect(text).toBe(markdown);
  });

  it('extracts multiple code blocks', () => {
    const markdown = [
      '```js',
      'const x = 1;',
      '```',
      'middle text',
      '```python',
      'def y():',
      '  pass',
      '```',
    ].join('\n');
    const { text, blocks } = BlockExtractor.extractCodeBlocks(markdown);

    expect(blocks.size).toBe(2);
    const entries = Array.from(blocks.entries());
    expect(entries[0][1].language).toBe('js');
    expect(entries[1][1].language).toBe('python');
  });

  it('extracts multiple tables', () => {
    const markdown = [
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
      '',
      '| C | D |',
      '|---|---|',
      '| 3 | 4 |',
    ].join('\n');
    const { text, tables } = BlockExtractor.extractTables(markdown);

    expect(tables.size).toBe(2);
    const entries = Array.from(tables.entries());
    expect(entries[0][1].headers).toEqual(['A', 'B']);
    expect(entries[1][1].headers).toEqual(['C', 'D']);
  });
});
