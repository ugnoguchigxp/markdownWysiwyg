import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import type React from 'react';

export const createTableRightClickExtension = (
  handleContextMenu: (event: React.MouseEvent) => void,
) =>
  Extension.create({
    name: 'tableRightClick',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('tableRightClick'),
          props: {
            handleDOMEvents: {
              contextmenu: (_, event) => {
                const target = event.target as HTMLElement;
                const tableElement = target.closest('table, th, td');

                if (tableElement && event.button === 2) {
                  event.preventDefault();
                  // Table right-click
                  handleContextMenu(event as unknown as React.MouseEvent);
                  return true;
                }
                return false;
              },
            },
          },
        }),
      ];
    },
  });
