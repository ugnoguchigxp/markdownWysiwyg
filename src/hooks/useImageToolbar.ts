import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useState } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('useImageToolbar');

interface IImageToolbarState {
  visible: boolean;
  position: { x: number; y: number };
  imageElement: HTMLImageElement | null;
}

export const useImageToolbar = (editor: Editor | null) => {
  const [toolbarState, setToolbarState] = useState<IImageToolbarState>({
    visible: false,
    position: { x: 0, y: 0 },
    imageElement: null,
  });

  const checkImageSelection = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;

    // Check if an image is selected
    // Images are typically NodeSelections
    let imageNode = null;
    let imagePos: number | null = null;

    if (selection.from === selection.to) {
      // Text selection - likely not an image unless we scan specifically
      // But for NodeSelection (standard for images), from != to usually, or specifically it's a NodeSelection
      // TipTap Image extension usually creates a NodeSelection when clicked
    }

    if (state.selection.toJSON().type === 'node') {
      // Simple check for NodeSelection
      const node = state.doc.nodeAt(selection.from);
      if (node && node.type.name === 'image') {
        imageNode = node;
        imagePos = selection.from;
      }
    }

    if (imageNode && imagePos !== null) {
      // Find the DOM element
      // TipTap doesn't give direct access to the DOM node from the node object easily without a NodeView
      // But we can find it via coordsAtPos or searching the DOM
      const view = editor.view;
      const dom = view.nodeDOM(imagePos) as HTMLElement;

      // If the nodeDOM is the imageWrapper (depending on extension), we might need to find the img inside
      // Or if checking strictly 'img' tag

      let targetElement = dom;
      if (dom && dom.tagName !== 'IMG') {
        const img = dom.querySelector('img');
        if (img) targetElement = img;
      }

      if (targetElement) {
        setToolbarState((prev) => {
          // Avoid redundant updates
          if (prev.visible && prev.imageElement === (targetElement as HTMLImageElement))
            return prev;

          const rect = targetElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

          return {
            visible: true,
            position: {
              x: rect.left + scrollLeft,
              y: rect.top + scrollTop,
            },
            imageElement: targetElement as HTMLImageElement,
          };
        });
        return;
      }
    }

    // Hide if no image selected
    setToolbarState((prev) =>
      prev.visible ? { visible: false, position: prev.position, imageElement: null } : prev,
    );
  }, [editor]);

  useEffect(() => {
    if (!editor || typeof editor.on !== 'function') return;

    const handleSelectionUpdate = () => {
      checkImageSelection();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      if (typeof editor.off === 'function') {
        editor.off('selectionUpdate', handleSelectionUpdate);
      }
    };
  }, [editor, checkImageSelection]);

  // Handle scroll/resize to update position
  useEffect(() => {
    if (!toolbarState.visible || !toolbarState.imageElement) return;

    const updatePosition = () => {
      if (toolbarState.imageElement) {
        const rect = toolbarState.imageElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        setToolbarState((prev) => ({
          ...prev,
          position: {
            x: rect.left + scrollLeft,
            y: rect.top + scrollTop,
          },
        }));
      }
    };

    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [toolbarState.visible, toolbarState.imageElement]);

  // Click outside to hide
  useEffect(() => {
    if (!toolbarState.visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target && typeof target.closest === 'function' && target.closest('.image-toolbar'))
        return; // Clicked on toolbar
      // If clicked on the image itself, keep it (dealt with by selection update)
      // Actually selection update handles logic mostly.
      // If we click outside, selection changes, so checkImageSelection should hide it.
      // TableToolbar had strict click outside logic because table selection is sticky differently.
      // For images, if I click outside, selection moves to text paragraph, so it should auto hide.
      // But let's keep it simple.
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [toolbarState.visible]);

  return {
    visible: toolbarState.visible,
    position: toolbarState.position,
  };
};
