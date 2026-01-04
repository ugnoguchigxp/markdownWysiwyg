import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EmojiPicker } from '../../src/components/EmojiPicker';
import { I18N_KEYS } from '../../src/types/index';

describe('EmojiPicker', () => {
  it('renders grouped sections and selects emoji', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    const { container } = render(<EmojiPicker onSelect={onSelect} onClose={onClose} t={t} />);

    expect(screen.getByText(I18N_KEYS.emoji.categories.smileys)).toBeTruthy();
    expect(screen.getByText(I18N_KEYS.emoji.categories.people)).toBeTruthy();

    const firstEmoji = container.querySelectorAll('.mw-emoji-item')[0] as HTMLElement;
    fireEvent.click(firstEmoji);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('filters by keyword when searching', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<EmojiPicker onSelect={onSelect} onClose={onClose} t={t} />);

    const input = screen.getByPlaceholderText(
      I18N_KEYS.emoji.searchPlaceholder,
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'pizza' } });

    const pizza = screen.getByRole('button', { name: 'pizza' });
    fireEvent.click(pizza);

    expect(onSelect).toHaveBeenCalledWith('🍕');
  });

  it('closes on outside click and Escape', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const t = (key: string) => key;

    render(<EmojiPicker onSelect={onSelect} onClose={onClose} t={t} />);

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
