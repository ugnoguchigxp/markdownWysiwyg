import React from 'react';

import { Editor } from '@tiptap/react';
import '@tiptap/extension-table';
import { Plus, Minus, Columns3, LayoutGrid, Rows3, Trash2, ArrowLeft } from 'lucide-react';

import { createLogger } from '../utils/logger';

const log = createLogger('TableToolbar');

interface ITableToolbarProps {
  editor: Editor;
  visible: boolean;
  position: { x: number; y: number };
}

export const TableToolbar: React.FC<ITableToolbarProps> = ({
  editor,
  visible,
  position
}) => {
  if (!visible || !editor) return null;

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
    if (typeof window !== 'undefined' && window.confirm && window.confirm('Delete table?')) {
      editor.chain().focus().deleteTable().run();
    }
  };

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y - 60,
    zIndex: 1000,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    minWidth: '400px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#374151',
    transition: 'all 0.2s ease'
  };

  const separatorStyle: React.CSSProperties = {
    width: '1px',
    height: '24px',
    backgroundColor: '#d1d5db',
    margin: '0 4px'
  };

  return (
    <div style={toolbarStyle} className="table-toolbar">
      {/* Row operations */}
      <button
        style={buttonStyle}
        onClick={insertRowAbove}
        title="Insert row above"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#9ca3af';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <Rows3 style={{ marginRight: '4px', fontSize: '10px' }} />
        <Plus style={{ fontSize: '8px' }} />
        ↑
      </button>

      <button
        style={buttonStyle}
        onClick={insertRowBelow}
        title="Insert row below"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#9ca3af';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <Rows3 style={{ marginRight: '4px', fontSize: '10px' }} />
        <Plus style={{ fontSize: '8px' }} />
        ↓
      </button>

      <button
        style={buttonStyle}
        onClick={deleteRow}
        title="Delete row"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
          e.currentTarget.style.borderColor = '#fca5a5';
          e.currentTarget.style.color = '#dc2626';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.color = '#374151';
        }}
      >
        <Rows3 style={{ marginRight: '4px', fontSize: '10px' }} />
        <Minus style={{ fontSize: '8px' }} />
      </button>

      <div style={separatorStyle} />

      {/* Column operations */}
      <button
        style={buttonStyle}
        onClick={insertColumnLeft}
        title="Insert column left"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#9ca3af';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <ArrowLeft style={{ marginRight: '4px', fontSize: '10px' }} />
        <Plus style={{ fontSize: '8px' }} />
        <Columns3 style={{ marginLeft: '4px', fontSize: '10px' }} />
      </button>

      <button
        style={buttonStyle}
        onClick={insertColumnRight}
        title="Insert column right"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#9ca3af';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <Columns3 style={{ marginRight: '4px', fontSize: '10px' }} />
        <Plus style={{ fontSize: '8px' }} />
        →
      </button>

      <button
        style={buttonStyle}
        onClick={deleteColumn}
        title="Delete column"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
          e.currentTarget.style.borderColor = '#fca5a5';
          e.currentTarget.style.color = '#dc2626';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.color = '#374151';
        }}
      >
        <Columns3 style={{ marginRight: '4px', fontSize: '10px' }} />
        <Minus style={{ fontSize: '8px' }} />
      </button>

      <div style={separatorStyle} />

      {/* Cell operations */}
      <button
        style={buttonStyle}
        onClick={mergeCells}
        title="Merge cells"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          e.currentTarget.style.borderColor = '#7dd3fc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <LayoutGrid style={{ fontSize: '10px' }} />
      </button>

      <button
        style={buttonStyle}
        onClick={splitCell}
        title="Split cell"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          e.currentTarget.style.borderColor = '#7dd3fc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <LayoutGrid style={{ fontSize: '10px' }} />
      </button>

      <div style={separatorStyle} />

      {/* Header toggle operations */}
      <button
        style={buttonStyle}
        onClick={toggleHeaderRow}
        title="Toggle header row"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fefce8';
          e.currentTarget.style.borderColor = '#fde047';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        H-Row
      </button>

      <button
        style={buttonStyle}
        onClick={toggleHeaderColumn}
        title="Toggle header column"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fefce8';
          e.currentTarget.style.borderColor = '#fde047';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        H-Col
      </button>

      <div style={separatorStyle} />

      {/* Delete table */}
      <button
        style={buttonStyle}
        onClick={deleteTable}
        title="Delete table"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
          e.currentTarget.style.borderColor = '#fca5a5';
          e.currentTarget.style.color = '#dc2626';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.color = '#374151';
        }}
      >
        <Trash2 style={{ fontSize: '10px' }} />
      </button>
    </div>
  );
};

export default TableToolbar;
