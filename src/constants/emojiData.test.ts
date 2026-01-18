import { describe, expect, it } from 'vitest';
import { EMOJI_BY_CATEGORY, EMOJI_CATEGORIES, EMOJI_DATA } from './emojiData';

describe('emoji data', () => {
  it('maps every category to its emojis', () => {
    const categoryIds = new Set(EMOJI_CATEGORIES.map((category) => category.id));

    expect(EMOJI_BY_CATEGORY.size).toBe(EMOJI_CATEGORIES.length);

    for (const [categoryId, emojis] of EMOJI_BY_CATEGORY.entries()) {
      expect(categoryIds.has(categoryId)).toBe(true);
      expect(emojis.length).toBeGreaterThan(0);
      expect(emojis.every((emoji) => emoji.category === categoryId)).toBe(true);
    }
  });

  it('uses only known categories in the emoji list', () => {
    const categoryIds = new Set(EMOJI_CATEGORIES.map((category) => category.id));
    const uniqueEmojiCategories = new Set(EMOJI_DATA.map((emoji) => emoji.category));

    for (const category of uniqueEmojiCategories) {
      expect(categoryIds.has(category)).toBe(true);
    }
  });
});
