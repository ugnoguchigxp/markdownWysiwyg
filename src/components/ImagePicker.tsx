import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { I18N_KEYS } from '../types';

interface ImagePickerProps {
  onInsertMarkdown: (markdown: string) => void;
  onClose: () => void;
  onImageSourceSelect?: (file: File) => string | Promise<string>;
  disabled?: boolean;
  t: (key: string, fallback?: string) => string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onInsertMarkdown,
  onClose,
  onImageSourceSelect,
  disabled = false,
  t,
}) => {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (disabled || isUploading) return;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const markdown = `![${alt}](${trimmedUrl})`;
    onInsertMarkdown(markdown);
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageSourceSelect) return;

    setIsUploading(true);
    try {
      const result = await onImageSourceSelect(file);
      const markdown = `![${alt}](${result})`;
      onInsertMarkdown(markdown);
      onClose();
    } catch (error) {
      console.error('Failed to select image source:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      ref={pickerRef}
      className="mw-image-picker bg-popover text-popover-foreground border border-border shadow-lg ring-1 ring-black ring-opacity-5 rounded-ui"
      aria-label={t(I18N_KEYS.image.pickerTitle, 'Insert image')}
    >
      <div className="mw-image-body">
        <div className="mw-image-form">
          <div className="mw-image-file-section">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
              disabled={disabled || isUploading}
            />
            {onImageSourceSelect && (
              <button
                type="button"
                className="mw-image-file-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                {isUploading ? '...' : t(I18N_KEYS.image.chooseFile, 'Choose File')}
              </button>
            )}
          </div>

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
            disabled={disabled || isUploading}
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
            disabled={disabled || isUploading}
          />

          <div className="mw-image-actions">
            <button
              type="button"
              className="mw-image-insert"
              onMouseDown={(e) => {
                // Prevent default to keep editor focus
                e.preventDefault();
              }}
              onClick={handleInsert}
              disabled={disabled || isUploading || !url.trim()}
            >
              {t(I18N_KEYS.image.insert, 'Insert')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
