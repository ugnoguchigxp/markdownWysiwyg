import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders a clickable button with the title', () => {
    const handleClick = vi.fn();
    render(
      <IconButton onClick={handleClick} title="Copy">
        <span>+</span>
      </IconButton>,
    );

    const button = screen.getByTitle('Copy');
    expect(button).toHaveAttribute('type', 'button');
    expect(button.className).toContain('w-7');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
