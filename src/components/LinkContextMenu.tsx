/**
 * LinkContextMenu - Context menu displayed when clicking on links
 *
 * Options menu shown when right-clicking or Ctrl+clicking on a link
 */

import type React from 'react';
import { useEffect, useState } from 'react';

import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS } from '../types/index';
import { Edit3, ExternalLink, X } from './ui/icons';

interface LinkContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  linkData: {
    href: string;
    text: string;
  } | null;
  onClose: () => void;
  onOpenLink: (href: string) => void;
  onEditLink: (linkData: { href: string; text: string }) => void;
}

export const LinkContextMenu: React.FC<LinkContextMenuProps> = ({
  visible,
  position,
  linkData,
  onClose,
  onOpenLink,
  onEditLink,
}) => {
  const { t } = useI18n();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState('');
  const [editUrl, setEditUrl] = useState('');

  useEffect(() => {
    if (linkData) {
      setEditText(linkData.text);
      setEditUrl(linkData.href);
    }
  }, [linkData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && typeof target.closest === 'function') {
        if (!target.closest('.link-context-menu') && !target.closest('.link-edit-modal')) {
          onClose();
        }
      } else {
        // Fallback: when target doesn't have closest method (e.g., in test environments)
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowEditModal(false);
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [visible, onClose]);

  const handleOpenLink = () => {
    if (linkData?.href) {
      onOpenLink(linkData.href);
      onClose();
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (linkData && editUrl.trim()) {
      onEditLink({
        href: editUrl.trim(),
        text: editText.trim() || editUrl.trim(),
      });
      setShowEditModal(false);
      onClose();
    }
  };

  const handleEditCancel = () => {
    if (linkData) {
      setEditText(linkData.text);
      setEditUrl(linkData.href);
    }
    setShowEditModal(false);
  };

  if (!visible || !linkData) {
    return null;
  }

  return (
    <>
      {/* Context Menu */}
      <div
        className="link-context-menu fixed bg-background border border-border rounded-ui shadow-lg py-ui-y min-w-48 z-50 bg-popover text-popover-foreground"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <button
          type="button"
          className="w-full px-ui-x py-ui-y text-left hover:bg-accent flex items-center space-x-2 text-sm text-foreground"
          onClick={handleOpenLink}
        >
          <ExternalLink className="w-icon-sm h-icon-sm text-primary" />
          <span>{t(I18N_KEYS.link.open)}</span>
        </button>

        <button
          type="button"
          className="w-full px-ui-x py-ui-y text-left hover:bg-accent flex items-center space-x-2 text-sm text-foreground"
          onClick={handleEditClick}
        >
          <Edit3 className="w-icon-sm h-icon-sm text-muted-foreground" />
          <span>{t(I18N_KEYS.link.edit)}</span>
        </button>

        <div className="border-t border-border my-1" />

        <div className="px-ui-x py-1 text-xs text-muted-foreground truncate">{linkData.href}</div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div
            className="link-edit-modal bg-background rounded-ui p-ui-modal w-96 max-w-[90vw] mx-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">{t(I18N_KEYS.link.edit)}</h3>
              <button
                type="button"
                onClick={handleEditCancel}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label={t(I18N_KEYS.close)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Link Text */}
              <div>
                <label
                  htmlFor="mw-link-edit-text"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  {t(I18N_KEYS.link.linkText)}
                </label>
                <input
                  id="mw-link-edit-text"
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editUrl.trim()) {
                      e.preventDefault();
                      handleEditSubmit();
                    }
                  }}
                  className="w-full px-ui-x py-ui-y border border-input rounded-ui focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
                  placeholder={t(I18N_KEYS.link.enterLinkText)}
                />
              </div>

              {/* URL */}
              <div>
                <label
                  htmlFor="mw-link-edit-url"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  {t(I18N_KEYS.link.url)}
                </label>
                <input
                  id="mw-link-edit-url"
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editUrl.trim()) {
                      e.preventDefault();
                      handleEditSubmit();
                    }
                  }}
                  className="w-full px-ui-x py-ui-y border border-input rounded-ui focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
                  placeholder={t(I18N_KEYS.link.urlPlaceholder)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-[calc(var(--spacing-ui-y)*2)]">
              <button
                type="button"
                onClick={handleEditCancel}
                className="px-btn-x py-btn-y text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(I18N_KEYS.cancelButton)}
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={!editUrl.trim()}
                className="px-btn-x py-btn-y bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-ui transition-colors"
              >
                {t(I18N_KEYS.update)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
