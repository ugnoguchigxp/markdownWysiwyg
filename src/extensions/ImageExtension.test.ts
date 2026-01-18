import { describe, expect, it } from 'vitest';
import { ImageExtension } from './ImageExtension';

type ExtensionConfig = {
  config: {
    addAttributes: () => Record<string, unknown>;
    renderHTML: (options: {
      HTMLAttributes: Record<string, unknown>;
      node: { attrs: Record<string, unknown> };
    }) => [string, Record<string, unknown>];
  };
};

describe('ImageExtension', () => {
  it('parses custom attributes from HTML', () => {
    const extension = ImageExtension as unknown as ExtensionConfig;
    const attributes = extension.config.addAttributes.call({
      parent: () => ({ src: { default: null } }),
    });

    const align = attributes.align as {
      parseHTML: (element: HTMLElement) => string;
    };
    const float = attributes.float as {
      parseHTML: (element: HTMLElement) => string;
    };
    const width = attributes.width as {
      parseHTML: (element: HTMLElement) => string | null;
    };

    const leftAligned = document.createElement('img');
    leftAligned.setAttribute('style', 'margin-right: auto;');
    expect(align.parseHTML(leftAligned)).toBe('left');

    const rightAligned = document.createElement('img');
    rightAligned.setAttribute('style', 'margin-left: auto;');
    expect(align.parseHTML(rightAligned)).toBe('right');

    const floated = document.createElement('img');
    floated.setAttribute('style', 'float: left;');
    expect(float.parseHTML(floated)).toBe('left');

    const sized = document.createElement('img');
    sized.setAttribute('style', 'width: 240px;');
    expect(width.parseHTML(sized)).toBe('240px');

    const attrWidth = document.createElement('img');
    attrWidth.setAttribute('width', '180px');
    expect(width.parseHTML(attrWidth)).toBe('180px');
  });

  it('renders styles based on alignment, float, and width', () => {
    const extension = ImageExtension as unknown as ExtensionConfig;
    const renderHTML = extension.config.renderHTML;

    const [tag, attrs] = renderHTML.call(
      { options: { HTMLAttributes: { 'data-base': 'base' } } },
      {
        HTMLAttributes: { alt: 'Preview', width: '320px', align: 'left', float: 'none' },
        node: { attrs: { align: 'right', float: 'none', width: '150px' } },
      },
    );

    expect(tag).toBe('img');
    expect(attrs['data-base']).toBe('base');
    expect(attrs.alt).toBe('Preview');
    expect(attrs.width).toBeUndefined();
    expect(String(attrs.style)).toContain('display: block');
    expect(String(attrs.style)).toContain('margin-left: auto');
    expect(String(attrs.style)).toContain('max-width: 150px');
  });
});
