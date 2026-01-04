import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TableToolbar } from '../../src/components/TableToolbar';
import { I18N_KEYS } from '../../src/types/index';

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@tiptap/extension-table', () => ({}));

const createChain = () => {
  const chain: Record<string, unknown> = {};

  const self = chain as unknown as {
    focus: () => typeof self;
    addRowBefore: () => typeof self;
    addRowAfter: () => typeof self;
    deleteRow: () => typeof self;
    addColumnBefore: () => typeof self;
    addColumnAfter: () => typeof self;
    deleteColumn: () => typeof self;
    mergeCells: () => typeof self;
    splitCell: () => typeof self;
    toggleHeaderRow: () => typeof self;
    toggleHeaderColumn: () => typeof self;
    deleteTable: () => typeof self;
    run: () => void;
  };

  self.focus = vi.fn(() => self);
  self.addRowBefore = vi.fn(() => self);
  self.addRowAfter = vi.fn(() => self);
  self.deleteRow = vi.fn(() => self);
  self.addColumnBefore = vi.fn(() => self);
  self.addColumnAfter = vi.fn(() => self);
  self.deleteColumn = vi.fn(() => self);
  self.mergeCells = vi.fn(() => self);
  self.splitCell = vi.fn(() => self);
  self.toggleHeaderRow = vi.fn(() => self);
  self.toggleHeaderColumn = vi.fn(() => self);
  self.deleteTable = vi.fn(() => self);
  self.run = vi.fn();

  return self;
};

describe('TableToolbar', () => {
  it('returns null when not visible', () => {
    const chain = createChain();
    const editor = { chain: () => chain } as unknown as Parameters<
      typeof TableToolbar
    >[0]['editor'];

    const { container } = render(
      <TableToolbar editor={editor} visible={false} position={{ x: 10, y: 20 }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('triggers row/column/cell/header operations', () => {
    const chain = createChain();
    const editor = { chain: () => chain } as unknown as Parameters<
      typeof TableToolbar
    >[0]['editor'];

    render(<TableToolbar editor={editor} visible={true} position={{ x: 10, y: 200 }} />);

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.insertRowAbove));
    expect(chain.addRowBefore).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.insertRowBelow));
    expect(chain.addRowAfter).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.deleteRow));
    expect(chain.deleteRow).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.insertColumnLeft));
    expect(chain.addColumnBefore).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.insertColumnRight));
    expect(chain.addColumnAfter).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.deleteColumn));
    expect(chain.deleteColumn).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.mergeCells));
    expect(chain.mergeCells).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.splitCell));
    expect(chain.splitCell).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.toggleHeaderRow));
    expect(chain.toggleHeaderRow).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.toggleHeaderColumn));
    expect(chain.toggleHeaderColumn).toHaveBeenCalled();
  });

  it('deletes table only when confirm returns true', () => {
    const chain = createChain();
    const editor = { chain: () => chain } as unknown as Parameters<
      typeof TableToolbar
    >[0]['editor'];

    const confirm = vi.spyOn(window, 'confirm');
    confirm.mockReturnValueOnce(false);

    render(<TableToolbar editor={editor} visible={true} position={{ x: 10, y: 200 }} />);

    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.deleteTable));
    expect(chain.deleteTable).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByTitle(I18N_KEYS.tableToolbar.deleteTable));
    expect(chain.deleteTable).toHaveBeenCalled();

    confirm.mockRestore();
  });
});
