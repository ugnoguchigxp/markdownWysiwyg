/**
 * useFloatingToolbar - Hook for managing floating toolbar position and visibility
 *
 * This hook calculates the position for a floating toolbar that appears
 * above the current text selection in the editor.
 */
import { useCallback, useEffect, useState } from 'react';

import type { Editor } from '@tiptap/react';

export interface FloatingToolbarPosition {
  top: number;
  left: number;
}

export interface UseFloatingToolbarReturn {
  visible: boolean;
  position: FloatingToolbarPosition;
}

/**
 * Hook for managing floating toolbar visibility and position
 *
 * @param editor - TipTap editor instance
 * @param editorElementRef - Ref to the editor container element
 * @param enabled - Whether floating toolbar is enabled
 * @returns Object containing visibility state and position
 */
export function useFloatingToolbar(
  editor: Editor | null,
  editorElementRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
): UseFloatingToolbarReturn {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<FloatingToolbarPosition>({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!editor || !enabled || !editorElementRef.current) {
      setVisible(false);
      return;
    }

    // Check if editor is focused
    if (!editor.isFocused) {
      setVisible(false);
      return;
    }

    const { state, view } = editor;
    const { selection } = state;

    try {
      // Get the DOM coordinates of the cursor/selection
      const { from, to } = selection;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      // Get the editor container's bounding rect
      const editorRect = editorElementRef.current.getBoundingClientRect();

      // Calculate the center of the selection (or cursor position if no selection)
      const selectionCenterX = selection.empty ? start.left : (start.left + end.right) / 2;

      // Toolbar dimensions (approximate)
      const toolbarOffset = 8; // pixels above selection
      const estimatedToolbarHeight = 44; // approximate toolbar height
      const estimatedToolbarWidth = 500; // approximate toolbar width

      // Calculate position relative to the editor container
      let top = start.top - editorRect.top - estimatedToolbarHeight - toolbarOffset;
      let left = selectionCenterX - editorRect.left;

      // Ensure toolbar doesn't go above editor - if so, show below selection
      if (top < 0) {
        top = end.bottom - editorRect.top + toolbarOffset;
      }

      // Ensure toolbar doesn't go too far left (account for centering with -translate-x-1/2)
      const halfToolbarWidth = estimatedToolbarWidth / 2;
      const minLeft = halfToolbarWidth;
      const maxLeft = editorRect.width - halfToolbarWidth;

      left = Math.max(minLeft, Math.min(left, maxLeft));

      setPosition({ top, left });
      setVisible(true);
    } catch {
      // If position calculation fails, hide the toolbar
      setVisible(false);
    }
  }, [editor, enabled, editorElementRef]);

  // Update position on selection change and focus
  useEffect(() => {
    if (!editor || !enabled) {
      setVisible(false);
      return;
    }

    let blurTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Listen to selection updates
    const handleSelectionUpdate = () => {
      // Cancel any pending blur
      if (blurTimeoutId) {
        clearTimeout(blurTimeoutId);
        blurTimeoutId = null;
      }
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        updatePosition();
      });
    };

    const handleFocus = () => {
      // Cancel any pending blur
      if (blurTimeoutId) {
        clearTimeout(blurTimeoutId);
        blurTimeoutId = null;
      }
      requestAnimationFrame(() => {
        updatePosition();
      });
    };

    const handleBlur = () => {
      // Delay hiding to allow toolbar clicks to complete
      // The toolbar uses preventDefault on mousedown, so focus should return quickly
      blurTimeoutId = setTimeout(() => {
        setVisible(false);
      }, 150);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('focus', handleFocus);
    editor.on('blur', handleBlur);

    return () => {
      if (blurTimeoutId) {
        clearTimeout(blurTimeoutId);
      }
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('focus', handleFocus);
      editor.off('blur', handleBlur);
    };
  }, [editor, enabled, updatePosition]);

  // Also update on scroll within editor
  useEffect(() => {
    if (!enabled || !editorElementRef.current) return;

    const handleScroll = () => {
      if (visible) {
        updatePosition();
      }
    };

    const editorElement = editorElementRef.current;
    editorElement.addEventListener('scroll', handleScroll, true);

    return () => {
      editorElement.removeEventListener('scroll', handleScroll, true);
    };
  }, [enabled, editorElementRef, visible, updatePosition]);

  return { visible, position };
}
