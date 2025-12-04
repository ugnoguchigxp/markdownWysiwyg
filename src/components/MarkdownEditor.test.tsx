import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownEditor } from './MarkdownEditor';
import React from 'react';

describe('MarkdownEditor', () => {
    it('renders without crashing', () => {
        render(<MarkdownEditor value="" onChange={() => { }} />);
        // Check if the editor container is present
        // TipTap creates a div with class 'ProseMirror'
        const editor = document.querySelector('.ProseMirror');
        expect(editor).toBeTruthy();
    });

    it('renders initial value', () => {
        render(<MarkdownEditor value="Hello World" onChange={() => { }} />);
        const editor = document.querySelector('.ProseMirror');
        expect(editor?.textContent).toContain('Hello World');
    });
});
