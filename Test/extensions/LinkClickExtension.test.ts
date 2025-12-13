import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

import { createLinkClickExtension } from '../../src/extensions/LinkClickExtension';

describe('LinkClickExtension', () => {
  it('invokes handler on contextmenu for links with href', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as any).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', 'https://example.com');
    a.textContent = 'Example';

    const event = {
      target: a,
    } as any;

    const ret = plugin.spec.props.handleDOMEvents.contextmenu(null, event);
    expect(ret).toBe(true);
    expect(handleContextMenu).toHaveBeenCalledWith(event, {
      href: 'https://example.com',
      text: 'Example',
    });
  });

  it('prevents default and stops propagation on click for links with href', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as any).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', '/local');
    a.textContent = 'Local';

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    const event = {
      target: a,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault,
      stopPropagation,
    } as any;

    const ret = plugin.spec.props.handleDOMEvents.click(null, event);
    expect(ret).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalledWith(event, { href: '/local', text: 'Local' });
  });

  it('returns false when clicked element is not a link', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as any).config.addProseMirrorPlugins()[0];

    const div = document.createElement('div');
    const event = {
      target: div,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    expect(plugin.spec.props.handleDOMEvents.click(null, event)).toBe(false);
    expect(plugin.spec.props.handleDOMEvents.contextmenu(null, event)).toBe(false);
  });
});
