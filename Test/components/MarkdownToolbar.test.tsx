import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownToolbar } from '../../src/components/MarkdownToolbar';
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
    toggleBold: () => typeof self;
    toggleItalic: () => typeof self;
    toggleStrike: () => typeof self;
    toggleCode: () => typeof self;
    insertContent: (content: unknown) => typeof self;
    focus: () => typeof self;
    run: () => void;
  };

  self.toggleBold = vi.fn(() => self);
  self.toggleItalic = vi.fn(() => self);
  self.toggleStrike = vi.fn(() => self);
  self.toggleCode = vi.fn(() => self);
  self.insertContent = vi.fn(() => self);
  self.focus = vi.fn(() => self);
  self.run = vi.fn();

  return self;
};

describe('MarkdownToolbar', () => {
  it('renders and triggers basic actions', () => {
    const onInsertMarkdown = vi.fn();

    const chain = createChain();
    const editor = {
      chain: () => chain,
      commands: {
        insertTable: vi.fn().mockReturnValue(true),
        insertContent: vi.fn().mockReturnValue(true),
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar
        onInsertMarkdown={onInsertMarkdown}
        editor={editor}
      />,
    );

    const boldBtn = container.querySelector(`[data-tooltip="${I18N_KEYS.bold}"]`) as HTMLElement;
    fireEvent.click(boldBtn);
    expect(chain.toggleBold).toHaveBeenCalled();

    const italicBtn = container.querySelector(`[data-tooltip="${I18N_KEYS.italic}"]`) as HTMLElement;
    fireEvent.click(italicBtn);
    expect(chain.toggleItalic).toHaveBeenCalled();

  });

  it('opens emoji picker and inserts emoji via editor chain', () => {
    const onInsertMarkdown = vi.fn();

    const chain = createChain();
    const editor = {
      chain: () => chain,
      commands: {
        insertTable: vi.fn().mockReturnValue(true),
        insertContent: vi.fn().mockReturnValue(true),
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar onInsertMarkdown={onInsertMarkdown} editor={editor} />,
    );

    const emojiBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.emoji.button}"]`,
    ) as HTMLElement;
    fireEvent.click(emojiBtn);

    const firstEmoji = document.querySelectorAll('.mw-emoji-item')[0] as HTMLElement;
    fireEvent.click(firstEmoji);

    expect(chain.insertContent).toHaveBeenCalledTimes(1);
    expect(chain.run).toHaveBeenCalled();
  });

  it('opens image picker and inserts markdown image tag', () => {
    const onInsertMarkdown = vi.fn();

    const chain = createChain();
    const editor = {
      chain: () => chain,
      commands: {
        insertTable: vi.fn().mockReturnValue(true),
        insertContent: vi.fn().mockReturnValue(true),
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar onInsertMarkdown={onInsertMarkdown} editor={editor} />,
    );

    const imageBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.image.button}"]`,
    ) as HTMLElement;
    fireEvent.click(imageBtn);

    const urlInput = screen.getByLabelText('URL') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/a.png' } });

    const altInput = screen.getByLabelText('Alt') as HTMLInputElement;
    fireEvent.change(altInput, { target: { value: 'alt' } });

    const insertBtn = screen.getByRole('button', { name: 'Insert' });
    fireEvent.click(insertBtn);

    expect(onInsertMarkdown).toHaveBeenCalledWith('![alt](https://example.com/a.png)');
  });

  it('opens heading menu and inserts selected heading', () => {
    const onInsertMarkdown = vi.fn();

    const chain = createChain();
    const editor = {
      chain: () => chain,
      commands: {
        insertTable: vi.fn().mockReturnValue(true),
        insertContent: vi.fn().mockReturnValue(true),
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar
        onInsertMarkdown={onInsertMarkdown}
        editor={editor}
      />,
    );

    const headingBtn = container.querySelector(
      `[data-tooltip="${I18N_KEYS.heading}"]`,
    ) as HTMLElement;
    fireEvent.click(headingBtn);

    const preview = screen.getAllByText('H1')[0];
    const itemBtn = preview.closest('button') as HTMLElement;
    fireEvent.click(itemBtn);

    expect(onInsertMarkdown).toHaveBeenCalledWith('# ');
  });

  it('opens link modal and inserts markdown link', () => {
    const onInsertMarkdown = vi.fn();

    const chain = createChain();
    const editor = {
      chain: () => chain,
      commands: {
        insertTable: vi.fn().mockReturnValue(true),
        insertContent: vi.fn().mockReturnValue(true),
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar
        onInsertMarkdown={onInsertMarkdown}
        selectedText="Example"
        editor={editor}
      />,
    );

    const linkBtn = container.querySelector(`[data-tooltip="${I18N_KEYS.insertLink}"]`) as HTMLElement;
    fireEvent.click(linkBtn);

    const urlInput = screen.getByLabelText(I18N_KEYS.link.url) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    const insertBtn = screen.getByRole('button', { name: I18N_KEYS.insert });
    fireEvent.click(insertBtn);

    expect(onInsertMarkdown).toHaveBeenCalledWith('[Example](https://example.com)');
  });

  it('shows download menu and triggers download handler', () => {
    const onInsertMarkdown = vi.fn();
    const onDownloadAsMarkdown = vi.fn();

    const chain = createChain();
    const editor = {
      chain: () => chain,
      commands: {
        insertTable: vi.fn().mockReturnValue(true),
        insertContent: vi.fn().mockReturnValue(true),
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar
        onInsertMarkdown={onInsertMarkdown}
        editor={editor}
        showDownloadButton={true}
        onDownloadAsMarkdown={onDownloadAsMarkdown}
      />,
    );

    const downloadBtn = container.querySelector(`[data-tooltip="${I18N_KEYS.download}"]`) as HTMLElement;
    fireEvent.click(downloadBtn);

    const markdownFileBtn = screen.getByRole('button', { name: new RegExp(I18N_KEYS.markdownFile) });
    fireEvent.click(markdownFileBtn);

    expect(onDownloadAsMarkdown).toHaveBeenCalled();
  });

  it('falls back to markdown table insertion when editor is not provided', () => {
    const onInsertMarkdown = vi.fn();

    const { container } = render(
      <MarkdownToolbar onInsertMarkdown={onInsertMarkdown} />,
    );

    const tableBtn = container.querySelector(`[data-tooltip="${I18N_KEYS.insertTable}"]`) as HTMLElement;
    fireEvent.click(tableBtn);

    expect(onInsertMarkdown).toHaveBeenCalled();
  });

  it('uses insertTable and JSON fallback paths based on command result', () => {
    const onInsertMarkdown = vi.fn();

    const chain = createChain();
    const insertTable = vi.fn().mockReturnValue(false);
    const insertContent = vi.fn().mockReturnValue(true);

    const editor = {
      chain: () => chain,
      commands: {
        insertTable,
        insertContent,
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar onInsertMarkdown={onInsertMarkdown} editor={editor} />,
    );

    const tableBtn = container.querySelector(`[data-tooltip="${I18N_KEYS.insertTable}"]`) as HTMLElement;
    fireEvent.click(tableBtn);

    expect(insertTable).toHaveBeenCalled();
    expect(insertContent).toHaveBeenCalled();
    expect(onInsertMarkdown).not.toHaveBeenCalled();
  });

  it('falls back to markdown table insertion when insertTable throws', () => {
    const onInsertMarkdown = vi.fn();

    const chain = createChain();
    const editor = {
      chain: () => chain,
      commands: {
        insertTable: vi.fn(() => {
          throw new Error('boom');
        }),
        insertContent: vi.fn().mockReturnValue(false),
      },
      extensionManager: { extensions: [{ name: 'table' }] },
    } as unknown as Parameters<typeof MarkdownToolbar>[0]['editor'];

    const { container } = render(
      <MarkdownToolbar onInsertMarkdown={onInsertMarkdown} editor={editor} />,
    );

    const tableBtn = container.querySelector(`[data-tooltip="${I18N_KEYS.insertTable}"]`) as HTMLElement;
    fireEvent.click(tableBtn);

    expect(onInsertMarkdown).toHaveBeenCalled();
  });
});
