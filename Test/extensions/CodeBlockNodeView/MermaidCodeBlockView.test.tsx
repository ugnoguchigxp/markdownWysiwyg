import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MermaidCodeBlockView } from '../../../src/extensions/CodeBlockNodeView/MermaidCodeBlockView';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="node-view-wrapper" className={className}>
      {children}
    </div>
  ),
  NodeViewContent: () => <div data-testid="node-view-content" />,
}));

vi.mock('../../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../../src/utils/security', () => ({
  sanitizeSvg: (svg: string) => svg,
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('MermaidCodeBlockView', () => {
  const originalImage = global.Image;
  const originalUrl = global.URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    if (global.URL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock');
      global.URL.revokeObjectURL = vi.fn();
    }

    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        if (this.onload) {
          this.onload();
        }
      }
    } as unknown as typeof Image;

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      scale: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
    });
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) =>
      cb(new Blob(['x'], { type: 'image/png' })),
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    global.Image = originalImage;
    global.URL = originalUrl;
  });

  it('renders and handles edit/render actions', async () => {
    const updateAttributes = vi.fn();
    const deleteNode = vi.fn();
    const mermaidLib = {
      render: vi.fn().mockResolvedValue({ svg: '<svg><text>ok</text></svg>' }),
    };

    render(
      <MermaidCodeBlockView
        code="graph TD;A-->B"
        selected={false}
        editable={true}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
        mermaidLib={mermaidLib as never}
        mermaidLibVersion={1}
      />,
    );

    await act(async () => {
      await flushPromises();
    });

    const editButton = screen.getByTitle('ソース編集');
    act(() => {
      fireEvent.click(editButton);
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    act(() => {
      fireEvent.change(select, { target: { value: 'javascript' } });
    });

    const renderButton = screen.getByTitle('レンダリング');
    act(() => {
      fireEvent.click(renderButton);
    });
    await act(async () => {
      await flushPromises();
    });

    expect(updateAttributes).toHaveBeenCalledWith({ language: 'javascript' });
  });

  it('handles downloads and fullscreen toggle', async () => {
    const updateAttributes = vi.fn();
    const deleteNode = vi.fn();
    const mermaidLib = {
      render: vi.fn().mockResolvedValue({ svg: '<svg><text>ok</text></svg>' }),
    };

    render(
      <MermaidCodeBlockView
        code="graph TD;A-->B"
        selected={false}
        editable={true}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
        mermaidLib={mermaidLib as never}
        mermaidLibVersion={1}
      />,
    );

    await act(async () => {
      await flushPromises();
    });

    act(() => {
      fireEvent.click(screen.getByTitle('SVGダウンロード'));
      fireEvent.click(screen.getByTitle('PNGダウンロード'));
    });

    act(() => {
      fireEvent.click(screen.getByTitle('全画面表示'));
    });
    expect(screen.getByTitle('閉じる')).toBeDefined();
    act(() => {
      fireEvent.click(screen.getByTitle('閉じる'));
    });
    await act(async () => {
      await flushPromises();
    });
  });

  it('shows error UI when mermaid render fails', async () => {
    const updateAttributes = vi.fn();
    const deleteNode = vi.fn();
    const mermaidLib = {
      render: vi.fn().mockRejectedValue(new Error('render-failed')),
    };

    render(
      <MermaidCodeBlockView
        code="graph TD;A-->B"
        selected={false}
        editable={false}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
        mermaidLib={mermaidLib as never}
        mermaidLibVersion={1}
      />,
    );

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByText('Mermaid rendering error:')).toBeDefined();
  });
});
