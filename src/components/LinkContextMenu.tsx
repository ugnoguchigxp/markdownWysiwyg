/**
 * LinkContextMenu - Context menu displayed when clicking on links
 *
 * Options menu shown when right-clicking or Ctrl+clicking on a link
 */

import type React from 'react';
import { useEffect, useState } from 'react';

import { Edit3, ExternalLink, X } from 'lucide-react';
import { I18N_KEYS } from '../types/index';
import { useI18n } from '../i18n/I18nContext';

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
        className="link-context-menu fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <button
          type="button"
          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-sm"
          onClick={handleOpenLink}
        >
          <ExternalLink className="w-3 h-3 text-blue-500" />
          <span>{t(I18N_KEYS.link.open)}</span>
        </button>

        <button
          type="button"
          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-sm"
          onClick={handleEditClick}
        >
          <Edit3 className="w-3 h-3 text-gray-600" />
          <span>{t(I18N_KEYS.link.edit)}</span>
        </button>

        <div className="border-t border-gray-200 my-1" />

        <div className="px-4 py-1 text-xs text-gray-500 truncate">{linkData.href}</div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div
            className="link-edit-modal bg-white rounded-lg p-6 w-96 max-w-[90vw] mx-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t(I18N_KEYS.link.edit)}</h3>
              <button
                type="button"
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600 p-1"
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
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t(I18N_KEYS.link.enterLinkText)}
                />
              </div>

              {/* URL */}
              <div>
                <label
                  htmlFor="mw-link-edit-url"
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t(I18N_KEYS.link.urlPlaceholder)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleEditCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t(I18N_KEYS.cancelButton)}
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={!editUrl.trim()}
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
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
