import type { Editor } from '@tiptap/react';
import { clsx } from 'clsx';
import type React from 'react';
import { useCallback } from 'react';

import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS } from '../types/index';
// Imports assuming icons were added
import {
  AlignCenter,
  AlignHorizontalDistributeEnd,
  AlignHorizontalDistributeStart,
  AlignLeft,
  AlignRight,
  SizeLarge,
  SizeMedium,
  SizeSmall,
  Trash2,
} from './ui/icons';

interface IImageToolbarProps {
  editor: Editor;
  visible: boolean;
  position: { x: number; y: number };
}

export const ImageToolbar: React.FC<IImageToolbarProps> = ({ editor, visible, position }) => {
  const { t } = useI18n();

  const setAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .updateAttributes('image', { align, float: 'none' }) // Reset float when aligning
        .run();
    },
    [editor],
  );

  const setFloat = useCallback(
    (float: 'left' | 'right') => {
      if (!editor) return;
      editor.chain().focus().updateAttributes('image', { float }).run();
    },
    [editor],
  );

  const setWidth = useCallback(
    (width: string) => {
      if (!editor) return;
      editor.chain().focus().updateAttributes('image', { width }).run();
    },
    [editor],
  );

  const deleteImage = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

  if (!visible || !editor) return null;

  const { align, float, width } = editor.getAttributes('image') || {};

  return (
    <div
      className="image-toolbar absolute z-[1000] bg-background border border-border rounded-ui p-ui-y shadow-lg flex items-center justify-center gap-1"
      style={{
        left: position.x,
        top: position.y - 60, // Slightly lower as it's now single row
      }}
      onMouseDown={(e) => {
        // Stop propagation to prevent editor blur or selection change
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Alignment */}
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          align === 'left' && float === 'none' && 'bg-muted text-foreground',
        )}
        onClick={() => setAlign('left')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.alignLeft || 'Align Left')}
      >
        <AlignLeft size={16} />
      </button>
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          align === 'center' && float === 'none' && 'bg-muted text-foreground',
        )}
        onClick={() => setAlign('center')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.alignCenter || 'Align Center')}
      >
        <AlignCenter size={16} />
      </button>
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          align === 'right' && float === 'none' && 'bg-muted text-foreground',
        )}
        onClick={() => setAlign('right')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.alignRight || 'Align Right')}
      >
        <AlignRight size={16} />
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Float */}
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          float === 'left' && 'bg-muted text-foreground',
        )}
        onClick={() => setFloat('left')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.floatLeft || 'Float Left')}
      >
        <AlignHorizontalDistributeStart size={16} />
      </button>
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          float === 'right' && 'bg-muted text-foreground',
        )}
        onClick={() => setFloat('right')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.floatRight || 'Float Right')}
      >
        <AlignHorizontalDistributeEnd size={16} />
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Size */}
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          width === '150px' && 'bg-muted text-foreground',
        )}
        onClick={() => setWidth('150px')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.sizeSmall || 'Small')}
      >
        <SizeSmall size={16} />
      </button>
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          (width === 'auto' || !width) && 'bg-muted text-foreground',
        )}
        onClick={() => setWidth('auto')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.sizeMedium || 'Medium')}
      >
        <SizeMedium size={16} />
      </button>
      <button
        className={clsx(
          'p-btn-y border border-transparent rounded hover:bg-muted text-muted-foreground hover:text-foreground',
          width === '100%' && 'bg-muted text-foreground',
        )}
        onClick={() => setWidth('100%')}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.sizeLarge || 'Large')}
      >
        <SizeLarge size={16} />
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      <button
        className="p-btn-y border border-transparent rounded hover:bg-destructive/10 text-destructive hover:text-destructive"
        onClick={deleteImage}
        type="button"
        title={t(I18N_KEYS.imageToolbar?.delete || 'Delete Image')}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
