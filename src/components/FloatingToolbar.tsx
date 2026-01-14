/**
 * FloatingToolbar - Floating toolbar that appears near text selection
 *
 * This component renders a toolbar that floats above the current text selection
 * in the editor, providing quick access to formatting options.
 */
import React from 'react';

import type { Editor } from '@tiptap/react';

import { MarkdownToolbar } from './MarkdownToolbar';

export interface FloatingToolbarProps {
    /** TipTap editor instance */
    editor: Editor;
    /** Whether the toolbar should be visible */
    visible: boolean;
    /** Position of the toolbar relative to editor container */
    position: { top: number; left: number };
    /** Handler for inserting markdown */
    onInsertMarkdown: (markdown: string, cursorOffset?: number) => void;
    /** Currently selected text */
    selectedText?: string;
    /** Whether the editor is in editable mode */
    editable: boolean;
    /** Whether to show download button */
    showDownloadButton?: boolean;
    /** Handler for download action */
    onDownloadAsMarkdown?: () => void;
}

/**
 * FloatingToolbar component
 *
 * Renders a floating toolbar above the current text selection
 */
export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    editor,
    visible,
    position,
    onInsertMarkdown,
    selectedText = '',
    editable,
    showDownloadButton = false,
    onDownloadAsMarkdown,
}) => {
    if (!visible || !editable) {
        return null;
    }

    // Check if there is text selection
    const hasTextSelection = selectedText.trim().length > 0;

    return (
        <div
            className="floating-toolbar absolute z-50 transform -translate-x-1/2 transition-opacity duration-150"
            style={{
                top: position.top,
                left: position.left,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
            }}
            // Prevent focus from leaving the editor when clicking toolbar
            onMouseDown={(e) => {
                // Stop propagation but don't prevent default to allow clicks
                e.stopPropagation();
            }}
        >
            <div className="bg-popover border border-border rounded-ui shadow-lg p-ui-y">
                <MarkdownToolbar
                    onInsertMarkdown={onInsertMarkdown}
                    selectedText={selectedText}
                    disabled={!editable}
                    editor={editor}
                    showDownloadButton={showDownloadButton}
                    onDownloadAsMarkdown={onDownloadAsMarkdown}
                    isFloating={true}
                    hasTextSelection={hasTextSelection}
                />
            </div>
        </div>
    );
};
