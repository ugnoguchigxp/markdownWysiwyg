import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

import { TableForceExtension } from '../../src/extensions/TableForceExtension';

describe('TableForceExtension', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates resize handles for existing tables and supports drag resizing', () => {
    vi.useFakeTimers();

    const root = document.createElement('div');
    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = 'cell';

    Object.defineProperty(td, 'offsetWidth', {
      value: 100,
      configurable: true,
    });

    tr.appendChild(td);
    table.appendChild(tr);
    root.appendChild(table);

    const plugin = (TableForceExtension as any).config.addProseMirrorPlugins()[0];
    const view = plugin.spec.view?.({ dom: root } as unknown as { dom: HTMLElement });

    vi.advanceTimersByTime(100);

    const handle = td.querySelector('.column-resize-handle') as HTMLElement | null;
    expect(handle).toBeTruthy();

    handle?.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 30, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(td.style.width).toBe('120px');

    view?.destroy?.();
  });

  it('observes DOM changes and schedules handle creation for new tables', () => {
    vi.useFakeTimers();

    const OriginalMutationObserver = globalThis.MutationObserver;

    const disconnect = vi.fn();
    let capturedCallback: any = null;

    class FakeMutationObserver {
      constructor(cb: any) {
        capturedCallback = cb;
      }
      observe() {
        // Intentionally empty.
      }
      disconnect() {
        disconnect();
      }
    }

    // @ts-expect-error - test override
    globalThis.MutationObserver = FakeMutationObserver;

    const root = document.createElement('div');

    const plugin = (TableForceExtension as any).config.addProseMirrorPlugins()[0];
    const view = plugin.spec.view?.({ dom: root } as unknown as { dom: HTMLElement });

    // Add new table and fire mutation
    const newTable = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');

    Object.defineProperty(td, 'offsetWidth', {
      value: 100,
      configurable: true,
    });

    tr.appendChild(td);
    newTable.appendChild(tr);
    root.appendChild(newTable);

    if (!capturedCallback) {
      throw new Error('MutationObserver callback was not captured');
    }

    (capturedCallback as any)(
      [
        {
          type: 'childList',
          addedNodes: [newTable],
        } as unknown as MutationRecord,
      ],
      {} as MutationObserver,
    );

    vi.advanceTimersByTime(50);

    expect(root.querySelector('.column-resize-handle')).toBeTruthy();

    view?.destroy?.();
    expect(disconnect).toHaveBeenCalled();

    globalThis.MutationObserver = OriginalMutationObserver;
  });
});
