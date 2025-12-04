import { describe, it, expect, vi } from 'vitest';
import { SelectionUtils } from '../../src/utils/selectionUtils';

// Mock Editor and Selection
const createMockEditor = (selectionRange: { from: number; to: number; empty: boolean }, text: string = '', marks: any[] = []) => {
    return {
        state: {
            doc: {
                textBetween: vi.fn().mockReturnValue(text),
            },
            selection: {
                from: selectionRange.from,
                to: selectionRange.to,
                empty: selectionRange.empty,
                $from: {
                    parent: {
                        type: { name: 'paragraph' },
                        attrs: {}
                    },
                    marks: () => marks // Return the marks passed to the factory
                },
                content: () => ({
                    content: []
                })
            },
        },
        isActive: vi.fn().mockImplementation((markType) => {
            return marks.some(m => m.type.name === markType);
        }),
        getAttributes: vi.fn().mockReturnValue({}),
    } as any;
};

describe('SelectionUtils', () => {
    describe('getSelectionMarkdownSyntax', () => {
        it('should return node info if selection is empty (cursor position)', () => {
            const editor = createMockEditor({ from: 0, to: 0, empty: true });
            const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
            expect(info).not.toBeNull();
            expect(info?.markdownSyntax).toBe('(段落)');
        });

        it('should return plain text for simple selection', () => {
            const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Hello');
            const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
            expect(info?.markdownSyntax).toBe('Hello');
            expect((info as any)?.selectedText).toBe('Hello');
        });

        it('should detect active marks', () => {
            // Mock marks on the selection
            const marks = [{ type: { name: 'bold' } }];
            const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Bold Text', marks);

            const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
            expect(info?.marks).toContain('Bold');
        });

        it('should handle blockquote selection', () => {
            const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Quote');
            // Mock parent node as blockquote
            (editor.state.selection.$from.parent.type as any).name = 'blockquote';

            const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
            expect(info?.marks).toContain('Blockquote');
            expect(info?.markdownSyntax).toContain('> Quote');
        });

        it('should handle listItem selection', () => {
            const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Item');
            (editor.state.selection.$from.parent.type as any).name = 'listItem';

            const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
            expect(info?.marks).toContain('List Item');
            expect(info?.markdownSyntax).toContain('- Item');
        });

        it('should handle codeBlock selection', () => {
            const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'code');
            (editor.state.selection.$from.parent.type as any).name = 'codeBlock';
            (editor.state.selection.$from.parent as any).attrs = { language: 'js' };

            const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
            expect(info?.marks).toContain('Code Block');
            expect(info?.markdownSyntax).toContain('```js');
        });

        it('should handle link mark', () => {
            const marks = [{ type: { name: 'link' }, attrs: { href: 'http://example.com' } }];
            const editor = createMockEditor({ from: 0, to: 5, empty: false }, 'Link', marks);

            const info = SelectionUtils.getSelectionMarkdownSyntax(editor);
            expect(info?.marks).toContain('Link');
            expect(info?.markdownSyntax).toBe('[Link](http://example.com)');
        });
    });
});
