import type React from 'react';
import type { Translator } from '../../i18n/I18nContext';
import { I18N_KEYS } from '../../types/index';
import { Download } from '../ui/icons';

interface DownloadMenuProps {
  isOpen: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDownloadAsMarkdown: () => void;
  t: Translator;
}

export const DownloadMenu: React.FC<DownloadMenuProps> = ({
  isOpen,
  disabled = false,
  onToggle,
  onClose,
  onDownloadAsMarkdown,
  t,
}) => (
  <div className="relative group">
    <button
      type="button"
      onClick={onToggle}
      onMouseDown={(e) => {
        // Prevent default to keep editor focus
        e.preventDefault();
      }}
      disabled={disabled}
      data-tooltip={t(I18N_KEYS.download)}
      className={`
        w-8 h-8 flex items-center justify-center rounded-[var(--radius)] transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        relative text-foreground hover:bg-accent
      `}
    >
      <Download className="w-icon-md h-icon-md" />
      <svg
        className="w-icon-xs h-icon-xs absolute -bottom-0.5 -right-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <title>{t(I18N_KEYS.openDownloadMenu)}</title>
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>

    {isOpen && (
      <>
        <button
          type="button"
          aria-label={t(I18N_KEYS.closeDownloadMenu)}
          className="fixed inset-0 z-10 bg-transparent"
          onClick={onClose}
        />

        <div
          className={`
          absolute right-0 mt-ui-y w-64 bg-popover rounded-[calc(var(--radius)+4px)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-border
          transform transition-all duration-200 origin-top-right
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        >
          <div className="py-ui-y">
            <div className="px-ui-x py-ui-y border-b border-border">
              <h3 className="text-sm font-semibold text-popover-foreground">
                {t(I18N_KEYS.exportMenuTitle)}
              </h3>
              <p className="text-xs mt-1 text-muted-foreground">
                {t(I18N_KEYS.exportMenuDescription)}
              </p>
            </div>

            <button
              type="button"
              onMouseDown={(e) => {
                // Prevent default to keep editor focus
                e.preventDefault();
              }}
              onClick={() => {
                onDownloadAsMarkdown();
                onClose();
              }}
              className="w-full text-left px-ui-x py-ui-y transition-all duration-150 border-l-4 border-transparent bg-popover text-popover-foreground hover:bg-accent"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-ui flex items-center justify-center bg-accent">
                  <Download className="w-icon-sm h-icon-sm text-popover-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-popover-foreground">
                    {t(I18N_KEYS.markdownFile)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(I18N_KEYS.saveAsMarkdownFile)}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </>
    )}
  </div>
);
