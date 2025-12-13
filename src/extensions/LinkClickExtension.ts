import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import type React from 'react';

import { createLogger } from '../utils/logger';

const logger = createLogger('LinkClickExtension');

export const createLinkClickExtension = (
  handleContextMenu: (event: React.MouseEvent, linkData: { href: string; text: string }) => void,
) =>
  Extension.create({
    name: 'linkClick',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('linkClick'),
          props: {
            handleDOMEvents: {
              contextmenu: (_, event) => {
                const target = event.target as HTMLElement;
                const linkElement = target.closest('a[href]') as HTMLAnchorElement;

                if (linkElement) {
                  const href = linkElement.getAttribute('href') || '';
                  const text = linkElement.textContent || '';

                  logger.debug('🔗 Link right-clicked:', { href, text });

                  if (href) {
                    handleContextMenu(event as unknown as React.MouseEvent, { href, text });
                    return true;
                  }
                }
                return false;
              },
              click: (_, event) => {
                const target = event.target as HTMLElement;
                const linkElement = target.closest('a[href]') as HTMLAnchorElement;

                // Log click event
                if (linkElement) {
                  const href = linkElement.getAttribute('href') || '';
                  const text = linkElement.textContent || '';
                  logger.debug('🔗 Link clicked:', {
                    href,
                    text,
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    shiftKey: event.shiftKey,
                  });

                  // Show context menu on Ctrl/Cmd+click or simple left click
                  if (href) {
                    event.preventDefault();
                    event.stopPropagation();
                    handleContextMenu(event as unknown as React.MouseEvent, { href, text });
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
