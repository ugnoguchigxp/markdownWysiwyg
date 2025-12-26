import { describe, expect, it, vi, beforeEach } from 'vitest';
import { InlineParser } from '../../../src/converters/markdown/InlineParser';

const mockNormalizeUrlOrNull = vi.fn();
const mockNormalizeImageSrcOrNull = vi.fn();

vi.mock('../../../src/utils/security', () => ({
  normalizeUrlOrNull: (...args: unknown[]) => mockNormalizeUrlOrNull(...args),
  normalizeImageSrcOrNull: (...args: unknown[]) => mockNormalizeImageSrcOrNull(...args),
}));

describe('InlineParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for blank text', () => {
    expect(InlineParser.parseInline('')).toEqual([]);
    expect(InlineParser.parseInline('   ')).toEqual([]);
  });

  it('parses inline code', () => {
    const nodes = InlineParser.parseInline('a `code` b');
    const codeNode = nodes.find((node) => node.marks?.some((m) => m.type === 'code'));
    expect(codeNode?.text).toBe('code');
  });

  it('parses valid links', () => {
    mockNormalizeUrlOrNull.mockReturnValueOnce('https://example.com');
    const nodes = InlineParser.parseInline('[link](https://example.com)');
    const linkNode = nodes.find((node) => node.marks?.some((m) => m.type === 'link'));
    expect(linkNode?.text).toBe('link');
  });

  it('falls back when link is invalid', () => {
    mockNormalizeUrlOrNull.mockReturnValueOnce(null);
    const nodes = InlineParser.parseInline('[bad](javascript:alert(1))');
    const textNode = nodes.find((node) => node.type === 'text');
    expect(textNode?.text).toBe('bad (javascript:alert(1)');
  });

  it('parses images when src is valid', () => {
    mockNormalizeImageSrcOrNull.mockReturnValueOnce('/safe.png');
    const nodes = InlineParser.parseInline('![alt](img.png)');
    const imageNode = nodes.find((node) => node.type === 'image');
    expect(imageNode?.attrs).toEqual({ src: '/safe.png', alt: 'alt' });
  });

  it('falls back when image src is invalid', () => {
    mockNormalizeImageSrcOrNull.mockReturnValueOnce(null);
    const nodes = InlineParser.parseInline('![alt](img.png)');
    const textNode = nodes.find((node) => node.type === 'text');
    expect(textNode?.text).toBe('![alt](img.png)');
  });

  it('parses bold, italic, and strike', () => {
    const nodes = InlineParser.parseInline('**bold** *italic* ~~strike~~');
    const boldNode = nodes.find((node) => node.marks?.some((m) => m.type === 'bold'));
    const italicNode = nodes.find((node) => node.marks?.some((m) => m.type === 'italic'));
    const strikeNode = nodes.find((node) => node.marks?.some((m) => m.type === 'strike'));
    expect(boldNode?.text).toBe('bold');
    expect(italicNode?.text).toBe('italic');
    expect(strikeNode?.text).toBe('strike');
  });
});
