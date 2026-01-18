import { describe, expect, it } from 'vitest';
import * as entry from './index';

describe('index exports', () => {
  it('exposes core components and utilities', () => {
    expect(entry.MarkdownEditor).toBeDefined();
    expect(entry.MarkdownToolbar).toBeDefined();
    expect(entry.MarkdownSyntaxStatus).toBeDefined();
    expect(entry.createLogger).toBeDefined();
    expect(entry.SelectionUtils).toBeDefined();
  });

  it('exposes emoji constants', () => {
    expect(entry.EMOJI_CATEGORIES.length).toBeGreaterThan(0);
    expect(entry.EMOJI_DATA.length).toBeGreaterThan(0);
    expect(entry.EMOJI_BY_CATEGORY.size).toBeGreaterThan(0);
  });
});
