import { describe, expect, it, vi } from 'vitest';
import { createTableRightClickExtension } from '../../src/extensions/TableRightClickExtension';

type ContextmenuHandler = (view: unknown, event: MouseEvent) => boolean;

type PluginLike = {
  spec: {
    props: {
      handleDOMEvents: {
        contextmenu: ContextmenuHandler;
      };
    };
  };
};

type ExtensionWithPlugins = {
  config: {
    addProseMirrorPlugins: () => PluginLike[];
  };
};

describe('TableRightClickExtension', () => {
  it('calls handler on right click within table cells', () => {
    const handleContextMenu = vi.fn();
    const ext = createTableRightClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const td = document.createElement('td');
    const event = new MouseEvent('contextmenu', { button: 2, bubbles: true });
    Object.defineProperty(event, 'target', { value: td });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    const ret = plugin.spec.props.handleDOMEvents.contextmenu(null, event);
    expect(ret).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalledWith(event);
  });

  it('returns false when not a right-click or not in a table', () => {
    const handleContextMenu = vi.fn();
    const ext = createTableRightClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const div = document.createElement('div');
    const event = new MouseEvent('contextmenu', { button: 0, bubbles: true });
    Object.defineProperty(event, 'target', { value: div });

    expect(plugin.spec.props.handleDOMEvents.contextmenu(null, event)).toBe(false);
    expect(handleContextMenu).not.toHaveBeenCalled();
  });

  it('does not call handler when right-clicking outside table', () => {
    const handleContextMenu = vi.fn();
    const ext = createTableRightClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const div = document.createElement('div');
    const event = new MouseEvent('contextmenu', { button: 2, bubbles: true });
    Object.defineProperty(event, 'target', { value: div });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    const ret = plugin.spec.props.handleDOMEvents.contextmenu(null, event);
    expect(ret).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(handleContextMenu).not.toHaveBeenCalled();
  });

  it('calls handler on right click on th element', () => {
    const handleContextMenu = vi.fn();
    const ext = createTableRightClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const th = document.createElement('th');
    const event = new MouseEvent('contextmenu', { button: 2, bubbles: true });
    Object.defineProperty(event, 'target', { value: th });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    const ret = plugin.spec.props.handleDOMEvents.contextmenu(null, event);
    expect(ret).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalledWith(event);
  });
});
