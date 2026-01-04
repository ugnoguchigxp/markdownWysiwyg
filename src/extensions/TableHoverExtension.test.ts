import { describe, expect, it } from 'vitest';
import { TableHoverExtension } from '../../src/extensions/TableHoverExtension';

type MouseoverHandler = (view: { dom: HTMLElement }, event: MouseEvent) => boolean;
type MouseoutHandler = (view: { dom: HTMLElement }, event: MouseEvent) => boolean;

type PluginLike = {
  spec: {
    props?: {
      handleDOMEvents?: {
        mouseover?: MouseoverHandler;
        mouseout?: MouseoutHandler;
      };
    };
  };
};

type ExtensionWithPlugins = {
  config: {
    addProseMirrorPlugins: () => PluginLike[];
  };
};

describe('TableHoverExtension', () => {
  it('adds hover class on mouseover and removes from other cells', () => {
    const plugin = (
      TableHoverExtension as unknown as ExtensionWithPlugins
    ).config.addProseMirrorPlugins()[0];
    const handle = plugin.spec.props?.handleDOMEvents;

    const root = document.createElement('div');
    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    td1.textContent = 'a';
    td2.textContent = 'b';

    tr.appendChild(td1);
    tr.appendChild(td2);
    table.appendChild(tr);
    root.appendChild(table);

    td2.classList.add('table-cell-hover');

    const view = { dom: root } as { dom: HTMLElement };
    const event = new MouseEvent('mouseover', { bubbles: true });
    Object.defineProperty(event, 'target', { value: td1 });
    const ret = handle?.mouseover?.(view, event);
    expect(ret).toBe(false);

    expect(td1.classList.contains('table-cell-hover')).toBe(true);
    expect(td2.classList.contains('table-cell-hover')).toBe(false);
  });

  it('removes hover class on mouseout when leaving cell', () => {
    const plugin = (
      TableHoverExtension as unknown as ExtensionWithPlugins
    ).config.addProseMirrorPlugins()[0];
    const handle = plugin.spec.props?.handleDOMEvents;

    const root = document.createElement('div');
    const td = document.createElement('td');
    td.classList.add('table-cell-hover');
    root.appendChild(td);

    const view = { dom: root } as { dom: HTMLElement };

    // relatedTarget inside cell -> keep
    const inside = new MouseEvent('mouseout', { bubbles: true });
    Object.defineProperty(inside, 'target', { value: td });
    Object.defineProperty(inside, 'relatedTarget', { value: td });
    handle?.mouseout?.(view, inside);
    expect(td.classList.contains('table-cell-hover')).toBe(true);

    // relatedTarget outside -> remove
    const outside = document.createElement('div');
    const outsideEvent = new MouseEvent('mouseout', { bubbles: true });
    Object.defineProperty(outsideEvent, 'target', { value: td });
    Object.defineProperty(outsideEvent, 'relatedTarget', { value: outside });
    handle?.mouseout?.(view, outsideEvent);
    expect(td.classList.contains('table-cell-hover')).toBe(false);
  });
});
