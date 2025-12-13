import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LinkContextMenu } from '../../src/components/LinkContextMenu';

describe('LinkContextMenu', () => {
  it('returns null when not visible', () => {
    const { container } = render(
      <LinkContextMenu
        visible={false}
        position={{ x: 10, y: 20 }}
        linkData={{ href: 'https://example.com', text: 'Example' }}
        onClose={() => {}}
        onOpenLink={() => {}}
        onEditLink={() => {}}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('opens link and closes', () => {
    const onClose = vi.fn();
    const onOpenLink = vi.fn();
    const onEditLink = vi.fn();

    render(
      <LinkContextMenu
        visible={true}
        position={{ x: 10, y: 20 }}
        linkData={{ href: 'https://example.com', text: 'Example' }}
        onClose={onClose}
        onOpenLink={onOpenLink}
        onEditLink={onEditLink}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Link' }));
    expect(onOpenLink).toHaveBeenCalledWith('https://example.com');
    expect(onClose).toHaveBeenCalled();
  });

  it('edits link via modal and closes', () => {
    const onClose = vi.fn();
    const onOpenLink = vi.fn();
    const onEditLink = vi.fn();

    render(
      <LinkContextMenu
        visible={true}
        position={{ x: 10, y: 20 }}
        linkData={{ href: 'https://example.com', text: 'Example' }}
        onClose={onClose}
        onOpenLink={onOpenLink}
        onEditLink={onEditLink}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit Link' }));

    const textInput = screen.getByLabelText('Link Text') as HTMLInputElement;
    const urlInput = screen.getByLabelText('URL') as HTMLInputElement;

    fireEvent.change(textInput, { target: { value: 'New Text' } });
    fireEvent.change(urlInput, { target: { value: 'https://changed.example' } });

    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(onEditLink).toHaveBeenCalledWith({
      href: 'https://changed.example',
      text: 'New Text',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on outside click and escape key', () => {
    const onClose = vi.fn();

    render(
      <LinkContextMenu
        visible={true}
        position={{ x: 10, y: 20 }}
        linkData={{ href: 'https://example.com', text: 'Example' }}
        onClose={onClose}
        onOpenLink={() => {}}
        onEditLink={() => {}}
      />,
    );

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();

    onClose.mockClear();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
