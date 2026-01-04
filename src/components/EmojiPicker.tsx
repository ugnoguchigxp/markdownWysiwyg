import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EMOJI_BY_CATEGORY, EMOJI_CATEGORIES, EMOJI_DATA } from '../constants/emojiData';
import { I18N_KEYS } from '../types';
import type { EmojiCategory, IEmoji, IEmojiCategoryMeta } from '../types';

const EMOJI_CATEGORY_GROUPS = [
  { id: 'smileys_people', tabIcon: '😀', categories: ['smileys', 'people'] },
  { id: 'animals_food', tabIcon: '🐶', categories: ['animals', 'food'] },
  { id: 'activities_travel', tabIcon: '⚽', categories: ['activities', 'travel'] },
  { id: 'objects_symbols', tabIcon: '💡', categories: ['objects', 'symbols'] },
  { id: 'flags', tabIcon: '🚩', categories: ['flags'] },
] as const;

type EmojiCategoryGroupId = (typeof EMOJI_CATEGORY_GROUPS)[number]['id'];

interface EmojiPickerProps {
  /** Called when an emoji is selected */
  onSelect: (emoji: string) => void;
  /** Called when the picker should close */
  onClose: () => void;
  /** Disable the picker */
  disabled?: boolean;
  /** Translator function from host app */
  t: (key: string, fallback?: string) => string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelect,
  onClose,
  disabled = false,
  t,
}) => {
  const [activeGroup, setActiveGroup] = useState<EmojiCategoryGroupId>('smileys_people');
  const [query, setQuery] = useState('');
  const pickerRef = useRef<HTMLDialogElement>(null);

  // Handle click outside to close
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

  const handleEmojiClick = (emoji: IEmoji) => {
    if (disabled) return;
    onSelect(emoji.char);
  };

  const filteredEmojis = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    return EMOJI_DATA.filter((e) => {
      if (e.name.toLowerCase().includes(q)) return true;
      return e.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [query]);

  const categoryMetaById = useMemo(() => {
    return new Map(EMOJI_CATEGORIES.map((c) => [c.id, c] as const));
  }, []);

  const activeCategories = useMemo(() => {
    const g = EMOJI_CATEGORY_GROUPS.find((x) => x.id === activeGroup);
    return (g?.categories ?? []) as EmojiCategory[];
  }, [activeGroup]);

  return (
    <dialog
      ref={pickerRef}
      className="mw-emoji-picker bg-popover text-popover-foreground border border-border shadow-xl rounded-xl"
      aria-label={t(I18N_KEYS.emoji.pickerTitle, 'Emoji picker')}
      open
    >
      <div className="mw-emoji-search">
        <input
          className="mw-emoji-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(I18N_KEYS.emoji.searchPlaceholder, 'Search emojis')}
          disabled={disabled}
        />
      </div>

      {/* Category tabs */}
      <div
        className="mw-emoji-categories"
        role="tablist"
        aria-label={t('markdown_editor.emoji.categories_label', 'Emoji categories')}
      >
        {EMOJI_CATEGORY_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            className={`mw-emoji-category-tab ${
              activeGroup === group.id ? 'mw-emoji-category-tab--active' : ''
            }`}
            role="tab"
            aria-selected={activeGroup === group.id}
            aria-controls={`emoji-panel-${group.id}`}
            onClick={() => setActiveGroup(group.id)}
            title={group.id}
            disabled={disabled}
          >
            <span className="mw-emoji-category-icon">{group.tabIcon}</span>
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div
        id={`emoji-panel-${activeGroup}`}
        className="mw-emoji-scroll"
        aria-label={t(I18N_KEYS.emoji.pickerTitle, 'Emoji picker')}
      >
        {query.trim() ? (
          <div className="mw-emoji-grid">
            {filteredEmojis.length === 0 ? (
              <div className="mw-emoji-empty">{t(I18N_KEYS.emoji.noResults, 'No results')}</div>
            ) : null}

            {filteredEmojis.map((emoji: IEmoji, index: number) => (
              <button
                key={`${emoji.char}-${index}`}
                type="button"
                className="mw-emoji-item"
                aria-label={emoji.name}
                title={emoji.name}
                onClick={() => handleEmojiClick(emoji)}
                disabled={disabled}
              >
                <span className="mw-emoji-char">{emoji.char}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mw-emoji-sections">
            {activeCategories.map((categoryId) => {
              const meta = categoryMetaById.get(categoryId) as IEmojiCategoryMeta | undefined;
              const emojis = EMOJI_BY_CATEGORY.get(categoryId) || [];

              return (
                <div key={categoryId} className="mw-emoji-section">
                  <div className="mw-emoji-section-header">
                    <span className="mw-emoji-section-icon">{meta?.icon}</span>
                    <span className="mw-emoji-section-title">
                      {t(
                        (I18N_KEYS.emoji.categories as Record<string, string>)[categoryId],
                        categoryId,
                      )}
                    </span>
                  </div>
                  <div className="mw-emoji-grid">
                    {emojis.map((emoji: IEmoji, index: number) => (
                      <button
                        key={`${categoryId}:${emoji.char}-${index}`}
                        type="button"
                        className="mw-emoji-item"
                        aria-label={emoji.name}
                        title={emoji.name}
                        onClick={() => handleEmojiClick(emoji)}
                        disabled={disabled}
                      >
                        <span className="mw-emoji-char">{emoji.char}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </dialog>
  );
};
