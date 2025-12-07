import { renderHook, act } from '@testing-library/react';
import { useTableToolbar } from '../../src/hooks/useTableToolbar';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useTableToolbar', () => {
    let mockEditor: any;
    let mockTableElement: any;

    beforeEach(() => {
        mockTableElement = document.createElement('table');
        mockTableElement.className = 'tiptap-table-resizable';
        // Mock getBoundingClientRect
        mockTableElement.getBoundingClientRect = vi.fn(() => ({
            left: 100,
            top: 200,
            width: 50,
            height: 50,
        }));

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

        // Mock NodesBetween implementation to find a table if desired
        mockEditor.state.doc.nodesBetween.mockImplementation((from: number, to: number, callback: any) => {
            // Simulate finding a table
            // callback(node, pos, parent, index)
            // If we want to simulate a table found:
            const tableNode = { type: { name: 'table' } };
            const shouldContinue = callback(tableNode, 5);
            if (shouldContinue === false) return;
        });
    });

    it('initializes with hidden toolbar', () => {
        const { result } = renderHook(() => useTableToolbar(mockEditor));
        expect(result.current.visible).toBe(false);
    });

    it('updates position when showToolbar is called', () => {
        const { result } = renderHook(() => useTableToolbar(mockEditor));

        act(() => {
            result.current.showToolbar(mockTableElement);
        });

        expect(result.current.visible).toBe(true);
        expect(result.current.position.x).toBe(100); // 100 + scrollLeft (0)
        expect(result.current.position.y).toBe(200); // 200 + scrollTop (0)
    });

    it('hides toolbar when hideToolbar is called', () => {
        const { result } = renderHook(() => useTableToolbar(mockEditor));

        act(() => {
            result.current.showToolbar(mockTableElement);
        });
        expect(result.current.visible).toBe(true);

        act(() => {
            result.current.hideToolbar();
        });
        expect(result.current.visible).toBe(false);
    });

    // Note: detailed testing of checkTableSelection involves complex mocking of doc/nodes.
    // The basic mechanics are covered by show/hide/init tests.
    // If we trigger 'selectionUpdate' manually it should call checkTableSelection.

    it('listens to selectionUpdate', () => {
        const { result } = renderHook(() => useTableToolbar(mockEditor));
        expect(mockEditor.on).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
    });
});
