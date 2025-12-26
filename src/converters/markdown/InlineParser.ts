import type { JSONContent } from '@tiptap/core';
import { v4 as uuidv4 } from 'uuid';
import { normalizeImageSrcOrNull, normalizeUrlOrNull } from '../../utils/security';

export interface MarkdownToTipTapOptions {
  publicImagePathPrefix?: string;
}

export class InlineParser {
  private readonly _instanceMarker = 0;

  private constructor() {
    // Intentionally empty.
  }

  static parseInline(text: string, options?: MarkdownToTipTapOptions): JSONContent[] {
    if (!text || !text.trim()) {
      return [];
    }

    const elements = new Map<string, { type: string; data: unknown }>();

    let result = text.replace(/`([^`]+)`/g, (_match, code) => {
      const id = uuidv4();
      const placeholder = `§CODE§${id}§`;
      elements.set(placeholder, { type: 'code', data: code });
      return placeholder;
    });

    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
      const id = uuidv4();
      const placeholder = `§IMAGE§${id}§`;
      elements.set(placeholder, { type: 'image', data: { alt, src } });
      return placeholder;
    });

    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, href) => {
      const id = uuidv4();
      const placeholder = `§LINK§${id}§`;
      elements.set(placeholder, { type: 'link', data: { text: linkText, href } });
      return placeholder;
    });

    result = result.replace(/~~(.+?)~~/g, (_match, content) => {
      const id = uuidv4();
      const placeholder = `§STRIKE§${id}§`;
      elements.set(placeholder, { type: 'strike', data: content });
      return placeholder;
    });

    result = result.replace(/\*\*(.+?)\*\*/g, (_match, content) => {
      const id = uuidv4();
      const placeholder = `§BOLD§${id}§`;
      elements.set(placeholder, { type: 'bold', data: content });
      return placeholder;
    });

    result = result.replace(/\*([^*]+?)\*/g, (_match, content) => {
      const id = uuidv4();
      const placeholder = `§ITALIC§${id}§`;
      elements.set(placeholder, { type: 'italic', data: content });
      return placeholder;
    });

    return InlineParser.convertToNodes(result, elements, options);
  }

  private static convertToNodes(
    text: string,
    elements: Map<string, { type: string; data: unknown }>,
    options?: MarkdownToTipTapOptions,
  ): JSONContent[] {
    const nodes: JSONContent[] = [];
    let current = '';
    let i = 0;

    while (i < text.length) {
      if (text[i] === '§') {
        if (current) {
          nodes.push({ type: 'text', text: current });
          current = '';
        }

        const endIndex = text.indexOf('§', i + 1);
        if (endIndex !== -1) {
          const secondEndIndex = text.indexOf('§', endIndex + 1);
          if (secondEndIndex !== -1) {
            const placeholder = text.substring(i, secondEndIndex + 1);
            const element = elements.get(placeholder);

            if (element) {
              switch (element.type) {
                case 'code':
                  nodes.push({
                    type: 'text',
                    marks: [{ type: 'code' }],
                    text: element.data as string,
                  });
                  break;

                case 'link': {
                  const linkData = element.data as { text: string; href: string };
                  const safeHref = normalizeUrlOrNull(linkData.href);

                  if (!safeHref) {
                    nodes.push({
                      type: 'text',
                      text: `${linkData.text} (${linkData.href})`,
                    });
                    break;
                  }
                  nodes.push({
                    type: 'text',
                    marks: [
                      {
                        type: 'link',
                        attrs: {
                          href: safeHref,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        },
                      },
                    ],
                    text: linkData.text,
                  });
                  break;
                }

                case 'image': {
                  const imageData = element.data as { alt: string; src: string };
                  const safeSrc = normalizeImageSrcOrNull(imageData.src, {
                    publicPathPrefix: options?.publicImagePathPrefix,
                  });

                  if (!safeSrc) {
                    nodes.push({
                      type: 'text',
                      text: `![${imageData.alt}](${imageData.src})`,
                    });
                    break;
                  }
                  nodes.push({
                    type: 'image',
                    attrs: { src: safeSrc, alt: imageData.alt },
                  });
                  break;
                }

                case 'bold':
                case 'italic':
                case 'strike': {
                  const nestedNodes = InlineParser.parseInline(element.data as string, options);
                  for (const node of nestedNodes) {
                    if (node.type === 'text') {
                      const marks = node.marks ? [...node.marks] : [];
                      marks.unshift({ type: element.type });
                      nodes.push({ ...node, marks });
                    } else {
                      nodes.push(node);
                    }
                  }
                  break;
                }
              }
            } else {
              nodes.push({ type: 'text', text: placeholder });
            }

            i = secondEndIndex + 1;
            continue;
          }
        }
      }

      current += text[i];
      i++;
    }

    if (current) {
      nodes.push({ type: 'text', text: current });
    }

    return nodes.filter((node) => node.type !== 'text' || (node.text && node.text.length > 0));
  }
}
