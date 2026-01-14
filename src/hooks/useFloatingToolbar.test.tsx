import { act, renderHook } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFloatingToolbar } from './useFloatingToolbar';

describe('useFloatingToolbar - Property-based testing', () => {
  let mockEditor: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    view: {
      coordsAtPos: ReturnType<typeof vi.fn>;
    };
    state: {
      selection: {
        from: number;
        to: number;
        empty: boolean;
      };
    };
    isFocused: boolean;
  };
  let mockEditorElement: HTMLDivElement;
  let scrollHandler: (() => void) | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    scrollHandler = null;
    mockEditorElement = document.createElement('div');
    mockEditorElement.getBoundingClientRect = vi.fn(() => new DOMRect(0, 0, 800, 600));
    vi.spyOn(mockEditorElement, 'addEventListener').mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === 'scroll') {
          scrollHandler = handler as () => void;
        }
      },
    );
    vi.spyOn(mockEditorElement, 'removeEventListener');
    global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      return setTimeout(cb, 0) as unknown as number;
    });

    mockEditor = {
      on: vi.fn(),
      off: vi.fn(),
      view: {
        coordsAtPos: vi.fn((pos: number) => {
          if (pos === 10) {
            return { left: 200, top: 100, right: 300, bottom: 110 };
          }
          return { left: 200, top: 100, right: 200, bottom: 110 };
        }),
      },
      state: {
        selection: {
          from: 10,
          to: 10,
          empty: true,
        },
      },
      isFocused: true,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization and basic properties', () => {
    it('initializes with hidden toolbar and zero position', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );
      expect(result.current.visible).toBe(false);
      expect(result.current.position.top).toBe(0);
      expect(result.current.position.left).toBe(0);
    });

    it('remains hidden when editor is null', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() => useFloatingToolbar(null, editorElementRef, true));
      expect(result.current.visible).toBe(false);
    });

    it('remains hidden when enabled is false', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, false),
      );
      expect(result.current.visible).toBe(false);
    });

    it('remains hidden when editor element ref is null', () => {
      const editorElementRef = { current: null };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );
      expect(result.current.visible).toBe(false);
    });

    it('remains hidden when editor is not focused', () => {
      mockEditor.isFocused = false;
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );
      expect(result.current.visible).toBe(false);
    });
  });

  describe('Event listener registration and cleanup', () => {
    it('registers selectionUpdate, focus, and blur listeners on editor', () => {
      const editorElementRef = { current: mockEditorElement };
      renderHook(() => useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true));

      expect(mockEditor.on).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
      expect(mockEditor.on).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(mockEditor.on).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('registers scroll listener on editor element', () => {
      const editorElementRef = { current: mockEditorElement };
      renderHook(() => useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true));

      expect(mockEditorElement.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        true,
      );
    });

    it('cleans up all event listeners on unmount', () => {
      const editorElementRef = { current: mockEditorElement };
      const { unmount } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );
      unmount();

      expect(mockEditor.off).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
      expect(mockEditor.off).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(mockEditor.off).toHaveBeenCalledWith('blur', expect.any(Function));
      expect(mockEditorElement.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        true,
      );
    });

    it('clears pending timeout on unmount', () => {
      const editorElementRef = { current: mockEditorElement };
      const { unmount } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const blurHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'blur',
      )?.[1] as () => void;

      act(() => {
        if (blurHandler) {
          blurHandler();
        }
      });

      unmount();

      const timeoutCalls = vi.getTimerCount();
      expect(timeoutCalls).toBe(0);
    });
  });

  describe('Property-based position calculation', () => {
    it('positions toolbar above selection when there is sufficient space', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
      expect(result.current.position.top).toBeLessThan(100);
    });

    it('positions toolbar below selection when above would overflow', () => {
      mockEditorElement.getBoundingClientRect = vi.fn(() => new DOMRect(0, 0, 800, 50));
      mockEditor.view.coordsAtPos = vi.fn(() => ({ left: 200, top: 30, right: 300, bottom: 40 }));

      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
      expect(result.current.position.top).toBeGreaterThan(30);
    });

    it('centers toolbar horizontally on selection', () => {
      mockEditor.state.selection = {
        from: 10,
        to: 20,
        empty: false,
      };
      mockEditor.view.coordsAtPos = vi.fn((pos: number) => {
        if (pos === 10) return { left: 300, top: 100, right: 310, bottom: 110 };
        if (pos === 20) return { left: 500, top: 100, right: 510, bottom: 110 };
        return { left: 0, top: 0, right: 0, bottom: 0 };
      });

      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      const expectedCenterX = (300 + 510) / 2;
      const expectedLeft = expectedCenterX - 0;
      expect(result.current.visible).toBe(true);
      expect(result.current.position.left).toBeCloseTo(expectedLeft, -1);
    });

    it('clamps toolbar position within editor boundaries', () => {
      mockEditor.view.coordsAtPos = vi.fn(() => ({ left: 10, top: 100, right: 20, bottom: 110 }));

      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
      expect(result.current.position.left).toBeGreaterThanOrEqual(250);
    });

    it('hides toolbar and returns to zero position when position calculation fails', () => {
      mockEditor.view.coordsAtPos = vi.fn(() => {
        throw new Error('Test error');
      });

      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(false);
    });

    it('updates position on scroll when visible', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        if (scrollHandler) {
          scrollHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
    });
  });

  describe('State transitions', () => {
    it('hides toolbar when enabled becomes false', () => {
      let enabled = true;
      const editorElementRef = { current: mockEditorElement };

      const { result, rerender } = renderHook(
        ({ enabled: currentEnabled }) =>
          useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, currentEnabled),
        { initialProps: { enabled: enabled } },
      );

      act(() => {
        vi.runAllTimers();
      });

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
      expect(result.current.position.top).toBeGreaterThan(0);

      act(() => {
        enabled = false;
        rerender({ enabled: enabled });
      });

      expect(result.current.visible).toBe(false);
    });

    it('toggles enabled state and maintains correct behavior', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, enabled),
        { initialProps: { enabled: true } },
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        rerender({ enabled: false });
      });

      expect(result.current.visible).toBe(false);

      act(() => {
        rerender({ enabled: true });
      });

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
    });

    it('cancels pending blur timeout when selection update occurs', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;
      const blurHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'blur',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        if (blurHandler) {
          blurHandler();
        }
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(149);
      });

      expect(result.current.visible).toBe(true);
    });

    it('cancels pending blur timeout when focus occurs', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;
      const blurHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'blur',
      )?.[1] as () => void;
      const focusHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'focus',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        if (blurHandler) {
          blurHandler();
        }
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        if (focusHandler) {
          focusHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
    });

    it('hides toolbar after blur timeout completes', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;
      const blurHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'blur',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        if (blurHandler) {
          blurHandler();
        }
        vi.advanceTimersByTime(150);
      });

      expect(result.current.visible).toBe(false);
    });

    it('shows toolbar after focus event', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const focusHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'focus',
      )?.[1] as () => void;

      expect(result.current.visible).toBe(false);

      act(() => {
        if (focusHandler) {
          focusHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('handles multiple rapid selection updates', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;

      act(() => {
        for (let i = 0; i < 5; i++) {
          if (selectionUpdateHandler) {
            selectionUpdateHandler();
          }
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);
    });

    it('handles selection updates during blur timeout', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      const selectionUpdateHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'selectionUpdate',
      )?.[1] as () => void;
      const blurHandler = mockEditor.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'blur',
      )?.[1] as () => void;

      act(() => {
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(true);

      act(() => {
        if (blurHandler) {
          blurHandler();
        }
        vi.advanceTimersByTime(75);
        if (selectionUpdateHandler) {
          selectionUpdateHandler();
        }
        vi.advanceTimersByTime(75);
      });

      expect(result.current.visible).toBe(true);
    });

    it('does not update position on scroll when hidden', () => {
      const editorElementRef = { current: mockEditorElement };
      const { result } = renderHook(() =>
        useFloatingToolbar(mockEditor as unknown as Editor, editorElementRef, true),
      );

      expect(result.current.visible).toBe(false);

      act(() => {
        if (scrollHandler) {
          scrollHandler();
        }
        vi.runAllTimers();
      });

      expect(result.current.visible).toBe(false);
    });
  });
});
