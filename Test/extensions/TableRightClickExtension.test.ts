import { describe, expect, it, vi } from 'vitest';
import { createTableRightClickExtension } from '../../src/extensions/TableRightClickExtension';

describe('TableRightClickExtension', () => {
  it('calls handler on right click within table cells', () => {
    const handleContextMenu = vi.fn();
    const ext = createTableRightClickExtension(handleContextMenu);
    const plugin = (ext as any).config.addProseMirrorPlugins()[0];

    const td = document.createElement('td');
    const preventDefault = vi.fn();

    const event = {
      target: td,
      button: 2,
      preventDefault,
    } as any;

    const ret = plugin.spec.props.handleDOMEvents.contextmenu(null, event);
    expect(ret).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalledWith(event);
  });

  it('returns false when not a right-click or not in a table', () => {
    const handleContextMenu = vi.fn();
    const ext = createTableRightClickExtension(handleContextMenu);
    const plugin = (ext as any).config.addProseMirrorPlugins()[0];

    const div = document.createElement('div');
    const event = {
      target: div,
      button: 0,
      preventDefault: vi.fn(),
    } as any;

    expect(plugin.spec.props.handleDOMEvents.contextmenu(null, event)).toBe(false);
    expect(handleContextMenu).not.toHaveBeenCalled();
  });
});
