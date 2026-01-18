import { describe, expect, it } from 'vitest';
import { LARGE_TEXT_THRESHOLD, PASTE_DEBOUNCE_MS, UPDATE_LOCK_RELEASE_MS } from './editor';

describe('editor constants', () => {
  it('exposes stable timing thresholds', () => {
    expect(PASTE_DEBOUNCE_MS).toBe(500);
    expect(LARGE_TEXT_THRESHOLD).toBe(10000);
    expect(UPDATE_LOCK_RELEASE_MS).toBe(150);
  });
});
