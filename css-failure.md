# CSS Failures and AI Handoff Document

このドキュメントは、本プロジェクトのダークモード対応およびCSS管理において発生した一連の失敗と、その技術的背景をまとめたものです。後続のAIはこれを参考に、同じ轍を踏まずに根本解決を目指してください。

## 1. 解決すべき主要課題
- **ダークモード時のドロップダウン透明化**: ツールバーの見出しメニューや絵文字ピッカー等の背景が透明になり、背後のテキストと重なって読めなくなる。
- **パッケージとしての完成度不足**: `MarkdownEditor` コンポーネントが単体で動作する際のボーダー、背景色、角角設定が不安定であり、ホストアプリ（`example`）の設定に過度に依存、あるいは競合している。
- **Tailwind CSS v4 への移行に伴う不整合**: v3からv4への移行時に、変数の定義方法や `@theme` ブロック、`@source` のスキャン範囲の設定に失敗し、意図したクラスが生成されていない。

## 2. これまでの試行と失敗の履歴
1. **Tailwindエンジンの二重起動（最初の致命的ミス）**: 
    - ライブラリ側（`src`）とアプリ側（`example`）の両方で `@import "tailwindcss"` を実行。
    - 結果：それぞれのビルドコンテキストが独立し、「テーマの絶縁」が発生。アプリ側で `.dark` クラスを切り替えてもライブラリ側のクラス（`bg-popover` 等）がそれに追従せず、デフォルトの白（あるいは透明）のままになった。
2. **CSS変数の階層構造とフォールバックの競合**:
    - ライブラリの `src/index.css` 内の `@layer base` で定義した変数（`--popover: var(--popover, 0 0% 100%)` 等）が、アプリ側の定義を読み込み順序によって上書き。
    - 結果：アプリ側で定義したダークモード用の色が反映されず、ライブラリ側のデフォルト値が優先された。
3. **HSLマッピングと静的解析の不一致**:
    - Tailwind v4 は静的解析を重視するが、`--color-popover: hsl(var(--popover))` のように変数の中に変数をネストすると、ビルド時に「色」として解決できず、クラス自体が生成されない（あるいは不正なCSSが出力される）ケースに遭遇。
    - 一時しのぎで Hex 値（`#ffffff`）への切り替えを試みたが、ライブラリ内部の `hsl()` ラッパーを剥がしきれず、表示が完全に崩れる（ボーダーの消失など）という二次被害を招いた。

## 3. 技術的ボトルネックと引き継ぎ事項
- **ライブラリとアプリの分離**: ライブラリは「ホストの変数を継承する」設計であるべきだが、ホストが何（shadcn, 純粋なCSS, Tailwind）を使っているかにかかわらず安定して見える「強いデフォルト値（フォールバック）」との両立が必要。
- **コンポーネントの責任範囲**: `MarkdownEditor` が自身の外枠（border/shadow）を管理すべきか、親要素（この例では `App.tsx` の Grid）に任せるべきかの境界が曖昧になり、現在の `uploaded_image_1767504326053.png` に見られるような「外枠はあるが中身（dropdown）が壊れている」状態を生んだ。
- **Tailwind v4 の `@source` 設定**: ライブラリ側のコンポーネントが使用するクラス（`bg-popover`, `border-border` 等）を、アプリ側のTailwindビルドプロセスが確実に「見つける」ことができ、なおかつアプリ側のテーマ変数（`--popover` 等）を流し込める構成にする必要がある。

## 4. 推奨される解決アプローチ
- ライブラリ側からは Tailwind 自身のインポートを完全に排除し、標準的なCSS変数に基づいた柔軟な設計にする。
- アプリ側（開発/デモ時）では、ライブラリのソースコードを明示的にスキャン対象（`@source`）に含め、テーマ変数が正確に適用されているか開発者ツールで各要素を徹底的に確認する。
- **「場当たり的な修正（Hex直接指定など）」を厳禁し、CSS変数の継承グラフを論理的に再構築すること。**

---

## 5. コードレビュー結果: 真の問題点の分析 (2026-01-04)

### 5.1 現状の構成

#### パッケージ側 (`src/`)
- **`src/index.css`**: 純粋なCSSファイル（`@import "tailwindcss"` なし）
  - `@layer base` でshadcn-style変数のフォールバックを定義
  - `--mw-*` プレフィックス付きのエディタ専用トークンを `hsl(var(--popover))` 形式で定義
  - ProseMirror、絵文字ピッカー等のスタイルを純粋CSSで記述
  
- **Reactコンポーネント**: `bg-popover`, `text-popover-foreground`, `hover:bg-accent` などの **Tailwind v4クラスを直接使用**
  - 例: `HeadingMenu.tsx`, `DownloadMenu.tsx`, `EmojiPicker.tsx` など

- **ビルドプロセス (`package.json`)**:
  ```bash
  build:css: bunx tailwindcss -i ./src/index.css -o ./dist/index.css --minify
  ```
  ⚠️ このコマンドで `src/index.css` をビルドしても、**コンポーネントで使用されている `bg-popover` などのユーティリティクラスはスキャンされない**。
  Tailwind CLIは入力CSS内の `@source` ディレクティブを見るが、`src/index.css` には `@source` がない。

#### Example側 (`example/`)
- **`example/src/index.css`**: Tailwind v4完全セットアップ
  ```css
  @import "tailwindcss";
  @source "./**/*.{ts,tsx}";
  @source "../../src/**/*.{ts,tsx}";  /* ← パッケージのソースをスキャン */
  ```
  
- **`example/vite.config.ts`**: 
  - `@tailwindcss/vite` プラグインでTailwindを有効化
  - エイリアス設定で `markdown-wysiwyg-editor/style.css` → `../src/index.css` へマッピング

### 5.2 真の問題: Tailwindビルドコンテキストの不一致

**問題の核心**:
1. **パッケージのCSSビルドはユーティリティクラスを生成しない**
   - `bunx tailwindcss -i ./src/index.css` は入力CSSをそのまま処理するだけ
   - `bg-popover` などのクラスを生成するには、コンポーネントファイルをスキャンする `@source` が必要
   - しかし `src/index.css` には `@source` がない → `dist/index.css` には `bg-popover` の定義がない

2. **Example側では動作する（ローカル開発時）**
   - `example/src/index.css` に `@source "../../src/**/*.{ts,tsx}"` があるため、example側Tailwindビルドでクラスが生成される
   - エイリアス設定でパッケージCSSも読み込むため、変数定義も取得できる
   - ただし、これは**開発環境でのみ**機能し、実際のnpmパッケージ利用時には動作しない

3. **CSS変数の循環参照問題**
   - `src/index.css` Line 47: `--background: var(--background, 0 0% 100%);`
   - これは「`--background` が定義されていれば使い、なければ `0 0% 100%` を使う」という意図だが、**CSS変数の仕様上、同名変数への参照は無効（循環参照）**
   - ブラウザによっては正しく処理されるが、予測不能な挙動の原因

### 5.3 なぜダークモードで壊れるのか

1. **パッケージをnpmから利用する場合**:
   - `dist/index.css` には `bg-popover` クラスの定義がない
   - ホストアプリのTailwindがパッケージコンポーネントをスキャンしない限り、クラスは生成されない
   - 結果: ドロップダウンは透明になる

2. **Example開発環境の特殊性**:
   - Example側のTailwindがパッケージソースをスキャンするため、一見動作する
   - しかしTailwindビルドコンテキストが分離しているため、`.dark` クラスの切り替えがパッケージ側の変数に反映されない可能性がある

### 5.4 構造的な解決アプローチ

#### オプションA: Tailwindを完全に排除（推奨）
```diff
# パッケージ側のコンポーネントから全Tailwindクラスを除去
- className="bg-popover text-popover-foreground hover:bg-accent"
+ className="mw-popover"

# src/index.css に対応するクラスを定義
+ .mw-popover {
+   background-color: var(--mw-popover-bg, hsl(var(--popover, 0 0% 100%)));
+   color: var(--mw-popover-text, hsl(var(--popover-foreground, 222.2 84% 4.9%)));
+ }
+ .mw-popover:hover {
+   background-color: var(--mw-accent-bg, hsl(var(--accent, 210 40% 96.1%)));
+ }
```

**メリット**: 
- ホスト環境への依存がゼロ
- npm利用者が `style.css` をインポートするだけで完全動作
- CSS変数のみでテーマカスタマイズ可能

#### オプションB: Tailwindプリセット提供
```typescript
// tailwind.preset.js (パッケージから提供)
module.exports = {
  content: ['./node_modules/markdown-wysiwyg-editor/dist/**/*.js'],
  theme: { /* shadcn変数マッピング */ }
}
```

**メリット**:
- Tailwindエコシステムとの親和性維持
- ホストがTailwindを使っている場合に統合しやすい

**デメリット**:
- ホストがTailwindを使っていない場合に追加設定が必要

### 5.5 CSS変数定義の修正

現在の循環参照を避けるフォールバックパターン:
```css
@layer base {
  :root {
    /* ホストが定義していない場合のデフォルト値 */
    --mw-popover-bg: hsl(0 0% 100%);
    --mw-popover-text: hsl(222.2 84% 4.9%);
  }
}

/* ホストがshadcn変数を定義している場合はそれを使用 */
:root:has([data-shadcn]) {
  --mw-popover-bg: hsl(var(--popover));
  --mw-popover-text: hsl(var(--popover-foreground));
}
```

または、より堅牢なアプローチ:
```css
/* 条件付きフォールバックではなく、常に外部変数を参照しつつデフォルト値を持つ */
:root {
  --mw-popover-bg: hsl(var(--popover, 0 0% 100%));
  --mw-popover-text: hsl(var(--popover-foreground, 222.2 84% 4.9%));
}

.dark {
  --mw-popover-bg: hsl(var(--popover, 222.2 84% 4.9%));
  --mw-popover-text: hsl(var(--popover-foreground, 210 40% 98%));
}
```

### 5.6 即時対応チェックリスト

- [ ] `src/index.css` の `var(--background, 0 0% 100%)` 形式の循環参照を修正
- [ ] パッケージのビルドプロセスでTailwindクラスが生成されているか確認
- [ ] コンポーネントで使用しているTailwindクラスを列挙し、純粋CSSへの移行計画を立てる
- [ ] ダークモード用の `--mw-*` 変数を `.dark` セレクタ内で定義
- [ ] npmパッケージとして実際にインストールした環境でテスト

---

## 6. 方針決定: Tailwind v4-First アーキテクチャ (2026-01-04)

**決定**: Tailwind v4専用パッケージとして設計する。v3サポートは行わない。

### 6.1 設計思想

「Tailwindネイティブ」であることをパッケージの強みとする。事前コンパイルしたCSSを配布するのではなく、**ホストアプリのTailwind v4と統合する**設計。

### 6.2 パッケージ構成

```
dist/
├── index.js          # コンポーネント（Tailwind v4クラス使用）
├── index.d.ts        # 型定義
└── theme.css         # CSS変数定義のみ（ライト/ダークモードのデフォルト値）

package.json exports:
{
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./theme.css": "./dist/theme.css"
  }
}
```

### 6.3 ユーザー側の設定（ドキュメント化必須）

```css
/* ホストアプリの index.css */
@import "tailwindcss";

/* パッケージのコンポーネントをスキャン対象に含める */
@source "./node_modules/markdown-wysiwyg-editor/**/*.js";

/* パッケージのテーマ変数をインポート（オプション：独自定義も可） */
@import "markdown-wysiwyg-editor/theme.css";
```

```tsx
// これだけで動作！
import { MarkdownEditor } from 'markdown-wysiwyg-editor';
```

### 6.4 theme.css の内容

```css
/* dist/theme.css - CSS変数定義のみ */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### 6.5 実装タスク

- [ ] `src/theme.css` を作成（CSS変数定義のみ）
- [ ] `src/index.css` からCSS変数定義を `theme.css` に移動
- [ ] `src/index.css` には ProseMirror スタイル等の純粋CSSのみ残す
- [ ] ビルドプロセスを更新: `theme.css` と `index.css` を別々に出力
- [ ] `package.json` の exports に `./theme.css` を追加
- [ ] README.md に Tailwind v4 統合手順を追加

### 6.6 メリット

1. **Tailwindエコシステムとの完全統合** - ホストのテーマがそのまま適用
2. **カスタマイズの柔軟性** - ユーザーが `--popover` 等を上書きするだけ
3. **ダークモード自動対応** - `.dark` クラスの切り替えが自然に動作
4. **軽量な配布物** - ユーティリティクラスのCSSを含まないため小さい
