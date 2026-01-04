import { describe, expect, it } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn', () => {
  it('merges strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', null, undefined, '', 0, false, 'bar')).toBe('foo bar');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles objects with conditional keys', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('handles nested arrays and objects', () => {
    expect(cn(['foo', { bar: true, baz: false }])).toBe('foo bar');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles string with spaces', () => {
    expect(cn('foo  bar')).toBe('foo  bar');
  });
});
