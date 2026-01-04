import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TableContextMenu } from '../../src/components/TableContextMenu';
import { I18N_KEYS } from '../../src/types/index';

describe('TableContextMenu', () => {
  it('returns null when not visible', () => {
    const { container } = render(
      <TableContextMenu
        isVisible={false}
        position={{ x: 0, y: 0 }}
        onClose={() => {}}
        onAddRowAbove={() => {}}
        onAddRowBelow={() => {}}
        onAddColumnBefore={() => {}}
        onAddColumnAfter={() => {}}
        onDeleteRow={() => {}}
        onDeleteColumn={() => {}}
        onDeleteTable={() => {}}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls handlers and closes on menu actions', () => {
    const onClose = vi.fn();
    const onAddRowAbove = vi.fn();
    const onAddRowBelow = vi.fn();
    const onAddColumnBefore = vi.fn();
    const onAddColumnAfter = vi.fn();
    const onDeleteRow = vi.fn();
    const onDeleteColumn = vi.fn();
    const onDeleteTable = vi.fn();

    render(
      <TableContextMenu
        isVisible={true}
        position={{ x: 10, y: 20 }}
        onClose={onClose}
        onAddRowAbove={onAddRowAbove}
        onAddRowBelow={onAddRowBelow}
        onAddColumnBefore={onAddColumnBefore}
        onAddColumnAfter={onAddColumnAfter}
        onDeleteRow={onDeleteRow}
        onDeleteColumn={onDeleteColumn}
        onDeleteTable={onDeleteTable}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: new RegExp(I18N_KEYS.table.addRowAbove) }));
    expect(onAddRowAbove).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(I18N_KEYS.table.addRowBelow) }));
    expect(onAddRowBelow).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(I18N_KEYS.table.addColumnLeft) }),
    );
    expect(onAddColumnBefore).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(I18N_KEYS.table.addColumnRight) }),
    );
    expect(onAddColumnAfter).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(I18N_KEYS.table.deleteRow) }));
    expect(onDeleteRow).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(I18N_KEYS.table.deleteColumn) }));
    expect(onDeleteColumn).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(I18N_KEYS.table.deleteTable) }));
    expect(onDeleteTable).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: I18N_KEYS.table.cancel }));
    expect(onClose).toHaveBeenCalled();
  });
});
