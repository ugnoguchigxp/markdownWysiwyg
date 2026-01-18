import { describe, expect, it } from 'vitest';

describe('setupTests', () => {
  it('provides a mock matchMedia implementation', () => {
    const result = window.matchMedia('(min-width: 600px)');

    expect(result.matches).toBe(false);
    expect(result.media).toBe('(min-width: 600px)');
    expect(result.addEventListener).toBeDefined();
    expect(result.removeEventListener).toBeDefined();
  });
});
