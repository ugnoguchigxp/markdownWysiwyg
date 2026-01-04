import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18N_KEYS } from '../../types/index';
import { HeadingMenu } from './HeadingMenu';

describe('HeadingMenu', () => {
  const defaultProps = {
    isOpen: false,
    disabled: false,
    onToggle: vi.fn(),
    onClose: vi.fn(),
    onInsertMarkdown: vi.fn(),
    t: (key: string) => key,
  };

  it('renders heading button', () => {
    render(<HeadingMenu {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.getAttribute('data-tooltip')).toBe(I18N_KEYS.heading);
  });

  it('calls onToggle when button is clicked', () => {
    render(<HeadingMenu {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows menu with heading options when isOpen is true', () => {
    render(<HeadingMenu {...defaultProps} isOpen />);

    expect(screen.getByText(`${I18N_KEYS.heading}1`)).toBeTruthy();
    expect(screen.getByText(`${I18N_KEYS.heading}2`)).toBeTruthy();
    expect(screen.getByText(`${I18N_KEYS.heading}3`)).toBeTruthy();
    expect(screen.getByText(`${I18N_KEYS.heading}4`)).toBeTruthy();
    expect(screen.getByText(`${I18N_KEYS.heading}5`)).toBeTruthy();
  });

  it('calls onInsertMarkdown with correct markdown when heading is clicked', () => {
    render(<HeadingMenu {...defaultProps} isOpen />);

    const h2Button = screen.getByText(`${I18N_KEYS.heading}2`);
    fireEvent.click(h2Button);

    expect(defaultProps.onInsertMarkdown).toHaveBeenCalledWith('## ');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<HeadingMenu {...defaultProps} disabled />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
