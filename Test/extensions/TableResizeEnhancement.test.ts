import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableResizeEnhancement } from '../../src/extensions/TableResizeEnhancement';

describe('TableResizeEnhancement', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.removeProperty('--table-resize-transition');
  });

  it('sets and then removes resize transition CSS variable when resizeTable meta is present', () => {
    vi.useFakeTimers();

    const plugin = (TableResizeEnhancement as any).config.addProseMirrorPlugins()[0];
    const filter = plugin.spec.filterTransaction;

    const transaction = {
      getMeta: (key: string) => (key === 'resizeTable' ? true : undefined),
    } as any;

    const ret = filter?.(transaction, {} as any);
    expect(ret).toBe(true);

    expect(document.documentElement.style.getPropertyValue('--table-resize-transition')).toBe(
      '0.2s ease',
    );

    vi.advanceTimersByTime(200);
    expect(document.documentElement.style.getPropertyValue('--table-resize-transition')).toBe('');
  });

  it('does nothing special when resizeTable meta is missing', () => {
    const plugin = (TableResizeEnhancement as any).config.addProseMirrorPlugins()[0];
    const filter = plugin.spec.filterTransaction;

    const transaction = {
      getMeta: () => undefined,
    } as any;

    const ret = filter?.(transaction, {} as any);
    expect(ret).toBe(true);
  });
});
