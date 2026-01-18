import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES } from './constants';

describe('code block language constants', () => {
  it('includes a plain text fallback and Mermaid', () => {
    expect(SUPPORTED_LANGUAGES[0]).toEqual({ value: '', label: 'Plain Text' });
    expect(SUPPORTED_LANGUAGES.some((lang) => lang.value === 'mermaid')).toBe(true);
  });

  it('avoids duplicate language values', () => {
    const values = SUPPORTED_LANGUAGES.map((lang) => lang.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
