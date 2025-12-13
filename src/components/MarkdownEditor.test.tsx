import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { MarkdownEditor } from './MarkdownEditor';

describe('MarkdownEditor', () => {
  it('renders without crashing', () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    // Check if the editor container is present
    // TipTap creates a div with class 'ProseMirror'
    const editor = document.querySelector('.ProseMirror');
    expect(editor).toBeTruthy();
  });

  it('renders initial value', () => {
    render(<MarkdownEditor value="Hello World" onChange={() => {}} />);
    const editor = document.querySelector('.ProseMirror');
    expect(editor?.textContent).toContain('Hello World');
  });
});
