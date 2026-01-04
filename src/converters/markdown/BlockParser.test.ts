import { describe, expect, it } from 'vitest';
import { BlockParser } from '../../../src/converters/markdown/BlockParser';

describe('BlockParser', () => {
  it('parses headings, horizontal rules, blockquotes, and paragraphs', () => {
    const markdown = ['# Title', '---', '> quote', 'para line1', 'line2'].join('\n');
    const blocks = BlockParser.parseBlocks(markdown);

    expect(blocks[0]?.type).toBe('heading');
    expect(blocks[1]?.type).toBe('horizontalRule');
    expect(blocks[2]?.type).toBe('blockquote');
    expect(blocks[3]?.type).toBe('paragraph');
  });

  it('parses nested lists and ordered lists', () => {
    const markdown = ['- item1', '  - child1', '1. first'].join('\n');
    const blocks = BlockParser.parseBlocks(markdown);

    expect(blocks[0]?.type).toBe('bulletList');
    const listItem = blocks[0]?.content?.[0];
    const nestedList = listItem?.content?.[1];
    expect(nestedList?.type).toBe('bulletList');

    expect(blocks[1]?.type).toBe('orderedList');
  });

  it('keeps code/table placeholders as paragraphs', () => {
    const markdown = ['__CODEBLOCK_X__', '__TABLE_Y__'].join('\n');
    const blocks = BlockParser.parseBlocks(markdown);

    expect(blocks[0]?.type).toBe('paragraph');
    expect(blocks[0]?.content?.[0]?.text).toBe('__CODEBLOCK_X__');
    expect(blocks[1]?.content?.[0]?.text).toBe('__TABLE_Y__');
  });
});
