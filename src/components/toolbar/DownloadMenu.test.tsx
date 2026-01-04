import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18N_KEYS } from '../../types/index';
import { DownloadMenu } from './DownloadMenu';

describe('DownloadMenu', () => {
  const defaultProps = {
    isOpen: false,
    disabled: false,
    onToggle: vi.fn(),
    onClose: vi.fn(),
    onDownloadAsMarkdown: vi.fn(),
    t: (key: string) => key,
  };

  it('renders download button', () => {
    render(<DownloadMenu {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.getAttribute('data-tooltip')).toBe(I18N_KEYS.download);
  });

  it('calls onToggle when button is clicked', () => {
    render(<DownloadMenu {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows menu when isOpen is true', () => {
    render(<DownloadMenu {...defaultProps} isOpen />);

    expect(screen.getByText(I18N_KEYS.exportMenuTitle)).toBeTruthy();
    expect(screen.getByText(I18N_KEYS.markdownFile)).toBeTruthy();
  });

  it('calls onDownloadAsMarkdown and onClose when download option is clicked', () => {
    render(<DownloadMenu {...defaultProps} isOpen />);

    const downloadButton = screen.getByText(I18N_KEYS.markdownFile);
    fireEvent.click(downloadButton);

    expect(defaultProps.onDownloadAsMarkdown).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<DownloadMenu {...defaultProps} disabled />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
