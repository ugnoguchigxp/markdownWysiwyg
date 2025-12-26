import { renderHook, act } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTableToolbar } from '../../src/hooks/useTableToolbar';

describe('useTableToolbar', () => {
  let mockEditor: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    view: { dom: { querySelector: ReturnType<typeof vi.fn> } };
    state: {
      selection: { from: number; to: number };
      doc: {
        nodesBetween: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockTableElement: HTMLTableElement;

  beforeEach(() => {
    mockTableElement = document.createElement('table');
    mockTableElement.className = 'tiptap-table-resizable';
    mockTableElement.getBoundingClientRect = vi.fn(() => new DOMRect(100, 200, 50, 50));

    mockEditor = {
      on: vi.fn(),
      off: vi.fn(),
      view: {
        dom: {
          querySelector: vi.fn().mockReturnValue(mockTableElement),
        },
      },
      state: {
        selection: { from: 0, to: 10 },
        doc: {
          nodesBetween: vi.fn(),
        },
      },
    };

    mockEditor.state.doc.nodesBetween.mockImplementation(
      (
        _from: number,
        _to: number,
        callback: (node: { type: { name: string } }, _pos: number) => boolean | undefined,
      ) => {
        const tableNode = { type: { name: 'table' } };
        const shouldContinue = callback(tableNode, 5);
        if (shouldContinue === false) return;
      },
    );
  });

  it('initializes with hidden toolbar', () => {
    const { result } = renderHook(() => useTableToolbar(mockEditor as unknown as Editor));
    expect(result.current.visible).toBe(false);
    expect(result.current.position.x).toBe(0);
    expect(result.current.position.y).toBe(0);
    expect(result.current.tableElement).toBe(null);
  });

  it('updates position when showToolbar is called', () => {
    const { result } = renderHook(() => useTableToolbar(mockEditor as unknown as Editor));

    act(() => {
      result.current.showToolbar(mockTableElement);
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.position.x).toBe(100);
    expect(result.current.position.y).toBe(200);
    expect(result.current.tableElement).toBe(mockTableElement);
  });

  it('hides toolbar when hideToolbar is called', () => {
    const { result } = renderHook(() => useTableToolbar(mockEditor as unknown as Editor));

    act(() => {
      result.current.showToolbar(mockTableElement);
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.hideToolbar();
    });
    expect(result.current.visible).toBe(false);
    expect(result.current.tableElement).toBe(null);
  });

  it('listens to selectionUpdate', () => {
    renderHook(() => useTableToolbar(mockEditor as unknown as Editor));
    expect(mockEditor.on).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
  });

  it('cleans up selectionUpdate listener on unmount', () => {
    const { unmount } = renderHook(() => useTableToolbar(mockEditor as unknown as Editor));
    unmount();
    expect(mockEditor.off).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
  });

  it('returns null when editor is null', () => {
    const { result } = renderHook(() => useTableToolbar(null));
    expect(result.current.visible).toBe(false);
    expect(result.current.position.x).toBe(0);
    expect(result.current.position.y).toBe(0);
    expect(result.current.tableElement).toBe(null);
  });

  it('shows toolbar when table is in selection', () => {
    const { result } = renderHook(() => useTableToolbar(mockEditor as unknown as Editor));

    act(() => {
      result.current.checkTableSelection();
    });

    expect(result.current.visible).toBe(true);
  });

  it('hides toolbar when no table is in selection', () => {
    mockEditor.state.doc.nodesBetween.mockImplementation(
      (
        _from: number,
        _to: number,
        _callback: (node: { type: { name: string } }, _pos: number) => boolean | undefined,
      ) => {
        return;
      },
    );

    const { result } = renderHook(() => useTableToolbar(mockEditor as unknown as Editor));

    act(() => {
      result.current.showToolbar(mockTableElement);
      result.current.checkTableSelection();
    });

    expect(result.current.visible).toBe(false);
  });

  it('hides toolbar when clicking outside table', () => {
    const { result } = renderHook(() => useTableToolbar(mockEditor as unknown as Editor));

    act(() => {
      result.current.showToolbar(mockTableElement);
    });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: outsideElement });

    vi.useFakeTimers();
    act(() => {
      document.dispatchEvent(clickEvent);
      vi.runAllTimers();
    });
    vi.useRealTimers();

    expect(result.current.visible).toBe(false);
    document.body.removeChild(outsideElement);
  });
});
