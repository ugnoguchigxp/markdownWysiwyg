import React, { useEffect, useState } from 'react';
import type { Translator } from '../../i18n/I18nContext';
import { I18N_KEYS } from '../../types/index';

interface LinkModalProps {
  isOpen: boolean;
  selectedText: string;
  onInsertMarkdown: (markdown: string) => void;
  onClose: () => void;
  t: Translator;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  selectedText,
  onInsertMarkdown,
  onClose,
  t,
}) => {
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLinkText(selectedText);
      setLinkUrl('');
    }
  }, [isOpen, selectedText]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (linkUrl.trim()) {
      const linkMarkdown = `[${linkText}](${linkUrl})`;
      onInsertMarkdown(linkMarkdown);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <button type="button" aria-label={t(I18N_KEYS.close)} className="absolute inset-0" onClick={onClose} />

      <div
        className="relative rounded-lg p-6 w-96 max-w-[90vw] mx-4 shadow-xl"
        style={{
          backgroundColor: 'var(--mw-bg-canvas, #ffffff)',
          color: 'var(--mw-text-primary, #111827)',
          border: '1px solid var(--mw-toolbar-border, #d1d5db)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--mw-heading-color, var(--mw-text-primary, #111827))' }}
        >
          {t(I18N_KEYS.insertLink)}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="mw-insert-link-text"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--mw-text-secondary)' }}
            >
              {t(I18N_KEYS.link.linkText)}
            </label>
            <input
              id="mw-insert-link-text"
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linkUrl.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                backgroundColor: 'var(--mw-bg-canvas, #ffffff)',
                borderColor: 'var(--mw-toolbar-border, #d1d5db)',
                color: 'var(--mw-text-primary, #111827)',
              }}
              placeholder={t(I18N_KEYS.link.enterLinkText)}
            />
          </div>

          <div>
            <label
              htmlFor="mw-insert-link-url"
              className="block text-sm font-medium text-foreground mb-1"
            >
              {t(I18N_KEYS.link.url)}
            </label>
            <input
              id="mw-insert-link-url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linkUrl.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
              style={{
                backgroundColor: 'var(--mw-bg-canvas, #ffffff)',
                borderColor: 'var(--mw-toolbar-border, #d1d5db)',
                color: 'var(--mw-text-primary, #111827)',
              }}
              placeholder={t(I18N_KEYS.link.urlPlaceholder)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            {t(I18N_KEYS.cancelButton)}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!linkUrl.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {t(I18N_KEYS.insert)}
          </button>
        </div>
      </div>
    </div>
  );
};
