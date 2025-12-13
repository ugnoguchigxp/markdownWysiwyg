import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { MarkdownSyntaxStatus } from '../../src/components/MarkdownSyntaxStatus';

describe('MarkdownSyntaxStatus', () => {
  it('renders hint when no selectionInfo', () => {
    render(<MarkdownSyntaxStatus selectionInfo={null} />);
    expect(
      screen.getByText('Place cursor on text or select text to display Markdown syntax'),
    ).toBeTruthy();
  });

  it('renders selected text, markdown syntax, marks, and node type', () => {
    render(
      <MarkdownSyntaxStatus
        selectionInfo={{
          selectedText: 'Hello',
          markdownSyntax: '**Hello**',
          nodeType: 'paragraph',
          marks: ['Bold', 'Italic'],
        }}
      />,
    );

    expect(screen.getByText('Selected Text:')).toBeTruthy();
    expect(screen.getByText('"Hello"')).toBeTruthy();
    expect(screen.getByText('Markdown Syntax:')).toBeTruthy();
    expect(screen.getByText('**Hello**')).toBeTruthy();
    expect(screen.getByText('Bold')).toBeTruthy();
    expect(screen.getByText('Italic')).toBeTruthy();
    expect(screen.getByText('paragraph')).toBeTruthy();
  });

  it('renders hint when selectedText is empty/whitespace', () => {
    render(
      <MarkdownSyntaxStatus
        selectionInfo={{
          selectedText: '   ',
          markdownSyntax: '',
          nodeType: 'paragraph',
          marks: [],
        }}
      />,
    );

    expect(
      screen.getByText('Place cursor on text or select text to display Markdown syntax'),
    ).toBeTruthy();
  });
});
