import { act, renderHook } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageToolbar } from '../../src/hooks/useImageToolbar';

type SelectionJSON = { type: string };
type MockSelection = { from: number; to: number; toJSON: () => SelectionJSON };
type NodesBetweenCallback = (node: { type: { name: string } }, pos: number) => boolean | undefined;
type MockDoc = {
  nodesBetween: (from: number, to: number, callback: NodesBetweenCallback) => void;
  nodeAt: (pos: number) => { type: { name: string } } | null;
};
type MockView = {
  nodeDOM: (pos: number) => HTMLElement | null;
  dom: { querySelector: (selector: string) => HTMLElement | null };
};
type MockEditor = {
  on: (name: string, listener: () => void) => void;
  off: (name: string, listener: () => void) => void;
  view: MockView;
  state: { selection: MockSelection; doc: MockDoc };
};

describe('useImageToolbar', () => {
  let mockEditor: MockEditor;
  let mockImageElement: HTMLImageElement;

  beforeEach(() => {
    mockImageElement = document.createElement('img');
    mockImageElement.getBoundingClientRect = vi.fn(() => new DOMRect(100, 200, 300, 200));

    const nodeDOM = vi.fn<(pos: number) => HTMLElement | null>().mockImplementation((pos) => {
      if (pos === 10) return mockImageElement;
      return null;
    });

    mockEditor = {
      on: vi.fn(),
      off: vi.fn(),
      view: {
        nodeDOM,
        dom: {
          querySelector: vi.fn().mockReturnValue(mockImageElement),
        },
      },
      state: {
        selection: {
          from: 10,
          to: 11,
          toJSON: () => ({ type: 'node' }),
        },
        doc: {
          nodesBetween: vi.fn(),
          nodeAt: vi.fn().mockImplementation((pos: number) => {
            if (pos === 10) return { type: { name: 'image' } };
            return null;
          }),
        },
      },
    };

    mockEditor.state.doc.nodesBetween.mockImplementation(
      (from: number, to: number, callback: NodesBetweenCallback) => {
        callback({ type: { name: 'image' } }, 10);
      },
    );
  });

  it('initializes with hidden toolbar', () => {
    const { result } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));
    expect(result.current.visible).toBe(false);
    expect(result.current.position.x).toBe(0);
    expect(result.current.position.y).toBe(0);
  });

  it('listens to selectionUpdate on mount', () => {
    renderHook(() => useImageToolbar(mockEditor as unknown as Editor));
    expect(mockEditor.on).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
  });

  it('removes listener on unmount', () => {
    const { unmount } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));
    unmount();
    expect(mockEditor.off).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
  });

  it('shows toolbar when image is selected', () => {
    let selectionUpdateListener: (() => void) | undefined;
    mockEditor.on = vi.fn((name: string, listener: () => void) => {
      if (name === 'selectionUpdate') selectionUpdateListener = listener;
    });

    const { result } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));

    act(() => {
      selectionUpdateListener?.();
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.position.x).toBe(100);
    expect(result.current.position.y).toBe(200);
  });

  it('hides toolbar when selection is not an image', () => {
    let selectionUpdateListener: (() => void) | undefined;
    mockEditor.on = vi.fn((name: string, listener: () => void) => {
      if (name === 'selectionUpdate') selectionUpdateListener = listener;
    });

    const { result } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));

    act(() => {
      selectionUpdateListener?.();
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      mockEditor.state.selection.toJSON = () => ({ type: 'text' });
      selectionUpdateListener?.();
    });
    expect(result.current.visible).toBe(false);
  });

  it('handles null editor gracefully', () => {
    const { result } = renderHook(() => useImageToolbar(null));
    expect(result.current.visible).toBe(false);
  });

  it('hides toolbar when clicking outside image', () => {
    let selectionUpdateListener: (() => void) | undefined;
    mockEditor.on = vi.fn((name: string, listener: () => void) => {
      if (name === 'selectionUpdate') selectionUpdateListener = listener;
    });
    const { result } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));

    act(() => {
      selectionUpdateListener?.();
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      mockEditor.state.selection.toJSON = () => ({ type: 'text' });
      selectionUpdateListener?.();
    });

    expect(result.current.visible).toBe(false);
  });

  it('does not hide toolbar when clicking inside image', () => {
    let selectionUpdateListener: (() => void) | undefined;
    mockEditor.on = vi.fn((name: string, listener: () => void) => {
      if (name === 'selectionUpdate') selectionUpdateListener = listener;
    });
    const { result } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));

    act(() => {
      selectionUpdateListener?.();
    });

    vi.useFakeTimers();
    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', { value: mockImageElement });
      document.dispatchEvent(event);
      vi.runAllTimers();
    });

    expect(result.current.visible).toBe(true);
    vi.useRealTimers();
  });

  it('updates position on scroll', () => {
    let selectionUpdateListener: (() => void) | undefined;
    mockEditor.on = vi.fn((name: string, listener: () => void) => {
      if (name === 'selectionUpdate') selectionUpdateListener = listener;
    });
    const { result } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));

    act(() => {
      selectionUpdateListener?.();
    });

    mockImageElement.getBoundingClientRect = vi.fn(() => new DOMRect(150, 250, 300, 200));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.position.x).toBe(150);
    expect(result.current.position.y).toBe(250);
  });

  it('works when image is nested in a wrapper', () => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(mockImageElement);
    mockEditor.view.nodeDOM = vi.fn().mockReturnValue(wrapper);

    let selectionUpdateListener: (() => void) | undefined;
    mockEditor.on = vi.fn((name: string, listener: () => void) => {
      if (name === 'selectionUpdate') selectionUpdateListener = listener;
    });
    const { result } = renderHook(() => useImageToolbar(mockEditor as unknown as Editor));

    act(() => {
      selectionUpdateListener?.();
    });

    expect(result.current.visible).toBe(true);
  });
});
