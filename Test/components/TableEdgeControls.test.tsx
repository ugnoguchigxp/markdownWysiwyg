import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TableEdgeControls } from '../../src/components/TableEdgeControls';
import { I18N_KEYS } from '../../src/types/index';

vi.mock('@tiptap/extension-table', () => ({}));

const createChain = () => {
  const chain: Record<string, unknown> = {};

  const self = chain as unknown as {
    focus: () => typeof self;
    addRowBefore: () => typeof self;
    addRowAfter: () => typeof self;
    addColumnBefore: () => typeof self;
    addColumnAfter: () => typeof self;
    run: () => void;
  };

  self.focus = vi.fn(() => self);
  self.addRowBefore = vi.fn(() => self);
  self.addRowAfter = vi.fn(() => self);
  self.addColumnBefore = vi.fn(() => self);
  self.addColumnAfter = vi.fn(() => self);
  self.run = vi.fn();

  return self;
};

describe('TableEdgeControls', () => {
  it('returns null when editor is null', () => {
    const { container } = render(<TableEdgeControls editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows portal controls on hover over tiptap table and triggers commands', async () => {
    const chain = createChain();
    const editor = { chain: () => chain } as unknown as Parameters<typeof TableEdgeControls>[0]['editor'];

    render(<TableEdgeControls editor={editor} />);

    const wrapper = document.createElement('div');
    wrapper.className = 'tiptap-table-enhanced';

    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');

    const rect: DOMRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 10,
      right: 100,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    };
    table.getBoundingClientRect = vi.fn(() => rect);

    tr.appendChild(td);
    table.appendChild(tr);
    wrapper.appendChild(table);
    document.body.appendChild(wrapper);

    // Dispatch event from the cell so that event.target is an element with closest()
    fireEvent.mouseOver(td);

    expect(await screen.findByText(I18N_KEYS.tableEdgeControls.addRowAbove)).toBeTruthy();

    fireEvent.click(screen.getByText(I18N_KEYS.tableEdgeControls.addRowAbove));
    expect(chain.addRowBefore).toHaveBeenCalled();

    fireEvent.click(screen.getByText(I18N_KEYS.tableEdgeControls.addRowBelow));
    expect(chain.addRowAfter).toHaveBeenCalled();

    fireEvent.click(screen.getByText(I18N_KEYS.tableEdgeControls.addColumnLeft));
    expect(chain.addColumnBefore).toHaveBeenCalled();

    fireEvent.click(screen.getByText(I18N_KEYS.tableEdgeControls.addColumnRight));
    expect(chain.addColumnAfter).toHaveBeenCalled();

    // Leaving the portal should remove it
    const portal = document.querySelector('.table-edge-controls') as HTMLElement;
    fireEvent.mouseLeave(portal);

    await waitFor(() => {
      expect(document.querySelector('.table-edge-controls')).toBeNull();
    });

    document.body.removeChild(wrapper);
  });
});
