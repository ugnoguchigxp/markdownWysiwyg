import Image from '@tiptap/extension-image';

export type ImageAlign = 'left' | 'center' | 'right';
export type ImageFloat = 'left' | 'right' | 'none';

// Extend the default Image extension to support layout attributes
export const ImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        renderHTML: () => false, // Handled in renderHTML override
        parseHTML: (element) => element.style.width || element.getAttribute('width'),
      },
      align: {
        default: 'center',
        renderHTML: () => false, // Handled in renderHTML override
        parseHTML: (element) => {
          const style = element.getAttribute('style') || '';
          if (style.includes('margin-right: auto') && !style.includes('margin-left: auto'))
            return 'left';
          if (style.includes('margin-left: auto') && !style.includes('margin-right: auto'))
            return 'right';
          return 'center';
        },
      },
      float: {
        default: 'none',
        renderHTML: () => false, // Handled in renderHTML override
        parseHTML: (element) => {
          const style = element.getAttribute('style') || '';
          if (style.includes('float: left')) return 'left';
          if (style.includes('float: right')) return 'right';
          return 'none';
        },
      },
    };
  },

  // Override renderHTML to combine styles cleanly
  renderHTML({ HTMLAttributes, node }) {
    // Filter out our custom attributes from HTMLAttributes to avoid redundancy
    const { style, width: _w, align: _a, float: _f, ...rest } = HTMLAttributes;

    const align = node.attrs.align || 'center';
    const float = node.attrs.float || 'none';
    const width = node.attrs.width;

    let styleString = '';

    // Handle float - float always overrides align
    if (float === 'left') {
      styleString += 'float: left; margin-right: 1.5rem; margin-bottom: 0.5rem; ';
    } else if (float === 'right') {
      styleString += 'float: right; margin-left: 1.5rem; margin-bottom: 0.5rem; ';
    } else {
      // Alignment styles (only if not floating)
      styleString += 'display: block; ';
      if (align === 'left') {
        styleString += 'margin-right: auto; ';
      } else if (align === 'right') {
        styleString += 'margin-left: auto; ';
      } else {
        styleString += 'margin-left: auto; margin-right: auto; ';
      }
    }

    // Apply width
    if (width === '150px') {
      styleString += 'max-width: 150px; max-height: 150px; width: auto; height: auto; ';
    } else if (width) {
      styleString += `width: ${width}; `;
    } else {
      styleString += 'width: auto; ';
    }

    return [
      'img',
      {
        ...this.options.HTMLAttributes,
        ...rest,
        style: styleString.trim(),
      },
    ];
  },
});
