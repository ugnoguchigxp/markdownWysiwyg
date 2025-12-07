import { renderHook, act } from '@testing-library/react';
import { useMarkdownEditor } from '../../src/hooks/useMarkdownEditor';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import JsonToMarkdownConverter from '../../src/converters/JsonToMarkdownConverter';

// Capture useEditor options
let capturedOptions: any = {};
const mockEditorInstance = {
    getJSON: vi.fn(),
    chain: vi.fn().mockReturnValue({
        focus: vi.fn().mockReturnThis(),
        run: vi.fn(),
    }),
    isDestroyed: false,
};

vi.mock('@tiptap/react', () => ({
    useEditor: (options: any) => {
        capturedOptions = options;
        return mockEditorInstance;
    },
}));

vi.mock('../../src/utils/logger', () => ({
    createLogger: () => ({
        warn: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    }),
}));

vi.mock('../../src/converters/JsonToMarkdownConverter', () => ({
    default: {
        convertToMarkdown: vi.fn(),
    }
}));

vi.mock('../../src/utils/selectionUtils', () => ({
    SelectionUtils: {
        getSelectionMarkdownSyntax: vi.fn(),
    },
}));

describe('useMarkdownEditor', () => {
    const defaultProps = {
        editable: true,
        placeholder: 'Placeholder',
        isUpdating: false,
        isProcessing: false,
        setIsProcessing: vi.fn(),
        setProcessingProgress: vi.fn(),
        setSelectionInfo: vi.fn(),
        setContent: vi.fn(),
        handleLinkContextMenu: vi.fn(),
        handleTableContextMenu: vi.fn(),
    };

    beforeEach(() => {
        capturedOptions = {};
        vi.clearAllMocks();
        mockEditorInstance.getJSON.mockReturnValue({ type: 'doc', content: [] });
    });

    it('initializes editor with correct configuration', () => {
        renderHook(() => useMarkdownEditor(defaultProps));
        expect(capturedOptions).toBeDefined();
        expect(capturedOptions.editable).toBe(true);
        expect(capturedOptions.content).toBe('');
        // Check extensions count or specific extensions
        expect(capturedOptions.extensions.length).toBeGreaterThan(0);
    });

    it('handles onUpdate callback', () => {
        const onChange = vi.fn();
        const onContentChange = vi.fn();
        const onMarkdownChange = vi.fn();

        renderHook(() => useMarkdownEditor({
            ...defaultProps,
            onChange,
            onContentChange,
            onMarkdownChange,
        }));

        (JsonToMarkdownConverter.convertToMarkdown as any).mockReturnValue('# Markdown');

        act(() => {
            capturedOptions.onUpdate({ editor: mockEditorInstance });
        });

        expect(defaultProps.setContent).toHaveBeenCalled();
        expect(onContentChange).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith('# Markdown');
        expect(onMarkdownChange).toHaveBeenCalledWith('# Markdown');
    });

    it('skips onUpdate if isUpdating or isProcessing', () => {
        const onChange = vi.fn();
        renderHook(() => useMarkdownEditor({
            ...defaultProps,
            isUpdating: true,
            onChange,
        }));

        act(() => {
            capturedOptions.onUpdate({ editor: mockEditorInstance });
        });

        expect(onChange).not.toHaveBeenCalled();
    });

    it('handles onBlur callback', () => {
        const onChange = vi.fn();
        const onMarkdownChange = vi.fn();

        renderHook(() => useMarkdownEditor({
            ...defaultProps,
            onChange,
            onMarkdownChange,
        }));

        (JsonToMarkdownConverter.convertToMarkdown as any).mockReturnValue('# Markdown');

        act(() => {
            capturedOptions.onBlur({ editor: mockEditorInstance });
        });

        expect(onChange).toHaveBeenCalledWith('# Markdown');
        expect(onMarkdownChange).toHaveBeenCalledWith('# Markdown');
    });

    it('handles onCreate callback', () => {
        const onEditorReady = vi.fn();
        renderHook(() => useMarkdownEditor({
            ...defaultProps,
            onEditorReady,
        }));

        act(() => {
            capturedOptions.onCreate({ editor: mockEditorInstance });
        });

        expect(onEditorReady).toHaveBeenCalledWith(mockEditorInstance);
    });
});
