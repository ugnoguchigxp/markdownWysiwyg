import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { MarkdownSyntaxStatus } from '../../src/components/MarkdownSyntaxStatus';
import { I18N_KEYS } from '../../src/types/index';

describe('MarkdownSyntaxStatus', () => {
  it('renders hint when no selectionInfo', () => {
    render(<MarkdownSyntaxStatus selectionInfo={null} />);
    expect(screen.getByText(I18N_KEYS.syntaxStatus.help)).toBeTruthy();
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

    expect(screen.getByText(new RegExp(`${I18N_KEYS.syntaxStatus.selectedText}`))).toBeTruthy();
    expect(screen.getByText('"Hello"')).toBeTruthy();
    expect(screen.getByText(new RegExp(`${I18N_KEYS.syntaxStatus.markdownSyntax}`))).toBeTruthy();
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

    expect(screen.getByText(I18N_KEYS.syntaxStatus.help)).toBeTruthy();
  });
});
