import { useCallback, useEffect, useState } from 'react';

export interface LinkContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  linkData: { href: string; text: string } | null;
}

export interface TableContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
}

export const useEditorContextMenus = () => {
  const [linkContextMenu, setLinkContextMenu] = useState<LinkContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    linkData: null,
  });

  const [tableContextMenu, setTableContextMenu] = useState<TableContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  const handleLinkContextMenu = useCallback(
    (event: React.MouseEvent, linkData: { href: string; text: string }) => {
      event.preventDefault();
      event.stopPropagation();

      setLinkContextMenu({
        visible: true,
        position: { x: event.clientX, y: event.clientY },
        linkData,
      });
    },
    [],
  );

  const handleTableContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setTableContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleCloseLinkContextMenu = useCallback(() => {
    setLinkContextMenu({
      visible: false,
      position: { x: 0, y: 0 },
      linkData: null,
    });
  }, []);

  const handleCloseTableContextMenu = useCallback(() => {
    setTableContextMenu({
      visible: false,
      position: { x: 0, y: 0 },
    });
  }, []);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.table-context-menu')) {
        setTableContextMenu({
          visible: false,
          position: { x: 0, y: 0 },
        });
      }
      if (!target.closest('.link-context-menu')) {
        setLinkContextMenu({
          visible: false,
          position: { x: 0, y: 0 },
          linkData: null,
        });
      }
    };

    if (tableContextMenu.visible || linkContextMenu.visible) {
      document.addEventListener('click', handleGlobalClick);
      return () => document.removeEventListener('click', handleGlobalClick);
    }

    return undefined;
  }, [tableContextMenu.visible, linkContextMenu.visible]);

  return {
    linkContextMenu,
    tableContextMenu,
    handleLinkContextMenu,
    handleTableContextMenu,
    handleCloseLinkContextMenu,
    handleCloseTableContextMenu,
  };
};
