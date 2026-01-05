import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock @tiptap/core partly
vi.mock('@tiptap/core', async (importOriginal) => {
  // biome-ignore lint/suspicious/noExplicitAny: Mock type
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getMarkRange: vi.fn().mockReturnValue({ from: 10, to: 20 }),
  };
});

import { createLinkClickExtension } from '../../src/extensions/LinkClickExtension';

// biome-ignore lint/suspicious/noExplicitAny: Mock type
type DomEventHandler = (view: any, event: MouseEvent) => boolean;

type PluginLike = {
  spec: {
    props: {
      handleDOMEvents: {
        contextmenu: DomEventHandler;
        click: DomEventHandler;
      };
    };
  };
};

type ExtensionWithPlugins = {
  config: {
    addProseMirrorPlugins: () => PluginLike[];
  };
};

const mockView = {
  posAtDOM: vi.fn().mockReturnValue(10),
  state: {
    doc: {
      resolve: vi.fn().mockReturnValue({}),
    },
    schema: {
      marks: {
        link: {},
      },
    },
  },
};

describe('LinkClickExtension', () => {
  it('invokes handler on contextmenu for links with href', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', 'https://example.com');
    a.textContent = 'Example';

    const event = new MouseEvent('contextmenu', { bubbles: true });
    Object.defineProperty(event, 'target', { value: a });

    const ret = plugin.spec.props.handleDOMEvents.contextmenu(mockView, event);
    expect(ret).toBe(true);
    // getMarkRange mock returns { from: 10, to: 20 }
    expect(handleContextMenu).toHaveBeenCalledWith(event, {
      href: 'https://example.com',
      text: 'Example',
      from: 10,
      to: 20,
    });
  });

  it('prevents default and stops propagation on click for links with href', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', '/local');
    a.textContent = 'Local';

    const event = new MouseEvent('click', {
      bubbles: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    });
    Object.defineProperty(event, 'target', { value: a });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    // Reset mockView calls if needed
    mockView.posAtDOM.mockClear();

    const ret = plugin.spec.props.handleDOMEvents.click(mockView, event);
    expect(ret).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalledWith(event, {
      href: '/local',
      text: 'Local',
      from: 10,
      to: 20,
    });
  });

  it('returns false when clicked element is not a link', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const div = document.createElement('div');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });

    expect(plugin.spec.props.handleDOMEvents.click(mockView, event)).toBe(false);
    expect(plugin.spec.props.handleDOMEvents.contextmenu(mockView, event)).toBe(false);
  });

  it('returns false for contextmenu when link has no href', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.textContent = 'No href link';

    const event = new MouseEvent('contextmenu', { bubbles: true });
    Object.defineProperty(event, 'target', { value: a });

    expect(plugin.spec.props.handleDOMEvents.contextmenu(mockView, event)).toBe(false);
    expect(handleContextMenu).not.toHaveBeenCalled();
  });

  it('returns false for click when link has no href', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', '');
    a.textContent = 'Empty href link';

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: a });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    expect(plugin.spec.props.handleDOMEvents.click(mockView, event)).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
    expect(handleContextMenu).not.toHaveBeenCalled();
  });

  it('handles click on link with empty href attribute', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', '');
    a.textContent = 'Empty href link';

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: a });

    expect(plugin.spec.props.handleDOMEvents.click(mockView, event)).toBe(false);
    expect(handleContextMenu).not.toHaveBeenCalled();
  });

  it('handles click with modifier keys', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', 'https://example.com');
    a.textContent = 'Link';

    const event = new MouseEvent('click', {
      bubbles: true,
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
    });
    Object.defineProperty(event, 'target', { value: a });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    expect(plugin.spec.props.handleDOMEvents.click(mockView, event)).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalledWith(event, {
      href: 'https://example.com',
      text: 'Link',
      from: 10,
      to: 20,
    });
  });

  it('handles click with shift key modifier', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', 'https://example.com');
    a.textContent = 'Link';

    const event = new MouseEvent('click', {
      bubbles: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
    });
    Object.defineProperty(event, 'target', { value: a });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    expect(plugin.spec.props.handleDOMEvents.click(mockView, event)).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalledWith(event, {
      href: 'https://example.com',
      text: 'Link',
      from: 10,
      to: 20,
    });
  });

  it('handles contextmenu with different href values', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const hrefs = ['http://example.com', 'https://example.com', 'mailto:test@example.com'];

    for (const href of hrefs) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = 'Test';

      const event = new MouseEvent('contextmenu', { bubbles: true });
      Object.defineProperty(event, 'target', { value: a });

      expect(plugin.spec.props.handleDOMEvents.contextmenu(mockView, event)).toBe(true);
      expect(handleContextMenu).toHaveBeenCalledWith(event, {
        href,
        text: 'Test',
        from: 10,
        to: 20,
      });
      handleContextMenu.mockClear();
    }
  });

  it('handles contextmenu with empty text content', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', 'https://example.com');
    a.textContent = '';

    const event = new MouseEvent('contextmenu', { bubbles: true });
    Object.defineProperty(event, 'target', { value: a });

    expect(plugin.spec.props.handleDOMEvents.contextmenu(mockView, event)).toBe(true);
    expect(handleContextMenu).toHaveBeenCalledWith(event, {
      href: 'https://example.com',
      text: '',
      from: 10,
      to: 20,
    });
  });

  it('handles contextmenu with link containing special characters', () => {
    const handleContextMenu = vi.fn();
    const ext = createLinkClickExtension(handleContextMenu);
    const plugin = (ext as unknown as ExtensionWithPlugins).config.addProseMirrorPlugins()[0];

    const a = document.createElement('a');
    a.setAttribute('href', 'https://example.com/test?param=value');
    a.textContent = 'Test &lt;Link&gt;';

    const event = new MouseEvent('contextmenu', { bubbles: true });
    Object.defineProperty(event, 'target', { value: a });

    expect(plugin.spec.props.handleDOMEvents.contextmenu(mockView, event)).toBe(true);
    expect(handleContextMenu).toHaveBeenCalledWith(event, {
      href: 'https://example.com/test?param=value',
      text: 'Test &lt;Link&gt;',
      from: 10,
      to: 20,
    });
  });
});
