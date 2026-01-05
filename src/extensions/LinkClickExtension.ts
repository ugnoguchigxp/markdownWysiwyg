import { Extension, getMarkRange } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import type React from 'react';

import { createLogger } from '../utils/logger';

const logger = createLogger('LinkClickExtension');

export const createLinkClickExtension = (
  handleContextMenu: (
    event: React.MouseEvent,
    linkData: { href: string; text: string; from: number; to: number },
  ) => void,
) =>
  Extension.create({
    name: 'linkClick',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('linkClick'),
          props: {
            handleDOMEvents: {
              contextmenu: (view, event) => {
                const target = event.target as HTMLElement;
                const linkElement = target.closest('a[href]') as HTMLAnchorElement;

                if (linkElement) {
                  const href = linkElement.getAttribute('href') || '';
                  const text = linkElement.textContent || '';

                  // Calculate position
                  const pos = view.posAtDOM(linkElement, 0);
                  if (pos < 0) return false;

                  const $pos = view.state.doc.resolve(pos);
                  const markRange = getMarkRange($pos, view.state.schema.marks.link, { href });
                  const from = markRange?.from ?? pos;
                  const to = markRange?.to ?? pos + text.length;

                  logger.debug('🔗 Link right-clicked:', { href, text, from, to });

                  if (href) {
                    handleContextMenu(event as unknown as React.MouseEvent, {
                      href,
                      text,
                      from,
                      to,
                    });
                    return true;
                  }
                }
                return false;
              },
              click: (view, event) => {
                const target = event.target as HTMLElement;
                const linkElement = target.closest('a[href]') as HTMLAnchorElement;

                // Log click event
                if (linkElement) {
                  const href = linkElement.getAttribute('href') || '';
                  const text = linkElement.textContent || '';

                  // Calculate position
                  const pos = view.posAtDOM(linkElement, 0);
                  if (pos < 0) return false;

                  const $pos = view.state.doc.resolve(pos);
                  const markRange = getMarkRange($pos, view.state.schema.marks.link, { href });
                  const from = markRange?.from ?? pos;
                  const to = markRange?.to ?? pos + text.length;

                  logger.debug('🔗 Link clicked:', {
                    href,
                    text,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    shiftKey: event.shiftKey,
                    from,
                    to,
                  });

                  // Show context menu on Ctrl/Cmd+click or simple left click
                  if (href) {
                    event.preventDefault();
                    event.stopPropagation();
                    handleContextMenu(event as unknown as React.MouseEvent, {
                      href,
                      text,
                      from,
                      to,
                    });
                    return true;
                  }
                }
                return false;
              },
            },
          },
        }),
      ];
    },
  });
