import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MarkdownEditor } from '../../src/components/MarkdownEditor';

// Mock dependencies
vi.mock('../../src/utils/logger', () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}));

vi.mock('../../src/components/MarkdownToolbar', () => ({
    MarkdownToolbar: ({ onInsertMarkdown, onDownloadAsMarkdown }: any) => (
        <div data-testid="markdown-toolbar">
            <button onClick={() => onInsertMarkdown('****')} data-testid="btn-bold">Bold</button>
            <button onClick={() => onInsertMarkdown('**')} data-testid="btn-italic">Italic</button>
            <button onClick={() => onInsertMarkdown('# ')} data-testid="btn-heading">Heading</button>
            <button onClick={() => onInsertMarkdown('- ')} data-testid="btn-bullet">Bullet</button>
            <button onClick={() => onDownloadAsMarkdown()} data-testid="btn-download">Download</button>
        </div>
    ),
}));

vi.mock('../../src/components/LinkContextMenu', () => ({
    LinkContextMenu: ({ visible, onEditLink, onClose }: any) => (
        visible ? (
            <div data-testid="link-context-menu">
                <button onClick={() => onEditLink({ href: 'https://example.com', text: 'Example' })}>Edit Link</button>
                <button onClick={onClose}>Close</button>
            </div>
        ) : null
    ),
}));

vi.mock('../../src/components/TableContextMenu', () => ({
    TableContextMenu: ({ isVisible, onClose }: any) => (
        isVisible ? (
            <div data-testid="table-context-menu">
                <button onClick={onClose}>Close</button>
            </div>
        ) : null
    ),
}));

vi.mock('@tiptap/react', () => ({
    EditorContent: () => <div data-testid="editor-content" className="ProseMirror" />,
    BubbleMenu: ({ children }: any) => <div data-testid="bubble-menu">{children}</div>,
    FloatingMenu: ({ children }: any) => <div data-testid="floating-menu">{children}</div>,
}));

// Mock hook
const mockEditorCommands = {
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    setHeading: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    focus: vi.fn().mockReturnThis(),
    run: vi.fn(),
    setContent: vi.fn(),
    clearContent: vi.fn(),
    insertContent: vi.fn().mockReturnValue(true),
    deleteRange: vi.fn().mockReturnThis(),
    setTextSelection: vi.fn().mockReturnThis(),
};

const mockEditorChain = () => mockEditorCommands;

const mockEditor = {
    chain: mockEditorChain,
    commands: mockEditorCommands,
    isEditable: true,
    setEditable: vi.fn(),
    isFocused: false,
    isEmpty: false,
    state: {
        selection: { from: 0, to: 0 },
        doc: {
            textBetween: vi.fn().mockReturnValue(''),
            descendants: vi.fn(),
            content: { size: 0 },
        },
        schema: {
            marks: {
                link: { create: vi.fn() },
            },
            text: vi.fn(),
        },
        tr: {
            delete: vi.fn(),
            insert: vi.fn(),
        },
    },
    view: {
        updateState: vi.fn(),
        state: {},
        dispatch: vi.fn(),
        dom: document.createElement('div'),
    },
    getJSON: vi.fn().mockReturnValue({ content: [] }),
};

vi.mock('../../src/hooks/useMarkdownEditor', () => ({
    useMarkdownEditor: ({ onEditorReady }: any) => {
        // Simulate editor ready
        React.useEffect(() => {
            if (onEditorReady) onEditorReady(mockEditor);
        }, [onEditorReady]);
        return mockEditor;
    },
}));

vi.mock('../../src/hooks/useTableToolbar', () => ({
    useTableToolbar: () => ({ visible: false, position: null }),
}));

describe('MarkdownEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<MarkdownEditor value="" onChange={() => { }} />);
        expect(screen.getByTestId('markdown-toolbar')).toBeDefined();
    });

    it('handles toolbar actions (Bold)', () => {
        render(<MarkdownEditor value="" onChange={() => { }} />);
        fireEvent.click(screen.getByTestId('btn-bold'));
        expect(mockEditorCommands.toggleBold).toHaveBeenCalled();
        expect(mockEditorCommands.focus).toHaveBeenCalled();
        expect(mockEditorCommands.run).toHaveBeenCalled();
    });

    it('handles toolbar actions (Italic)', () => {
        render(<MarkdownEditor value="" onChange={() => { }} />);
        fireEvent.click(screen.getByTestId('btn-italic'));
        expect(mockEditorCommands.toggleItalic).toHaveBeenCalled();
    });

    it('handles toolbar actions (Heading)', () => {
        render(<MarkdownEditor value="" onChange={() => { }} />);
        fireEvent.click(screen.getByTestId('btn-heading'));
        // Since text is empty, it calls setHeading
        expect(mockEditorCommands.setHeading).toHaveBeenCalledWith({ level: 1 });
    });

    it('handles toolbar actions (Bullet List)', () => {
        render(<MarkdownEditor value="" onChange={() => { }} />);
        fireEvent.click(screen.getByTestId('btn-bullet'));
        expect(mockEditorCommands.toggleBulletList).toHaveBeenCalled();
    });

    it('handles download action', () => {
        render(<MarkdownEditor value="" onChange={() => { }} showDownloadButton={true} />);
        fireEvent.click(screen.getByTestId('btn-download'));
        // Verification relies on Logger being called or checking if getJSON was called
        expect(mockEditor.getJSON).toHaveBeenCalled();
    });

    it('updates editable state', () => {
        const { rerender } = render(<MarkdownEditor value="" onChange={() => { }} editable={true} />);
        rerender(<MarkdownEditor value="" onChange={() => { }} editable={false} />);
        expect(mockEditor.setEditable).toHaveBeenCalledWith(false);
    });

    it('clicks on editor area focuses editor', () => {
        const { container } = render(<MarkdownEditor value="" onChange={() => { }} />);
        // Find the container div that has the click handler
        // The structure is div > div(relative) > EditorContent
        // The click handler is on the div wrapping EditorContent
        const editorWrapper = container.querySelector('.cursor-text');
        if (editorWrapper) {
            fireEvent.click(editorWrapper);
            expect(mockEditorCommands.focus).toHaveBeenCalled();
        }
    });
});
