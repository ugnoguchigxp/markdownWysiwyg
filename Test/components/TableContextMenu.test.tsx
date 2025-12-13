import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TableContextMenu } from '../../src/components/TableContextMenu';

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

    fireEvent.click(screen.getByRole('button', { name: /Add Row Above/i }));
    expect(onAddRowAbove).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Add Row Below/i }));
    expect(onAddRowBelow).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Add Column Left/i }));
    expect(onAddColumnBefore).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Add Column Right/i }));
    expect(onAddColumnAfter).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Delete Row/i }));
    expect(onDeleteRow).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Delete Column/i }));
    expect(onDeleteColumn).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Delete Entire Table/i }));
    expect(onDeleteTable).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
