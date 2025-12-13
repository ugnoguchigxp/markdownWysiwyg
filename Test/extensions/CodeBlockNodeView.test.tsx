import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CodeBlockNodeView } from '../../src/extensions/CodeBlockNodeView';

// Mock dependencies
vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="node-view-wrapper">
      {children}
    </div>
  ),
  NodeViewContent: () => <pre data-testid="node-view-content" />,
}));

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('CodeBlockNodeView', () => {
  const mockUpdateAttributes = vi.fn();
  const mockDeleteNode = vi.fn();

  const defaultProps = {
    node: {
      attrs: { language: 'javascript' },
      textContent: 'console.log("test");',
    },
    selected: false,
    editor: {
      isEditable: true,
    },
    updateAttributes: mockUpdateAttributes,
    deleteNode: mockDeleteNode,
    getPos: () => 0,
    extension: {},
  } as unknown as Parameters<typeof CodeBlockNodeView>[0];

  it('renders regular code block correctly', () => {
    render(<CodeBlockNodeView {...defaultProps} />);
    expect(screen.getByTestId('node-view-wrapper')).toBeTruthy();
    // Check for language selector
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.getByDisplayValue('JavaScript')).toBeTruthy();
  });

  it('updates language when selector changes', () => {
    render(<CodeBlockNodeView {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'python' } });

    // It updates local state. To verify it calls updateAttributes, we need to click render/play button if that logic is there,
    // or wait for effect?
    // Looking at code: handleLanguageChange sets state. handleRender calls updateAttributes.

    const renderBtn = screen.getByTitle('レンダリング');
    fireEvent.click(renderBtn);

    expect(mockUpdateAttributes).toHaveBeenCalledWith({ language: 'python' });
  });

  it('deletes node when delete button clicked', () => {
    render(<CodeBlockNodeView {...defaultProps} />);
    const deleteBtn = screen.getByTitle('削除');
    fireEvent.click(deleteBtn);
    expect(mockDeleteNode).toHaveBeenCalled();
  });
});
