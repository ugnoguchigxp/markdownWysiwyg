import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import type React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeBlockNodeView } from '../../src/extensions/CodeBlockNodeView';

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
  NodeViewContent: ({ children }: { children: React.ReactNode }) => (
    <pre data-testid="node-view-content">{children}</pre>
  ),
}));

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../src/extensions/mermaidRegistry', () => ({
  getMermaidLib: () => null,
  getMermaidLibVersion: () => 0,
  setMermaidLib: vi.fn(),
  subscribeMermaidLib: () => vi.fn(),
}));

vi.mock('../../src/utils/security', () => ({
  sanitizeSvg: (svg: string) => svg,
}));

describe('CodeBlockNodeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(screen.getByTestId('node-view-wrapper')).toBeDefined();
    expect(screen.getByRole('combobox')).toBeDefined();
    expect(screen.getByDisplayValue('JavaScript')).toBeDefined();
  });

  it('renders plain text code block when language is empty', () => {
    const props = {
      ...defaultProps,
      node: {
        ...defaultProps.node,
        attrs: { language: '' },
        textContent: 'plain text',
      },
    };
    render(<CodeBlockNodeView {...props as unknown as Parameters<typeof CodeBlockNodeView>[0]} />);
    expect(screen.getByDisplayValue('Plain Text')).toBeDefined();
  });

  it('updates language when selector changes', () => {
    render(<CodeBlockNodeView {...defaultProps} />);
    const select = screen.getByRole('combobox');

    act(() => {
      fireEvent.change(select, { target: { value: 'python' } });
    });

    const renderBtn = screen.getByTitle('レンダリング');
    act(() => {
      renderBtn.click();
    });

    expect(mockUpdateAttributes).toHaveBeenCalledWith({ language: 'python' });
  });

  it('deletes node when delete button clicked', () => {
    render(<CodeBlockNodeView {...defaultProps} />);
    const deleteBtn = screen.getByTitle('削除');
    act(() => {
      deleteBtn.click();
    });
    expect(mockDeleteNode).toHaveBeenCalled();
  });

  it('does not show controls when editor is not editable', () => {
    const props = {
      ...defaultProps,
      editor: {
        ...defaultProps.editor,
        isEditable: false,
      },
    };
    render(<CodeBlockNodeView {...props as unknown as Parameters<typeof CodeBlockNodeView>[0]} />);
    expect(screen.queryByRole('combobox')).toBe(null);
    expect(screen.queryByTitle('レンダリング')).toBe(null);
    expect(screen.queryByTitle('削除')).toBe(null);
  });

  it('shows selected state when selected prop is true', () => {
    const props = {
      ...defaultProps,
      selected: true,
    };
    const { container } = render(<CodeBlockNodeView {...props as unknown as Parameters<typeof CodeBlockNodeView>[0]} />);
    const wrapper = container.querySelector('.ring-2');
    expect(wrapper).toBeTruthy();
  });

  it('renders all supported languages in selector', () => {
    render(<CodeBlockNodeView {...defaultProps} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.options.length).toBeGreaterThan(0);
    expect(select.options[0].value).toBe('');
    expect(select.options[0].text).toBe('Plain Text');
  });
});
