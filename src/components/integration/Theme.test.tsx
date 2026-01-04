import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownEditor } from '../../../src/components/MarkdownEditor';

// Basic integration test to ensure the editor renders with the expected structure
// enabling the CSS variables to apply.
describe('Theme Integration', () => {
  it('renders with appropriate classes for theming', async () => {
    const { container } = render(<MarkdownEditor value="# Hello World" onChange={() => {}} />);

    // Check for the main editor container
    // We use waitFor because Tiptap might initialize asynchronously
    await waitFor(() => {
      const editor = container.querySelector('.ProseMirror');
      expect(editor).toBeTruthy();
    });

    // We can't easily check for 'heading' role if Tiptap isn't fully rendering in JSDOM or if we aren't using the real editor extensions.
    // In this integration test, we are using the real component.
  });

  it('supports custom className prop for external styling', () => {
    const { container } = render(
      <MarkdownEditor value="" onChange={() => {}} className="custom-theme-root" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains('custom-theme-root')).toBe(true);
  });
});
