import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableResizeEnhancement } from '../../src/extensions/TableResizeEnhancement';

describe('TableResizeEnhancement', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.removeProperty('--table-resize-transition');
  });

  it('sets and then removes resize transition CSS variable when resizeTable meta is present', () => {
    vi.useFakeTimers();

    // biome-ignore lint/suspicious/noExplicitAny: テストで内部構造にアクセスするため
    const plugin = (TableResizeEnhancement as any).config.addProseMirrorPlugins()[0];
    const filter = plugin?.spec?.filterTransaction;

    const transaction = {
      getMeta: (key: string) => (key === 'resizeTable' ? true : undefined),
    };

    const ret = filter?.(transaction, {} as unknown);
    expect(ret).toBe(true);

    expect(document.documentElement.style.getPropertyValue('--table-resize-transition')).toBe(
      '0.2s ease',
    );

    vi.advanceTimersByTime(200);
    expect(document.documentElement.style.getPropertyValue('--table-resize-transition')).toBe('');
  });

  it('does nothing special when resizeTable meta is missing', () => {
    // biome-ignore lint/suspicious/noExplicitAny: テストで内部構造にアクセスするため
    const plugin = (TableResizeEnhancement as any).config.addProseMirrorPlugins()[0];
    const filter = plugin?.spec?.filterTransaction;

    const transaction = {
      getMeta: () => undefined,
    };

    const ret = filter?.(transaction, {} as unknown);
    expect(ret).toBe(true);
  });
});
