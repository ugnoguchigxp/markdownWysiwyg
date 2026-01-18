import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Download, Trash2 } from './icons';

describe('icons', () => {
  it('renders a sized svg with a title', () => {
    const { container } = render(<Trash2 size={32} className="icon" data-testid="trash" />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
    expect(svg).toHaveClass('icon');
    expect(screen.getByTitle('Trash2')).toBeInTheDocument();
  });

  it('uses default size when not provided', () => {
    const { container } = render(<Download />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
    expect(screen.getByTitle('Download')).toBeInTheDocument();
  });
});
