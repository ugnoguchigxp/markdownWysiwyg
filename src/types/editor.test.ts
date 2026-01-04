import type { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import type { ExtendedEditor } from '../../src/types/editor';

describe('ExtendedEditor type', () => {
  it('allows creating an ExtendedEditor instance', () => {
    const editor = {} as Editor;
    const extendedEditor = editor as ExtendedEditor;

    expect(extendedEditor).toBeDefined();

    extendedEditor.__isProcessing = true;
    expect(extendedEditor.__isProcessing).toBe(true);

    extendedEditor.__preventUpdate = true;
    expect(extendedEditor.__preventUpdate).toBe(true);

    extendedEditor.__isProcessing = false;
    expect(extendedEditor.__isProcessing).toBe(false);
  });

  it('has optional properties', () => {
    const editor = {} as ExtendedEditor;

    expect(editor.__isProcessing).toBeUndefined();
    expect(editor.__preventUpdate).toBeUndefined();
  });
});
