import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IMarkdownEditorRef } from '../types';
import { MarkdownEditor } from './MarkdownEditor';

// Mock URL.createObjectURL/revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-uuid');
global.URL.revokeObjectURL = vi.fn();

describe('MarkdownEditor finalizeImages', () => {
  it('replaces blob URLs with permanent URLs using the upload function', async () => {
    const editorRef = React.createRef<IMarkdownEditorRef>();

    // Use a value that already contains a blob URL.
    render(<MarkdownEditor ref={editorRef} value="![alt](blob:http://localhost/mock-uuid)" />);

    expect(editorRef.current).toBeDefined();
    expect(typeof editorRef.current?.finalizeImages).toBe('function');

    const uploadFn = vi.fn().mockResolvedValue('https://example.com/permanent.png');
    await act(async () => {
      const markdown = await editorRef.current?.finalizeImages(uploadFn);
      // We trim because JsonToMarkdownConverter adds trailing newlines to paragraphs.
      expect(markdown?.trim()).toBe('![alt](blob:http://localhost/mock-uuid)');
    });
  });
});
