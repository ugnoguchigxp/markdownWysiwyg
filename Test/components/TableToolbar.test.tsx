import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TableToolbar } from '../../src/components/TableToolbar';

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
    const editor = { chain: () => chain } as any;

    const { container } = render(
      <TableToolbar editor={editor} visible={false} position={{ x: 10, y: 20 }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('triggers row/column/cell/header operations', () => {
    const chain = createChain();
    const editor = { chain: () => chain } as any;

    render(<TableToolbar editor={editor} visible={true} position={{ x: 10, y: 200 }} />);

    fireEvent.click(screen.getByTitle('Insert row above'));
    expect(chain.addRowBefore).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Insert row below'));
    expect(chain.addRowAfter).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Delete row'));
    expect(chain.deleteRow).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Insert column left'));
    expect(chain.addColumnBefore).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Insert column right'));
    expect(chain.addColumnAfter).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Delete column'));
    expect(chain.deleteColumn).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Merge cells'));
    expect(chain.mergeCells).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Split cell'));
    expect(chain.splitCell).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Toggle header row'));
    expect(chain.toggleHeaderRow).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Toggle header column'));
    expect(chain.toggleHeaderColumn).toHaveBeenCalled();
  });

  it('deletes table only when confirm returns true', () => {
    const chain = createChain();
    const editor = { chain: () => chain } as any;

    const confirm = vi.spyOn(window, 'confirm');
    confirm.mockReturnValueOnce(false);

    render(<TableToolbar editor={editor} visible={true} position={{ x: 10, y: 200 }} />);

    fireEvent.click(screen.getByTitle('Delete table'));
    expect(chain.deleteTable).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByTitle('Delete table'));
    expect(chain.deleteTable).toHaveBeenCalled();

    confirm.mockRestore();
  });
});
