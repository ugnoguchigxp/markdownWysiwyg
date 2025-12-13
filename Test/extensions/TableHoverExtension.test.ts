import { describe, expect, it } from 'vitest';
import { TableHoverExtension } from '../../src/extensions/TableHoverExtension';

describe('TableHoverExtension', () => {
  it('adds hover class on mouseover and removes from other cells', () => {
    const plugin = (TableHoverExtension as any).config.addProseMirrorPlugins()[0];
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

    const view = { dom: root } as unknown as { dom: HTMLElement };

    const ret = handle?.mouseover?.(view as any, { target: td1 } as unknown as MouseEvent);
    expect(ret).toBe(false);

    expect(td1.classList.contains('table-cell-hover')).toBe(true);
    expect(td2.classList.contains('table-cell-hover')).toBe(false);
  });

  it('removes hover class on mouseout when leaving cell', () => {
    const plugin = (TableHoverExtension as any).config.addProseMirrorPlugins()[0];
    const handle = plugin.spec.props?.handleDOMEvents;

    const root = document.createElement('div');
    const td = document.createElement('td');
    td.classList.add('table-cell-hover');
    root.appendChild(td);

    // relatedTarget inside cell -> keep
    handle?.mouseout?.({ dom: root } as any, { target: td, relatedTarget: td } as any);
    expect(td.classList.contains('table-cell-hover')).toBe(true);

    // relatedTarget outside -> remove
    const outside = document.createElement('div');
    handle?.mouseout?.({ dom: root } as any, { target: td, relatedTarget: outside } as any);
    expect(td.classList.contains('table-cell-hover')).toBe(false);
  });
});
