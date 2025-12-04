import type { Editor } from '@tiptap/core';

// Extended editor type shared across components and hooks
export interface ExtendedEditor extends Editor {
  __isProcessing?: boolean;
  __preventUpdate?: boolean;
}
