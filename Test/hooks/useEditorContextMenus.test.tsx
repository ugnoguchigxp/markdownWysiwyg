import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEditorContextMenus } from '../../src/hooks/useEditorContextMenus';

const buildEvent = (overrides?: Partial<React.MouseEvent>) =>
  ({
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientX: 10,
    clientY: 20,
    ...overrides,
  }) as unknown as React.MouseEvent;

describe('useEditorContextMenus', () => {
  it('opens and closes link context menu', () => {
    const { result } = renderHook(() => useEditorContextMenus());

    act(() => {
      result.current.handleLinkContextMenu(
        buildEvent({ clientX: 100, clientY: 200 }),
        { href: 'https://example.com', text: 'Example' },
      );
    });

    expect(result.current.linkContextMenu.visible).toBe(true);
    expect(result.current.linkContextMenu.position).toEqual({ x: 100, y: 200 });

    act(() => {
      result.current.handleCloseLinkContextMenu();
    });

    expect(result.current.linkContextMenu.visible).toBe(false);
    expect(result.current.linkContextMenu.linkData).toBe(null);
  });

  it('opens and closes table context menu', () => {
    const { result } = renderHook(() => useEditorContextMenus());

    act(() => {
      result.current.handleTableContextMenu(buildEvent({ clientX: 30, clientY: 40 }));
    });

    expect(result.current.tableContextMenu.visible).toBe(true);
    expect(result.current.tableContextMenu.position).toEqual({ x: 30, y: 40 });

    act(() => {
      result.current.handleCloseTableContextMenu();
    });

    expect(result.current.tableContextMenu.visible).toBe(false);
  });

  it('closes menus on outside click', () => {
    const { result } = renderHook(() => useEditorContextMenus());

    act(() => {
      result.current.handleLinkContextMenu(buildEvent(), { href: '/a', text: 'a' });
      result.current.handleTableContextMenu(buildEvent());
    });

    expect(result.current.linkContextMenu.visible).toBe(true);
    expect(result.current.tableContextMenu.visible).toBe(true);

    act(() => {
      document.body.click();
    });

    expect(result.current.linkContextMenu.visible).toBe(false);
    expect(result.current.tableContextMenu.visible).toBe(false);
  });

  it('keeps menus open when clicking inside menu', () => {
    const { result } = renderHook(() => useEditorContextMenus());

    act(() => {
      result.current.handleLinkContextMenu(buildEvent(), { href: '/b', text: 'b' });
      result.current.handleTableContextMenu(buildEvent());
    });

    const linkMenu = document.createElement('div');
    linkMenu.className = 'link-context-menu';
    document.body.appendChild(linkMenu);

    const tableMenu = document.createElement('div');
    tableMenu.className = 'table-context-menu';
    document.body.appendChild(tableMenu);

    act(() => {
      linkMenu.click();
    });

    expect(result.current.linkContextMenu.visible).toBe(true);
    expect(result.current.tableContextMenu.visible).toBe(false);

    act(() => {
      result.current.handleTableContextMenu(buildEvent());
      tableMenu.click();
    });

    expect(result.current.tableContextMenu.visible).toBe(true);
    expect(result.current.linkContextMenu.visible).toBe(false);

    linkMenu.remove();
    tableMenu.remove();
  });
});
