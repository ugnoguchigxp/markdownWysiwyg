import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RegularCodeBlockView } from '../../../src/extensions/CodeBlockNodeView/RegularCodeBlockView';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="node-view-wrapper">{children}</div>
  ),
  NodeViewContent: () => <code data-testid="node-view-content" />,
}));

vi.mock('../../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
  }),
}));

describe('RegularCodeBlockView', () => {
  it('updates language and renders', () => {
    const updateAttributes = vi.fn();
    const deleteNode = vi.fn();

    render(
      <RegularCodeBlockView
        language="javascript"
        selected={false}
        editable={true}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
      />,
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'python' } });

    const renderButton = screen.getByTitle('レンダリング');
    fireEvent.click(renderButton);

    expect(updateAttributes).toHaveBeenCalledWith({ language: 'python' });
  });

  it('deletes node on delete button', () => {
    const updateAttributes = vi.fn();
    const deleteNode = vi.fn();

    render(
      <RegularCodeBlockView
        language="javascript"
        selected={false}
        editable={true}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
      />,
    );

    const deleteButton = screen.getByTitle('削除');
    fireEvent.click(deleteButton);
    expect(deleteNode).toHaveBeenCalled();
  });

  it('hides controls when not editable', () => {
    const updateAttributes = vi.fn();
    const deleteNode = vi.fn();

    render(
      <RegularCodeBlockView
        language="javascript"
        selected={false}
        editable={false}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
      />,
    );

    expect(screen.queryByRole('combobox')).toBe(null);
    expect(screen.queryByTitle('削除')).toBe(null);
    expect(screen.queryByTitle('レンダリング')).toBe(null);
  });
});
