import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LucideIcon } from '../ui/icons';
import { ToolbarButton } from './ToolbarButton';

const MockIcon: LucideIcon = () => <svg data-testid="mock-icon" />;

describe('ToolbarButton', () => {
  it('renders button with icon and tooltip', () => {
    render(<ToolbarButton icon={MockIcon} title="Test Button" onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.getAttribute('data-tooltip')).toBe('Test Button');
    expect(screen.getByTestId('mock-icon')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ToolbarButton icon={MockIcon} title="Test" onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<ToolbarButton icon={MockIcon} title="Test" onClick={vi.fn()} disabled />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('disabled:opacity-50');
    expect(button.className).toContain('disabled:cursor-not-allowed');
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<ToolbarButton icon={MockIcon} title="Test" onClick={handleClick} disabled />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
