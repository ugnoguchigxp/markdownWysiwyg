import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { MarkdownEditor } from './MarkdownEditor';

describe('MarkdownEditor', () => {
  it('renders without crashing', async () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    await waitFor(() => {
      const editor = document.querySelector('.ProseMirror');
      expect(editor).toBeTruthy();
    });
  });

  it('renders initial value', async () => {
    render(<MarkdownEditor value="Hello World" onChange={() => {}} />);
    await waitFor(() => {
      const editor = document.querySelector('.ProseMirror');
      expect(editor?.textContent).toContain('Hello World');
    });
  });
});
