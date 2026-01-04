import type React from 'react';
import { useEffect, useState } from 'react';
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
      <button
        type="button"
        aria-label={t(I18N_KEYS.close)}
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        className="relative rounded-ui p-ui-modal w-96 max-w-[90vw] mx-4 shadow-xl bg-background text-foreground border border-border"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-ui-y text-foreground">{t(I18N_KEYS.insertLink)}</h3>

        <div className="space-y-ui-y">
          <div>
            <label
              htmlFor="mw-insert-link-text"
              className="block text-sm font-medium mb-1 text-muted-foreground"
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
              className="w-full px-ui-x py-ui-y border rounded-ui focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background border-border text-foreground"
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
              className="w-full px-ui-x py-ui-y border rounded-ui focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background border-border text-foreground"
              placeholder={t(I18N_KEYS.link.urlPlaceholder)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-[calc(var(--ui-component-padding-y)*2)]">
          <button
            type="button"
            onClick={onClose}
            className="px-btn-x py-btn-y text-muted-foreground hover:text-foreground hover:bg-accent rounded-ui transition-colors"
          >
            {t(I18N_KEYS.cancelButton)}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!linkUrl.trim()}
            className="px-btn-x py-btn-y bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-ui transition-colors"
          >
            {t(I18N_KEYS.insert)}
          </button>
        </div>
      </div>
    </div>
  );
};
