# 絵文字ピッカー機能 計画書

> **ステータス**: Draft  
> **作成日**: 2024-12-18  
> **最終更新**: 2024-12-18

---

## 目次

1. [概要](#概要)
2. [機能要件](#機能要件)
3. [技術設計](#技術設計)
4. [実装計画](#実装計画)
5. [i18n対応](#i18n対応)
6. [アクセシビリティ](#アクセシビリティ)
7. [パフォーマンス考慮](#パフォーマンス考慮)
8. [エッジケース](#エッジケース)
9. [テスト計画](#テスト計画)
10. [見積もり](#見積もり)
11. [リスクと軽減策](#リスクと軽減策)
12. [次のステップ](#次のステップ)
13. [変更履歴](#変更履歴)

---

## 概要

MarkdownToolbarに**Slackスタンプ風の絵文字ピッカー機能**を追加する。ユーザーがツールバーのボタンをクリックすると、絵文字一覧がポップアップ表示され、選択した絵文字がエディタに挿入される。

### ゴール
- ユーザーがマウス操作で簡単に絵文字を挿入できる
- 頻繁に使う絵文字に素早くアクセスできる
- 既存のツールバーUIと統一感のあるデザイン

### 非ゴール
- カスタム絵文字のアップロード機能
- 絵文字のスキントーン（肌色）バリエーション対応
- 絵文字のアニメーション表示

---

## 機能要件

### 1. 基本機能
- ツールバーに絵文字ボタン（Lucide `Smile` アイコン）を追加
- ボタンクリックでポップアップパネルを表示
- 絵文字をクリックすると編集エリアのカーソル位置に挿入
- パネル外クリックまたはEscapeキーで閉じる
- 挿入後もパネルは開いたまま（連続挿入可能）

### 2. 絵文字カテゴリ
Unicode標準に準拠したカテゴリ分類（9カテゴリ）：

| カテゴリID | アイコン | 日本語名 | 英語名 |
|-----------|---------|---------|--------|
| `smileys` | 😀 | スマイリー & 感情 | Smileys & Emotion |
| `people` | 👋 | 人 & 体 | People & Body |
| `animals` | 🐶 | 動物 & 自然 | Animals & Nature |
| `food` | 🍔 | 食べ物 & 飲み物 | Food & Drink |
| `activities` | ⚽ | アクティビティ | Activities |
| `travel` | ✈️ | 旅行 & 場所 | Travel & Places |
| `objects` | 💡 | オブジェクト | Objects |
| `symbols` | 🔣 | シンボル | Symbols |
| `flags` | 🚩 | フラグ | Flags |

### 3. UI/UX要件

#### 必須機能（MVP）
- **グリッド表示**: 絵文字を8列のグリッドで表示
- **カテゴリタブ**: アイコンタブでカテゴリ切り替え
- **ホバープレビュー**: ツールチップで絵文字名を表示

#### 追加機能（Phase 2）
- **検索機能**: 絵文字名・キーワードで検索（英語のみ）
- **最近使用した絵文字**: 上部に最大24個表示（LocalStorage保存）
- **キーボードナビゲーション**: 矢印キーで移動、Enterで選択、Escで閉じる

### 4. デザイン仕様

```
┌─────────────────────────────────────┐
│ 🔍 Search emojis...                 │  ← 検索バー（Phase 2）
├─────────────────────────────────────┤
│ 🕐 Recently Used                    │  ← 最近使用（Phase 2）
│ 😀 😂 ❤️ 👍 🎉 🔥 ✨ 🙏            │
├─────────────────────────────────────┤
│ 😀 👋 🐶 🍔 ⚽ ✈️ 💡 🔣 🚩         │  ← カテゴリタブ
├─────────────────────────────────────┤
│ 😀 😃 😄 😁 😆 😅 🤣 😂            │
│ 🙂 🙃 😉 😊 😇 🥰 😍 🤩            │  ← 絵文字グリッド
│ 😘 😗 ☺️ 😚 😙 🥲 😋 😛            │     （スクロール可能）
│ ...                                 │
└─────────────────────────────────────┘

サイズ: 320px × 400px（最大）
グリッド: 8列
絵文字ボタン: 36px × 36px（絵文字自体は24px）
```

#### スタイル変数
既存のツールバースタイル変数を使用（`src/index.css` で定義済み）：
- `--mw-toolbar-bg`: 背景色
- `--mw-toolbar-text`: テキスト色
- `--mw-toolbar-border`: ボーダー色
- `--mw-toolbar-hover-bg`: ホバー時背景色
- `--mw-bg-canvas`: キャンバス背景色
- `--mw-text-primary`: プライマリテキスト色
- `--mw-text-secondary`: セカンダリテキスト色

#### CSSクラス命名規則
既存のプロジェクト規則に準拠：
- プレフィックス: `mw-emoji-*`
- 例: `mw-emoji-picker`, `mw-emoji-grid`, `mw-emoji-category-tab`

#### レスポンシブ対応
- **デスクトップ**: 320px × 400px（固定）
- **タブレット**: 同上
- **モバイル**: 画面幅に応じて調整（最小280px）、下からスライドアップ表示を検討（将来対応）

#### ポップアップ位置
- トリガーボタンの下に表示（`top: 100%`, `left: 0`）
- 画面端では自動調整（右端の場合は `right: 0` に切り替え）
- 既存のドロップダウン（Headingメニュー等）と同じパターン

#### アニメーション
- **開く**: `animate-in slide-in-from-top-2 duration-200`（既存Toolbarと同じ）
- **閉じる**: 即時（アニメーションなし）

#### Z-index管理
- ピッカーパネル: `z-20`（既存ドロップダウンと同じ）
- 背景オーバーレイ: `z-10`

---

## 技術設計

### ファイル構成

```
src/
├── components/
│   └── EmojiPicker.tsx          # 絵文字ピッカー（単一コンポーネント）
├── constants/
│   └── emojiData.ts             # 絵文字データ定義
├── hooks/
│   └── useRecentEmojis.ts       # 最近使用した絵文字管理（Phase 2）
├── types/
│   └── index.ts                 # 既存ファイルに型追加
└── index.ts                     # EmojiPickerをexport追加
```

> **設計方針**: コンポーネントは過度に分割せず、`EmojiPicker.tsx`に統合する。
> 内部で検索・カテゴリ・グリッドのロジックを持つが、外部には単一コンポーネントとして公開。

### 依存関係

#### 新規追加なし
この機能は既存の依存関係のみで実装可能：
- `react` - 既存
- `lucide-react` - 既存（`Smile` アイコン使用）
- `@tiptap/react` - 既存（エディタ操作）

#### 不要な依存関係
外部絵文字ライブラリは使用しない（理由は「絵文字データ戦略」セクション参照）。

### Export方針

`src/index.ts` に追加：

```typescript
// Components
export { EmojiPicker } from './components/EmojiPicker';

// Hooks (Phase 2)
export { useRecentEmojis } from './hooks/useRecentEmojis';

// Types
export type { IEmoji, EmojiCategory, IEmojiCategoryMeta } from './types/index';

// Constants (optional - for advanced customization)
export { EMOJI_DATA, EMOJI_CATEGORIES, EMOJI_BY_CATEGORY } from './constants/emojiData';
```

### 型定義

`src/types/index.ts` に追加：

```typescript
/**
 * Emoji data structure
 */
export interface IEmoji {
  /** Emoji character (e.g., "😀") */
  char: string;
  /** English name for search and accessibility (e.g., "grinning face") */
  name: string;
  /** Search keywords (e.g., ["happy", "smile"]) */
  keywords: string[];
  /** Category ID */
  category: EmojiCategory;
}

export type EmojiCategory =
  | 'smileys'
  | 'people'
  | 'animals'
  | 'food'
  | 'activities'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags';

/**
 * Category metadata for display
 */
export interface IEmojiCategoryMeta {
  id: EmojiCategory;
  icon: string;        // Representative emoji
  i18nKey: string;     // I18N key for category name
}
```

### コンポーネント設計

#### EmojiPicker

```typescript
interface EmojiPickerProps {
  /** Called when an emoji is selected */
  onSelect: (emoji: string) => void;
  /** Called when the picker should close */
  onClose: () => void;
  /** Disable the picker */
  disabled?: boolean;
}
```

**内部状態**:
- `activeCategory: EmojiCategory` - 現在選択中のカテゴリ
- `searchQuery: string` - 検索クエリ（Phase 2）
- `focusedIndex: number` - キーボードナビゲーション用（Phase 2）

**レンダリング構造**:
```tsx
<div className="mw-emoji-picker" role="dialog" aria-label={t(I18N_KEYS.emoji.pickerTitle)}>
  {/* 検索バー（Phase 2） */}
  <div className="mw-emoji-search">...</div>
  
  {/* 最近使用（Phase 2） */}
  {recentEmojis.length > 0 && <div className="mw-emoji-recent">...</div>}
  
  {/* カテゴリタブ */}
  <div className="mw-emoji-categories" role="tablist">...</div>
  
  {/* 絵文字グリッド */}
  <div className="mw-emoji-grid" role="grid">...</div>
</div>
```

### MarkdownToolbarへの統合

`MarkdownToolbar.tsx` に以下を追加：

```typescript
// State
const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

// Handler
const handleEmojiSelect = (emoji: string) => {
  if (editor) {
    editor.chain().focus().insertContent(emoji).run();
  }
};

// toolbarItems に追加
{
  icon: Smile,  // from lucide-react
  title: t(I18N_KEYS.emoji.button),
  onClick: () => setShowEmojiPicker(!showEmojiPicker),
  group: 'insert',
}
```

### 絵文字データ戦略

#### 採用: 静的データ（カスタム定義）

**理由**:
1. **バンドルサイズ制御**: 必要な絵文字のみ含める（約300個、~15KB gzip）
2. **依存関係なし**: 外部ライブラリ不要
3. **カスタマイズ可能**: プロジェクトに適した絵文字セットを選定
4. **型安全**: TypeScriptで完全な型定義

**データ構造** (`constants/emojiData.ts`):

```typescript
import type { IEmoji, IEmojiCategoryMeta, EmojiCategory } from '../types';

export const EMOJI_CATEGORIES: IEmojiCategoryMeta[] = [
  { id: 'smileys', icon: '😀', i18nKey: 'markdown_editor.emoji.categories.smileys' },
  { id: 'people', icon: '👋', i18nKey: 'markdown_editor.emoji.categories.people' },
  // ...
];

export const EMOJI_DATA: IEmoji[] = [
  // Smileys & Emotion
  { char: '😀', name: 'grinning face', keywords: ['happy', 'smile'], category: 'smileys' },
  { char: '😃', name: 'grinning face with big eyes', keywords: ['happy', 'joy'], category: 'smileys' },
  // ... 約300個
];

// カテゴリ別にグループ化したMap（パフォーマンス用）
export const EMOJI_BY_CATEGORY: Map<EmojiCategory, IEmoji[]> = new Map(
  EMOJI_CATEGORIES.map(cat => [
    cat.id,
    EMOJI_DATA.filter(e => e.category === cat.id)
  ])
);
```

**不採用: 外部ライブラリ**

| ライブラリ | サイズ | 不採用理由 |
|-----------|--------|-----------|
| `emoji-mart` | ~200KB | サイズ過大、React依存バージョン問題 |
| `emoji-picker-react` | ~150KB | サイズ過大 |
| `emojibase` | ~50KB | データのみだが過剰 |

### 状態管理（Phase 2）

```typescript
// hooks/useRecentEmojis.ts
const STORAGE_KEY = 'mw-recent-emojis';
const MAX_RECENT = 24;

export function useRecentEmojis() {
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecent = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      const updated = [emoji, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage quota exceeded - ignore
      }
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentEmojis([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { recentEmojis, addRecent, clearRecent };
}
```

---

## 実装計画

### Phase 1: 基本実装（MVP）
1. [ ] 型定義を `types/index.ts` に追加
2. [ ] I18Nキーを `types/index.ts` に追加
3. [ ] 絵文字データ作成 (`constants/emojiData.ts`) - 各カテゴリ10-20個、合計約100個
4. [ ] `EmojiPicker.tsx` コンポーネント作成（カテゴリタブ + グリッド）
5. [ ] `MarkdownToolbar.tsx` への統合
6. [ ] 基本スタイリング（`index.css`）

**受け入れ基準 (Phase 1)**:
- ツールバーに絵文字ボタンが表示される
- ボタンクリックでピッカーが開く
- カテゴリタブで絵文字を切り替えられる
- 絵文字クリックでエディタに挿入される
- パネル外クリックで閉じる
- ダークモードで正しく表示される

### Phase 2: UX改善
7. [ ] 検索機能実装（デバウンス付き）
8. [ ] `useRecentEmojis` フック作成
9. [ ] 最近使用した絵文字セクション追加
10. [ ] キーボードナビゲーション実装

**受け入れ基準 (Phase 2)**:
- 検索ボックスに入力すると絵文字がフィルタリングされる
- 最近使用した絵文字が上部に表示される
- ページリロード後も最近使用が保持される
- 矢印キーで絵文字間を移動できる
- Escapeキーでピッカーが閉じる

### Phase 3: 仕上げ
11. [ ] アクセシビリティ監査・修正
12. [ ] パフォーマンス計測・最適化
13. [ ] ユニットテスト作成
14. [ ] ドキュメント更新（README）

**受け入れ基準 (Phase 3)**:
- スクリーンリーダーで操作可能
- Lighthouseアクセシビリティスコア 90+
- ユニットテストカバレッジ 80%+
- READMEに使用方法が記載されている

---

## i18n対応

`types/index.ts` の `I18N_KEYS` に追加（既存の命名規則 `markdown_editor.*` に準拠）：

```typescript
// I18N_KEYS に追加
emoji: {
  button: 'markdown_editor.emoji.button',
  pickerTitle: 'markdown_editor.emoji.picker_title',
  searchPlaceholder: 'markdown_editor.emoji.search_placeholder',
  recentlyUsed: 'markdown_editor.emoji.recently_used',
  clearRecent: 'markdown_editor.emoji.clear_recent',
  noResults: 'markdown_editor.emoji.no_results',
  categories: {
    smileys: 'markdown_editor.emoji.categories.smileys',
    people: 'markdown_editor.emoji.categories.people',
    animals: 'markdown_editor.emoji.categories.animals',
    food: 'markdown_editor.emoji.categories.food',
    activities: 'markdown_editor.emoji.categories.activities',
    travel: 'markdown_editor.emoji.categories.travel',
    objects: 'markdown_editor.emoji.categories.objects',
    symbols: 'markdown_editor.emoji.categories.symbols',
    flags: 'markdown_editor.emoji.categories.flags',
  },
},
```

**翻訳例**（ホストアプリ側で定義）:

```json
{
  "markdown_editor.emoji.button": "Insert emoji",
  "markdown_editor.emoji.picker_title": "Emoji picker",
  "markdown_editor.emoji.search_placeholder": "Search emojis...",
  "markdown_editor.emoji.recently_used": "Recently used",
  "markdown_editor.emoji.clear_recent": "Clear recent",
  "markdown_editor.emoji.no_results": "No emojis found",
  "markdown_editor.emoji.categories.smileys": "Smileys & Emotion",
  "markdown_editor.emoji.categories.people": "People & Body",
  "markdown_editor.emoji.categories.animals": "Animals & Nature",
  "markdown_editor.emoji.categories.food": "Food & Drink",
  "markdown_editor.emoji.categories.activities": "Activities",
  "markdown_editor.emoji.categories.travel": "Travel & Places",
  "markdown_editor.emoji.categories.objects": "Objects",
  "markdown_editor.emoji.categories.symbols": "Symbols",
  "markdown_editor.emoji.categories.flags": "Flags"
}
```

**日本語翻訳例**:

```json
{
  "markdown_editor.emoji.button": "絵文字を挿入",
  "markdown_editor.emoji.picker_title": "絵文字ピッカー",
  "markdown_editor.emoji.search_placeholder": "絵文字を検索...",
  "markdown_editor.emoji.recently_used": "最近使用した絵文字",
  "markdown_editor.emoji.clear_recent": "履歴をクリア",
  "markdown_editor.emoji.no_results": "絵文字が見つかりません",
  "markdown_editor.emoji.categories.smileys": "スマイリー & 感情",
  "markdown_editor.emoji.categories.people": "人 & 体",
  "markdown_editor.emoji.categories.animals": "動物 & 自然",
  "markdown_editor.emoji.categories.food": "食べ物 & 飲み物",
  "markdown_editor.emoji.categories.activities": "アクティビティ",
  "markdown_editor.emoji.categories.travel": "旅行 & 場所",
  "markdown_editor.emoji.categories.objects": "オブジェクト",
  "markdown_editor.emoji.categories.symbols": "シンボル",
  "markdown_editor.emoji.categories.flags": "フラグ"
}
```

---

## アクセシビリティ

### ARIA属性

```tsx
// ピッカー全体
<div
  role="dialog"
  aria-label={t(I18N_KEYS.emoji.pickerTitle)}
  aria-modal="true"
>

// カテゴリタブ
<div role="tablist" aria-label="Emoji categories">
  <button
    role="tab"
    aria-selected={activeCategory === cat.id}
    aria-controls={`emoji-panel-${cat.id}`}
  >

// 絵文字グリッド
<div
  role="grid"
  aria-label={t(I18N_KEYS.emoji.categories[activeCategory])}
>
  <button
    role="gridcell"
    aria-label={emoji.name}
    title={emoji.name}
  >
```

### キーボード操作

| キー | 動作 |
|-----|------|
| `Tab` | 検索 → カテゴリ → グリッド間を移動 |
| `Arrow Left/Right` | カテゴリタブ間を移動 / グリッド内で左右移動 |
| `Arrow Up/Down` | グリッド内で上下移動 |
| `Enter` / `Space` | 絵文字を選択・挿入 |
| `Escape` | ピッカーを閉じる |
| `Home` | グリッドの先頭へ |
| `End` | グリッドの末尾へ |

### フォーカス管理

1. ピッカーを開いたら検索入力（またはグリッド先頭）にフォーカス
2. フォーカストラップ実装（ピッカー外にフォーカスが出ない）
3. ピッカーを閉じたらトリガーボタンにフォーカスを戻す

---

## パフォーマンス考慮

### 初期実装
- 絵文字データは静的インポート（ビルド時にバンドル）
- カテゴリ切り替え時は `EMOJI_BY_CATEGORY` Mapから即座に取得
- 検索は `useMemo` + デバウンス（300ms）

### 最適化（必要に応じて）
- **仮想スクロール**: 1カテゴリ100個以上の場合に検討
  - `react-window` または `@tanstack/react-virtual`
- **遅延読み込み**: 絵文字データを動的インポート
  - `const { EMOJI_DATA } = await import('../constants/emojiData')`

### 計測指標
- ピッカー表示までの時間: < 100ms
- カテゴリ切り替え: < 50ms
- 検索結果表示: < 100ms（デバウンス後）

---

## エッジケース

### 考慮すべきケース

| ケース | 対応 |
|-------|------|
| LocalStorageが無効 | try-catchで無視、最近使用機能は無効化 |
| 検索結果が0件 | 「見つかりませんでした」メッセージ表示 |
| 絵文字がOS未対応 | 代替表示なし（OSのフォールバックに依存） |
| エディタがdisabled | ピッカーボタンもdisabled |
| モバイルタッチ | ホバーの代わりにロングプレスでプレビュー（将来対応） |
| 高コントラストモード | CSS変数でスタイル継承 |

---

## テスト計画

### ユニットテスト

```typescript
// EmojiPicker.test.tsx
describe('EmojiPicker', () => {
  it('renders all category tabs', () => {});
  it('displays emojis for selected category', () => {});
  it('calls onSelect when emoji is clicked', () => {});
  it('calls onClose when Escape is pressed', () => {});
  it('filters emojis based on search query', () => {});
  it('shows "no results" when search has no matches', () => {});
});

// useRecentEmojis.test.ts
describe('useRecentEmojis', () => {
  it('returns empty array initially', () => {});
  it('adds emoji to recent list', () => {});
  it('moves existing emoji to front', () => {});
  it('limits to MAX_RECENT items', () => {});
  it('persists to localStorage', () => {});
  it('handles localStorage errors gracefully', () => {});
});
```

### 統合テスト

```typescript
// MarkdownToolbar.integration.test.tsx
describe('Emoji in Toolbar', () => {
  it('opens emoji picker when button is clicked', () => {});
  it('inserts emoji into editor', () => {});
  it('closes picker when clicking outside', () => {});
});
```

---

## 見積もり

| Phase | 作業内容 | 見積もり時間 |
|-------|----------|-------------|
| Phase 1 | 基本実装（MVP） | 3-4時間 |
| Phase 2 | UX改善 | 2-3時間 |
| Phase 3 | 仕上げ | 2-3時間 |
| **合計** | | **7-10時間** |

---

## リスクと軽減策

| リスク | 影響 | 軽減策 |
|-------|------|--------|
| 絵文字データ作成に時間がかかる | Phase 1遅延 | 最初は50個程度で開始、段階的に追加 |
| 仮想スクロールが必要になる | Phase 3遅延 | 初期は300個以下に制限 |
| ブラウザ間で表示が異なる | UX低下 | 主要ブラウザでの動作確認を計画に含める |

---

## 次のステップ

1. ✅ この計画書のレビュー・承認
2. Phase 1の実装開始
   - 型定義追加
   - 絵文字データ作成（各カテゴリ10-20個、合計約100個）
   - EmojiPickerコンポーネント作成
3. 動作確認後、Phase 2へ進行

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|-----------|---------|------|
| 2024-12-18 | 1.0 | 初版作成 | - |
| 2024-12-18 | 1.1 | 目次追加、依存関係・Export方針・レスポンシブ対応・変更履歴セクション追加 | - |
| 2024-12-18 | 1.2 | 受け入れ基準追加、ポップアップ位置・アニメーション・Z-index仕様追加、日本語翻訳例追加 | - |
