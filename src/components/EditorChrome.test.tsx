import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EditorChrome } from '../../src/components/EditorChrome';

const mockMarkdownToolbar = vi.fn();
const mockMarkdownSyntaxStatus = vi.fn();

vi.mock('../../src/components/MarkdownToolbar', () => ({
  MarkdownToolbar: (props: unknown) => {
    mockMarkdownToolbar(props);
    return <div data-testid="markdown-toolbar" />;
  },
}));

vi.mock('../../src/components/MarkdownSyntaxStatus', () => ({
  MarkdownSyntaxStatus: (props: unknown) => {
    mockMarkdownSyntaxStatus(props);
    return <div data-testid="markdown-syntax-status" />;
  },
}));

describe('EditorChrome', () => {
  it('renders toolbar and passes props', () => {
    render(
      <EditorChrome
        editor={{} as Parameters<typeof EditorChrome>[0]['editor']}
        selectionInfo={
          { selectedText: 'text' } as Parameters<typeof EditorChrome>[0]['selectionInfo']
        }
        editable={true}
        effectiveShowToolbar={true}
        effectiveShowSyntaxStatus={false}
        effectiveShowPasteDebug={false}
        showDownloadButton={true}
        onDownloadAsMarkdown={vi.fn()}
        onInsertMarkdown={vi.fn()}
        pasteEvents={[]}
        onClearPasteEvents={vi.fn()}
      >
        <div data-testid="child" />
      </EditorChrome>,
    );

    expect(screen.getByTestId('markdown-toolbar')).toBeDefined();
    expect(screen.getByTestId('child')).toBeDefined();
    expect(mockMarkdownToolbar).toHaveBeenCalled();
  });

  it('renders syntax status when enabled', () => {
    render(
      <EditorChrome
        editor={{} as Parameters<typeof EditorChrome>[0]['editor']}
        selectionInfo={
          { selectedText: 'text' } as Parameters<typeof EditorChrome>[0]['selectionInfo']
        }
        editable={true}
        effectiveShowToolbar={false}
        effectiveShowSyntaxStatus={true}
        effectiveShowPasteDebug={false}
        showDownloadButton={false}
        onDownloadAsMarkdown={vi.fn()}
        onInsertMarkdown={vi.fn()}
        pasteEvents={[]}
        onClearPasteEvents={vi.fn()}
      >
        <div />
      </EditorChrome>,
    );

    expect(screen.getByTestId('markdown-syntax-status')).toBeDefined();
    expect(mockMarkdownSyntaxStatus).toHaveBeenCalled();
  });

  it('renders paste debug panel and clears events', () => {
    const onClearPasteEvents = vi.fn();
    render(
      <EditorChrome
        editor={{} as Parameters<typeof EditorChrome>[0]['editor']}
        selectionInfo={null}
        editable={true}
        effectiveShowToolbar={false}
        effectiveShowSyntaxStatus={false}
        effectiveShowPasteDebug={true}
        showDownloadButton={false}
        onDownloadAsMarkdown={vi.fn()}
        onInsertMarkdown={vi.fn()}
        pasteEvents={[
          {
            timestamp: 1,
            type: 'text/plain',
            content: 'a',
            result: 'b',
          },
        ]}
        onClearPasteEvents={onClearPasteEvents}
      >
        <div />
      </EditorChrome>,
    );

    const clearButton = screen.getByRole('button', { name: 'markdown_editor.clear' });
    fireEvent.click(clearButton);
    expect(onClearPasteEvents).toHaveBeenCalled();
  });
});
