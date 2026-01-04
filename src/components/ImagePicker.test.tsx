import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ImagePicker } from '../../src/components/ImagePicker';
import { I18N_KEYS } from '../../src/types/index';

describe('ImagePicker', () => {
  it('inserts markdown image tag', () => {
    const onInsertMarkdown = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<ImagePicker onInsertMarkdown={onInsertMarkdown} onClose={onClose} t={t} />);

    const urlInput = screen.getByLabelText(I18N_KEYS.image.urlLabel) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/a.png' } });

    const altInput = screen.getByLabelText(I18N_KEYS.image.altLabel) as HTMLInputElement;
    fireEvent.change(altInput, { target: { value: 'alt' } });

    const insertBtn = screen.getByRole('button', { name: I18N_KEYS.image.insert });
    fireEvent.click(insertBtn);

    expect(onInsertMarkdown).toHaveBeenCalledWith('![alt](https://example.com/a.png)');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on outside click', () => {
    const onInsertMarkdown = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<ImagePicker onInsertMarkdown={onInsertMarkdown} onClose={onClose} t={t} />);

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    const onInsertMarkdown = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<ImagePicker onInsertMarkdown={onInsertMarkdown} onClose={onClose} t={t} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('inserts on Enter key in URL input', () => {
    const onInsertMarkdown = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<ImagePicker onInsertMarkdown={onInsertMarkdown} onClose={onClose} t={t} />);

    const urlInput = screen.getByLabelText(I18N_KEYS.image.urlLabel) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/a.png' } });

    const altInput = screen.getByLabelText(I18N_KEYS.image.altLabel) as HTMLInputElement;
    fireEvent.change(altInput, { target: { value: 'alt' } });

    fireEvent.keyDown(urlInput, { key: 'Enter' });

    expect(onInsertMarkdown).toHaveBeenCalledWith('![alt](https://example.com/a.png)');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not insert when URL is empty', () => {
    const onInsertMarkdown = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<ImagePicker onInsertMarkdown={onInsertMarkdown} onClose={onClose} t={t} />);

    const insertBtn = screen.getByRole('button', { name: I18N_KEYS.image.insert });
    fireEvent.click(insertBtn);

    expect(onInsertMarkdown).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not insert when disabled', () => {
    const onInsertMarkdown = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<ImagePicker onInsertMarkdown={onInsertMarkdown} onClose={onClose} t={t} disabled />);

    const urlInput = screen.getByLabelText(I18N_KEYS.image.urlLabel) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/a.png' } });

    const insertBtn = screen.getByRole('button', { name: I18N_KEYS.image.insert });
    fireEvent.click(insertBtn);

    expect(onInsertMarkdown).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not insert on Enter when URL is empty', () => {
    const onInsertMarkdown = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<ImagePicker onInsertMarkdown={onInsertMarkdown} onClose={onClose} t={t} />);

    const urlInput = screen.getByLabelText(I18N_KEYS.image.urlLabel) as HTMLInputElement;
    fireEvent.keyDown(urlInput, { key: 'Enter' });

    expect(onInsertMarkdown).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
