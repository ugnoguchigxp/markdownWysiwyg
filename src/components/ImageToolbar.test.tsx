import { fireEvent, render, screen } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageToolbar } from '../../src/components/ImageToolbar';
import { I18nProvider } from '../../src/i18n/I18nContext';

type MockFocus = {
  updateAttributes: ReturnType<typeof vi.fn>;
  deleteSelection: ReturnType<typeof vi.fn>;
};

type MockChain = {
  focus: ReturnType<typeof vi.fn>;
};

type MockEditor = {
  chain: ReturnType<typeof vi.fn>;
  getAttributes: ReturnType<typeof vi.fn>;
};

const mockT = vi.fn((key: string) => key);

describe('ImageToolbar', () => {
  let mockEditor: MockEditor;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockFocus: MockFocus = {
      updateAttributes: vi.fn().mockReturnValue({ run: vi.fn() }),
      deleteSelection: vi.fn().mockReturnValue({ run: vi.fn() }),
    };
    const mockChain: MockChain = {
      focus: vi.fn().mockReturnValue(mockFocus),
    };

    mockEditor = {
      chain: vi.fn().mockReturnValue(mockChain),
      getAttributes: vi.fn().mockReturnValue({}),
    };
  });

  const renderToolbar = (visible = true) => {
    return render(
      <I18nProvider t={mockT}>
        <ImageToolbar
          editor={mockEditor as unknown as Editor}
          visible={visible}
          position={{ x: 100, y: 100 }}
        />
      </I18nProvider>,
    );
  };

  it('renders nothing when not visible', () => {
    const { container } = renderToolbar(false);
    expect(container.firstChild).toBeNull();
  });

  it('renders all control buttons when visible', () => {
    renderToolbar(true);
    expect(screen.getByTitle('markdown_editor.image_toolbar.align_left')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.align_center')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.align_right')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.float_left')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.float_right')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.size_small')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.size_medium')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.size_large')).toBeDefined();
    expect(screen.getByTitle('markdown_editor.image_toolbar.delete')).toBeDefined();
  });

  it('calls setAlign when alignment button is clicked', () => {
    renderToolbar(true);
    fireEvent.click(screen.getByTitle('markdown_editor.image_toolbar.align_left'));

    expect(mockEditor.chain).toHaveBeenCalled();
    const chain = mockEditor.chain();
    expect(chain.focus).toHaveBeenCalled();
    const focus = chain.focus();
    expect(focus.updateAttributes).toHaveBeenCalledWith('image', { align: 'left', float: 'none' });
    expect(focus.updateAttributes().run).toHaveBeenCalled();
  });

  it('calls setFloat when float button is clicked', () => {
    renderToolbar(true);
    fireEvent.click(screen.getByTitle('markdown_editor.image_toolbar.float_right'));

    expect(mockEditor.chain).toHaveBeenCalled();
    const chain = mockEditor.chain();
    const focus = chain.focus();
    expect(focus.updateAttributes).toHaveBeenCalledWith('image', { float: 'right' });
  });

  it('calls setWidth with 150px when Small is clicked', () => {
    renderToolbar(true);
    fireEvent.click(screen.getByTitle('markdown_editor.image_toolbar.size_small'));

    expect(mockEditor.chain).toHaveBeenCalled();
    const chain = mockEditor.chain();
    const focus = chain.focus();
    expect(focus.updateAttributes).toHaveBeenCalledWith('image', { width: '150px' });
  });

  it('calls setWidth with auto when Medium is clicked', () => {
    renderToolbar(true);
    fireEvent.click(screen.getByTitle('markdown_editor.image_toolbar.size_medium'));

    const focus = mockEditor.chain().focus();
    expect(focus.updateAttributes).toHaveBeenCalledWith('image', { width: 'auto' });
  });

  it('calls setWidth with 100% when Large is clicked', () => {
    renderToolbar(true);
    fireEvent.click(screen.getByTitle('markdown_editor.image_toolbar.size_large'));

    const focus = mockEditor.chain().focus();
    expect(focus.updateAttributes).toHaveBeenCalledWith('image', { width: '100%' });
  });

  it('calls deleteSelection when delete button is clicked', () => {
    renderToolbar(true);
    fireEvent.click(screen.getByTitle('markdown_editor.image_toolbar.delete'));

    expect(mockEditor.chain).toHaveBeenCalled();
    const chain = mockEditor.chain();
    const focus = chain.focus();
    expect(focus.deleteSelection).toHaveBeenCalled();
    expect(focus.deleteSelection().run).toHaveBeenCalled();
  });

  it('highlights active buttons based on editor attributes', () => {
    mockEditor.getAttributes.mockReturnValue({
      align: 'right',
      float: 'none',
      width: '100%',
    });

    renderToolbar(true);

    const alignRightBtn = screen.getByTitle('markdown_editor.image_toolbar.align_right');
    expect(alignRightBtn.className.split(' ')).toContain('bg-muted');

    const largeBtn = screen.getByTitle('markdown_editor.image_toolbar.size_large');
    expect(largeBtn.className.split(' ')).toContain('bg-muted');

    const floatLeftBtn = screen.getByTitle('markdown_editor.image_toolbar.float_left');
    expect(floatLeftBtn.className.split(' ')).not.toContain('bg-muted');
  });
});
