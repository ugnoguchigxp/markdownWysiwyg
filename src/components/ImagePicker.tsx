import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { I18N_KEYS } from '../types';

interface ImagePickerProps {
  onInsertMarkdown: (markdown: string) => void;
  onClose: () => void;
  disabled?: boolean;
  t: (key: string, fallback?: string) => string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onInsertMarkdown,
  onClose,
  disabled = false,
  t,
}) => {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const pickerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleInsert = () => {
    if (disabled) return;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const markdown = `![${alt}](${trimmedUrl})`;
    onInsertMarkdown(markdown);
    onClose();
  };

  return (
    <dialog
      ref={pickerRef}
      className="mw-image-picker"
      aria-label={t(I18N_KEYS.image.pickerTitle, 'Insert image')}
      open
      style={{
        backgroundColor: 'var(--mw-toolbar-bg, #ffffff)',
        borderColor: 'var(--mw-toolbar-border, #e5e7eb)',
        borderWidth: '1px',
        borderStyle: 'solid',
        color: 'var(--mw-toolbar-text, #111827)',
      }}
    >
      <div className="mw-image-body">
        <div className="mw-image-form">
          <label className="mw-image-label" htmlFor="mw-image-url">
            {t(I18N_KEYS.image.urlLabel, 'URL')}
          </label>
          <input
            id="mw-image-url"
            className="mw-image-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t(I18N_KEYS.image.urlPlaceholder, 'https://example.com/image.png')}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInsert();
              }
            }}
          />

          <label className="mw-image-label" htmlFor="mw-image-alt">
            {t(I18N_KEYS.image.altLabel, 'Alt')}
          </label>
          <input
            id="mw-image-alt"
            className="mw-image-input"
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder={t(I18N_KEYS.image.altPlaceholder, 'Alternative text')}
            disabled={disabled}
          />

          <div className="mw-image-actions">
            <button
              type="button"
              className="mw-image-insert"
              onClick={handleInsert}
              disabled={disabled || !url.trim()}
            >
              {t(I18N_KEYS.image.insert, 'Insert')}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};
