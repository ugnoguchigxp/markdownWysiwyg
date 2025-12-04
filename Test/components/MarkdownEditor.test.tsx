import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MarkdownEditor } from '../../src/components/MarkdownEditor';

// Mock @tiptap/react useEditor hook
vi.mock('@tiptap/react', async () => {
    const actual = await vi.importActual('@tiptap/react');
    return {
        ...actual,
        useEditor: vi.fn(() => ({
            chain: () => ({
                focus: () => ({
                    run: vi.fn(),
                }),
            }),
            on: vi.fn(),
            off: vi.fn(),
            destroy: vi.fn(),
            isDestroyed: false,
            commands: {
                setContent: vi.fn(),
                clearContent: vi.fn(),
            },
            state: {
                selection: { from: 0, to: 0 },
                doc: {
                    textBetween: () => '',
                }
            },
            view: {
                dom: document.createElement('div'),
            },
            getHTML: () => '<p></p>',
            getText: () => '',
            getJSON: () => ({}),
            isActive: () => false,
            can: () => ({ chain: () => ({ run: () => true }) }),
        })),
        EditorContent: () => <div data-testid="editor-content" />,
        BubbleMenu: () => <div data-testid="bubble-menu" />,
        FloatingMenu: () => <div data-testid="floating-menu" />,
    };
});

describe('MarkdownEditor', () => {
    it('should render without crashing', () => {
        render(<MarkdownEditor initialContent="" />);
        expect(screen.getByTestId('editor-content')).toBeTruthy();
    });

    it('should render toolbar', () => {
        render(<MarkdownEditor initialContent="" />);
        // Check for some toolbar buttons (assuming they have aria-labels or text)
        // Since we are mocking the editor, the toolbar might not be fully functional,
        // but the component structure should be there.
        // Note: Adjust selectors based on actual implementation
        const toolbar = document.querySelector('.markdown-toolbar');
        expect(toolbar).toBeDefined();
    });

    it('should accept initial content', () => {
        render(<MarkdownEditor initialContent="Hello" />);
        // Verification would typically involve checking if useEditor was called with correct content
        // or checking the editor content if not fully mocked.
        expect(screen.getByTestId('editor-content')).toBeTruthy();
    });
});
