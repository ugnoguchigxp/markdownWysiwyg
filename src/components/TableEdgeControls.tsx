import type React from 'react';
import { useEffect, useState } from 'react';

import type { Editor } from '@tiptap/react';
import '@tiptap/extension-table';
import { createPortal } from 'react-dom';

import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS } from '../types/index';

export interface ITableEdgeControlsProps {
  editor: Editor | null;
}

/**
 * TableEdgeControls - Control elements displayed around tables using React Portal
 * Uses React Portal to show row/column add buttons outside of the table
 */
export const TableEdgeControls: React.FC<ITableEdgeControlsProps> = ({ editor }) => {
  const { t } = useI18n();
  const [hoveredTable, setHoveredTable] = useState<HTMLElement | null>(null);
  const [controlPosition, setControlPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleTableHover = (e: MouseEvent) => {
      const table = (e.target as HTMLElement).closest('table');
      if (table && table !== hoveredTable) {
        // Target only TipTap enhanced tables
        const wrapper = table.closest('.tiptap-table-enhanced');
        if (wrapper) {
          setHoveredTable(table);
          const rect = table.getBoundingClientRect();
          setControlPosition({
            x: rect.right + 8,
            y: rect.top + window.scrollY,
          });
        }
      } else if (!table) {
        setHoveredTable(null);
        setControlPosition(null);
      }
    };

    const handleTableLeave = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (
        !relatedTarget ||
        (!relatedTarget.closest('table') && !relatedTarget.closest('.table-edge-controls'))
      ) {
        setHoveredTable(null);
        setControlPosition(null);
      }
    };

    document.addEventListener('mouseover', handleTableHover);
    document.addEventListener('mouseout', handleTableLeave);

    return () => {
      document.removeEventListener('mouseover', handleTableHover);
      document.removeEventListener('mouseout', handleTableLeave);
    };
  }, [editor, hoveredTable]);

  if (!editor || !controlPosition || !hoveredTable) return null;

  const handleAddRowAbove = () => {
    editor.chain().focus().addRowBefore().run();
  };

  const handleAddRowBelow = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const handleAddColumnLeft = () => {
    editor.chain().focus().addColumnBefore().run();
  };

  const handleAddColumnRight = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  return createPortal(
    <div
      className="table-edge-controls bg-popover shadow-lg border border-border rounded-lg p-2 flex flex-col gap-1 fixed z-50 min-w-[140px]"
      style={{
        left: controlPosition.x,
        top: controlPosition.y,
      }}
      onMouseEnter={() => {
        // Keep table hover state when hovering over Portal
      }}
      onMouseLeave={() => {
        setHoveredTable(null);
        setControlPosition(null);
      }}
    >
      <button
        type="button"
        className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors duration-150 text-left"
        onClick={handleAddRowAbove}
        title={t(I18N_KEYS.tableEdgeControls.addRowAbove)}
      >
        {t(I18N_KEYS.tableEdgeControls.addRowAbove)}
      </button>
      <button
        type="button"
        className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors duration-150 text-left"
        onClick={handleAddRowBelow}
        title={t(I18N_KEYS.tableEdgeControls.addRowBelow)}
      >
        {t(I18N_KEYS.tableEdgeControls.addRowBelow)}
      </button>
      <button
        type="button"
        className="text-xs px-2 py-1 bg-accent hover:bg-accent/80 text-accent-foreground rounded transition-colors duration-150 text-left"
        onClick={handleAddColumnLeft}
        title={t(I18N_KEYS.tableEdgeControls.addColumnLeft)}
      >
        {t(I18N_KEYS.tableEdgeControls.addColumnLeft)}
      </button>
      <button
        type="button"
        className="text-xs px-2 py-1 bg-accent hover:bg-accent/80 text-accent-foreground rounded transition-colors duration-150 text-left"
        onClick={handleAddColumnRight}
        title={t(I18N_KEYS.tableEdgeControls.addColumnRight)}
      >
        {t(I18N_KEYS.tableEdgeControls.addColumnRight)}
      </button>
    </div>,
    document.body,
  );
};
