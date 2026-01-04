import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18N_KEYS } from '../../types/index';
import { LinkModal } from './LinkModal';

describe('LinkModal', () => {
  let onInsertMarkdown: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;
  const t = (key: string) => key;

  beforeEach(() => {
    onInsertMarkdown = vi.fn();
    onClose = vi.fn();
    cleanup();
  });

  it('does not render when isOpen is false', () => {
    render(
      <LinkModal
        isOpen={false}
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    expect(screen.queryByText(I18N_KEYS.insertLink)).toBeFalsy();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    expect(screen.getByText(I18N_KEYS.insertLink)).toBeTruthy();
    expect(screen.getByLabelText(I18N_KEYS.link.linkText)).toBeTruthy();
    expect(screen.getByLabelText(I18N_KEYS.link.url)).toBeTruthy();
    expect(screen.getByText(I18N_KEYS.cancelButton)).toBeTruthy();
    expect(screen.getByText(I18N_KEYS.insert)).toBeTruthy();
  });

  it('pre-fills link text with selectedText', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const linkTextInput = screen.getByLabelText(I18N_KEYS.link.linkText) as HTMLInputElement;
    expect(linkTextInput.value).toBe('Example');
  });

  it('clears URL when modal opens', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const urlInput = screen.getByLabelText(I18N_KEYS.link.url) as HTMLInputElement;
    expect(urlInput.value).toBe('');
  });

  it('calls onInsertMarkdown with correct markdown and closes on submit', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const urlInput = screen.getByLabelText(I18N_KEYS.link.url);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    const insertButton = screen.getByText(I18N_KEYS.insert);
    fireEvent.click(insertButton);

    expect(onInsertMarkdown).toHaveBeenCalledWith('[Example](https://example.com)');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('insert button is disabled when URL is empty', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const insertButton = screen.getByText(I18N_KEYS.insert) as HTMLButtonElement;
    expect(insertButton.disabled).toBe(true);
  });

  it('closes when cancel button is clicked', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const cancelButton = screen.getByText(I18N_KEYS.cancelButton);
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onInsertMarkdown).not.toHaveBeenCalled();
  });

  it('submits when Enter key is pressed in URL input', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const urlInput = screen.getByLabelText(I18N_KEYS.link.url);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.keyDown(urlInput, { key: 'Enter' });

    expect(onInsertMarkdown).toHaveBeenCalledWith('[Example](https://example.com)');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not submit on Enter if URL is empty', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const urlInput = screen.getByLabelText(I18N_KEYS.link.url);
    fireEvent.keyDown(urlInput, { key: 'Enter' });

    expect(onInsertMarkdown).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('updates link text when input changes', () => {
    render(
      <LinkModal
        isOpen
        selectedText="Example"
        onInsertMarkdown={onInsertMarkdown}
        onClose={onClose}
        t={t}
      />,
    );

    const linkTextInput = screen.getByLabelText(I18N_KEYS.link.linkText);
    fireEvent.change(linkTextInput, { target: { value: 'New Text' } });

    expect((linkTextInput as HTMLInputElement).value).toBe('New Text');
  });
});
