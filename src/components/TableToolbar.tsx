import type React from 'react';

import type { Editor } from '@tiptap/react';
import '@tiptap/extension-table';
import { ArrowLeft, Columns3, LayoutGrid, Minus, Plus, Rows3, Trash2 } from 'lucide-react';

import { I18N_KEYS } from '../types/index';
import { useI18n } from '../i18n/I18nContext';
import { createLogger } from '../utils/logger';

const log = createLogger('TableToolbar');

interface ITableToolbarProps {
  editor: Editor;
  visible: boolean;
  position: { x: number; y: number };
}

export const TableToolbar: React.FC<ITableToolbarProps> = ({ editor, visible, position }) => {
  if (!visible || !editor) return null;

  const { t } = useI18n();

  const insertRowAbove = () => {
    log.debug('🔧 TableToolbar: insertRowAbove command');
    try {
      editor.chain().focus().addRowBefore().run();
    } catch (error) {
      log.error('TableToolbar: insertRowAbove failed', error);
    }
  };

  const insertRowBelow = () => {
    log.debug('🔧 TableToolbar: insertRowBelow command');
    editor.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    log.debug('🔧 TableToolbar: deleteRow command');
    editor.chain().focus().deleteRow().run();
  };

  const insertColumnLeft = () => {
    log.debug('🔧 TableToolbar: insertColumnLeft command');
    editor.chain().focus().addColumnBefore().run();
  };

  const insertColumnRight = () => {
    log.debug('🔧 TableToolbar: insertColumnRight command');
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    log.debug('🔧 TableToolbar: deleteColumn command');
    editor.chain().focus().deleteColumn().run();
  };

  const mergeCells = () => {
    log.debug('🔧 TableToolbar: mergeCells command');
    editor.chain().focus().mergeCells().run();
  };

  const splitCell = () => {
    log.debug('🔧 TableToolbar: splitCell command');
    editor.chain().focus().splitCell().run();
  };

  const toggleHeaderRow = () => {
    log.debug('🔧 TableToolbar: toggleHeaderRow command');
    editor.chain().focus().toggleHeaderRow().run();
  };

  const toggleHeaderColumn = () => {
    log.debug('🔧 TableToolbar: toggleHeaderColumn command');
    editor.chain().focus().toggleHeaderColumn().run();
  };

  const deleteTable = () => {
    log.debug('🔧 TableToolbar: deleteTable command');
    if (
      typeof window !== 'undefined' &&
      window.confirm &&
      window.confirm(t(I18N_KEYS.tableToolbar.confirmDeleteTable))
    ) {
      editor.chain().focus().deleteTable().run();
    }
  };

  const buttonClass =
    'p-1.5 border border-gray-300 rounded bg-white cursor-pointer flex items-center justify-center text-xs text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:border-gray-400';
  const deleteButtonClass =
    'p-1.5 border border-gray-300 rounded bg-white cursor-pointer flex items-center justify-center text-xs text-gray-700 transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600';
  const actionButtonClass =
    'p-1.5 border border-gray-300 rounded bg-white cursor-pointer flex items-center justify-center text-xs text-gray-700 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300';
  const separatorClass = 'w-px h-6 bg-gray-300 mx-1';

  return (
    <div
      className="table-toolbar absolute z-[1000] bg-white border border-gray-200 rounded-lg p-2 shadow-lg flex gap-1 items-center min-w-[400px]"
      style={{
        left: position.x,
        top: position.y - 60,
      }}
    >
      {/* Row operations */}
      <button
        type="button"
        className={buttonClass}
        onClick={insertRowAbove}
        title={t(I18N_KEYS.tableToolbar.insertRowAbove)}
      >
        <Rows3 className="mr-1 w-3 h-3" />
        <Plus className="w-2 h-2" />↑
      </button>

      <button
        type="button"
        className={buttonClass}
        onClick={insertRowBelow}
        title={t(I18N_KEYS.tableToolbar.insertRowBelow)}
      >
        <Rows3 className="mr-1 w-3 h-3" />
        <Plus className="w-2 h-2" />↓
      </button>

      <button
        type="button"
        className={deleteButtonClass}
        onClick={deleteRow}
        title={t(I18N_KEYS.tableToolbar.deleteRow)}
      >
        <Rows3 className="mr-1 w-3 h-3" />
        <Minus className="w-2 h-2" />
      </button>

      <div className={separatorClass} />

      {/* Column operations */}
      <button
        type="button"
        className={buttonClass}
        onClick={insertColumnLeft}
        title={t(I18N_KEYS.tableToolbar.insertColumnLeft)}
      >
        <ArrowLeft className="mr-1 w-3 h-3" />
        <Plus className="w-2 h-2" />
        <Columns3 className="ml-1 w-3 h-3" />
      </button>

      <button
        type="button"
        className={buttonClass}
        onClick={insertColumnRight}
        title={t(I18N_KEYS.tableToolbar.insertColumnRight)}
      >
        <Columns3 className="mr-1 w-3 h-3" />
        <Plus className="w-2 h-2" />→
      </button>

      <button
        type="button"
        className={deleteButtonClass}
        onClick={deleteColumn}
        title={t(I18N_KEYS.tableToolbar.deleteColumn)}
      >
        <Columns3 className="mr-1 w-3 h-3" />
        <Minus className="w-2 h-2" />
      </button>

      <div className={separatorClass} />

      {/* Cell operations */}
      <button
        type="button"
        className={actionButtonClass}
        onClick={mergeCells}
        title={t(I18N_KEYS.tableToolbar.mergeCells)}
      >
        <LayoutGrid className="w-3 h-3" />
      </button>

      <button
        type="button"
        className={actionButtonClass}
        onClick={splitCell}
        title={t(I18N_KEYS.tableToolbar.splitCell)}
      >
        <LayoutGrid className="w-3 h-3" />
      </button>

      <div className={separatorClass} />

      {/* Header toggle operations */}
      <button
        type="button"
        className={`${buttonClass} hover:bg-yellow-50 hover:border-yellow-300`}
        onClick={toggleHeaderRow}
        title={t(I18N_KEYS.tableToolbar.toggleHeaderRow)}
      >
        {t(I18N_KEYS.tableToolbar.headerRow)}
      </button>

      <button
        type="button"
        className={`${buttonClass} hover:bg-yellow-50 hover:border-yellow-300`}
        onClick={toggleHeaderColumn}
        title={t(I18N_KEYS.tableToolbar.toggleHeaderColumn)}
      >
        {t(I18N_KEYS.tableToolbar.headerColumn)}
      </button>

      <div className={separatorClass} />

      {/* Delete table */}
      <button
        type="button"
        className={deleteButtonClass}
        onClick={deleteTable}
        title={t(I18N_KEYS.tableToolbar.deleteTable)}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export default TableToolbar;
