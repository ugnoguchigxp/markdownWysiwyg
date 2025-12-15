/**
 * TableContextMenu - Table operation context menu
 */

import type React from 'react';
import { I18N_KEYS } from '../types/index';
import { useI18n } from '../i18n/I18nContext';

export interface ITableContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAddRowAbove: () => void;
  onAddRowBelow: () => void;
  onAddColumnBefore: () => void;
  onAddColumnAfter: () => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onDeleteTable: () => void;
}

export const TableContextMenu: React.FC<ITableContextMenuProps> = ({
  isVisible,
  position,
  onClose,
  onAddRowAbove,
  onAddRowBelow,
  onAddColumnBefore,
  onAddColumnAfter,
  onDeleteRow,
  onDeleteColumn,
  onDeleteTable,
}) => {
  if (!isVisible) return null;

  const { t } = useI18n();

  return (
    <div
      className="table-context-menu fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-48 max-h-[400px] overflow-y-auto"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-1">
        {t(I18N_KEYS.table.rowOperations)}
      </div>

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onAddRowAbove();
          onClose();
        }}
      >
        <span className="text-blue-500">⬆️</span>
        {t(I18N_KEYS.table.addRowAbove)}
      </button>

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onAddRowBelow();
          onClose();
        }}
      >
        <span className="text-blue-500">⬇️</span>
        {t(I18N_KEYS.table.addRowBelow)}
      </button>

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
        onClick={() => {
          onDeleteRow();
          onClose();
        }}
      >
        <span className="text-red-500">🗑️</span>
        {t(I18N_KEYS.table.deleteRow)}
      </button>

      <div className="border-t border-gray-100 my-1" />

      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {t(I18N_KEYS.table.columnOperations)}
      </div>

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onAddColumnBefore();
          onClose();
        }}
      >
        <span className="text-green-500">⬅️</span>
        {t(I18N_KEYS.table.addColumnLeft)}
      </button>

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onAddColumnAfter();
          onClose();
        }}
      >
        <span className="text-green-500">➡️</span>
        {t(I18N_KEYS.table.addColumnRight)}
      </button>

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
        onClick={() => {
          onDeleteColumn();
          onClose();
        }}
      >
        <span className="text-red-500">🗑️</span>
        {t(I18N_KEYS.table.deleteColumn)}
      </button>

      <div className="border-t border-gray-100 my-1" />

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
        onClick={() => {
          onDeleteTable();
          onClose();
        }}
      >
        <span className="text-red-500">🗑️</span>
        {t(I18N_KEYS.table.deleteTable)}
      </button>

      <div className="border-t border-gray-100 my-1" />

      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-600"
        onClick={onClose}
      >
        {t(I18N_KEYS.table.cancel)}
      </button>
    </div>
  );
};
