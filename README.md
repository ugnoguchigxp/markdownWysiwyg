# @markdown-wysiwyg/editor

Lightweight Markdown WYSIWYG editor for React, powered by TipTap.

---

## English

### Features

- Rich text editing with Markdown syntax
- Code blocks with syntax highlighting (19 languages)
- Table editing with context menu and resize controls
- Optional Mermaid diagram support
- Optional image insertion
- Bidirectional Markdown conversion
- Link context menu
- TypeScript support

### Installation

This editor is a React component targeting **React 18+ / ReactDOM 18+**.

```bash
pnpm add react react-dom @markdown-wysiwyg/editor
```

### Quick Start

```tsx
import { useState } from 'react';
import { MarkdownEditor } from '@markdown-wysiwyg/editor';
import '@markdown-wysiwyg/editor/style.css';

function App() {
  const [content, setContent] = useState('');

  return <MarkdownEditor value={content} onChange={setContent} />;
}
```

#### With Mermaid

```tsx
import { useState } from 'react';
import mermaid from 'mermaid';
import { MarkdownEditor } from '@markdown-wysiwyg/editor';
import '@markdown-wysiwyg/editor/style.css';

mermaid.initialize({ startOnLoad: false });

function App() {
  const [content, setContent] = useState('');

  return (
    <MarkdownEditor
      value={content}
      onChange={setContent}
      enableMermaid
      mermaidLib={mermaid}
    />
  );
}
```

#### Disable Features

```tsx
<MarkdownEditor
  value={content}
  onChange={setContent}
  enableImage={false}
  enableTable={false}
/>
```

### API (Props)

| Prop           | Type                       | Default             | Description                                           |
| -------------- | -------------------------- | ------------------- | ----------------------------------------------------- |
| `value`        | `string`                   | -                   | Markdown content (required)                           |
| `onChange`     | `(value: string) => void`  | -                   | Change handler (required)                             |
| `editable`     | `boolean`                  | `true`              | Enable editing                                        |
| `placeholder`  | `string`                   | `'Start typing...'` | Placeholder text                                      |
| `enableMermaid`| `boolean`                  | `false`             | Enable Mermaid diagrams                               |
| `enableImage`  | `boolean`                  | `true`              | Enable image insertion                                |
| `enableTable`  | `boolean`                  | `true`              | Enable table editing                                  |
| `enableCodeBlock` | `boolean`               | `true`              | Enable code blocks                                    |
| `enableLink`   | `boolean`                  | `true`              | Enable links                                          |
| `mermaidLib`   | `typeof mermaid`           | -                   | Mermaid instance (required if `enableMermaid=true`)   |
| `texts`        | `Partial<ITexts>`          | `DEFAULT_TEXTS`     | i18n text labels (see i18n section)                   |
| `debug`        | `boolean`                  | `false`             | Show debug info (syntax status, paste debug)          |
| `className`    | `string`                   | -                   | Additional CSS class                                  |
| `style`        | `React.CSSProperties`      | -                   | Inline styles                                         |
| `onBlur`       | `() => void`               | -                   | Blur event handler                                    |
| `onFocus`      | `() => void`               | -                   | Focus event handler                                   |
| `extensions`   | `Extension[]`              | -                   | Custom TipTap extensions                              |

### Supported Languages (Code Blocks)

- JavaScript / TypeScript
- Python
- Java
- Go
- Rust
- PHP
- HTML / CSS
- SQL
- Bash / Shell (sh, zsh, tcsh)
- JSON / YAML / XML
- Mermaid (if enabled)

### Bundle Size (rough guideline)

- Without Mermaid: ~150KB (gzipped)
- With Mermaid: +2.5MB

Consider your app's performance and whether you really need Mermaid.

### Limitations / Notes

- Focused on **Markdown-based WYSIWYG**. It is not a full block editor like Notion.
- Styling assumes a relatively neutral, Tailwind-friendly base; you are expected to adapt it to your design system.
- TipTap / Mermaid and other internals may receive major updates; this library will follow with its own major bumps.

### Browser Support

- Chrome / Edge: latest 2 versions
- Firefox: latest 2 versions
- Safari: latest 2 versions
- Mobile: iOS Safari 15+, Chrome Android

### Advanced Usage

#### Internationalization (i18n)

This editor supports integration with external i18n systems like **react-i18next** or **next-intl**.

##### Using Translation Keys with react-i18next

```tsx
import { MarkdownEditor, I18N_KEYS } from '@markdown-wysiwyg/editor';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  const [content, setContent] = useState('');

  const texts = {
    table: {
      rowOperations: t(I18N_KEYS.table.rowOperations),
      addRowAbove: t(I18N_KEYS.table.addRowAbove),
      addRowBelow: t(I18N_KEYS.table.addRowBelow),
      deleteRow: t(I18N_KEYS.table.deleteRow),
      columnOperations: t(I18N_KEYS.table.columnOperations),
      addColumnLeft: t(I18N_KEYS.table.addColumnLeft),
      addColumnRight: t(I18N_KEYS.table.addColumnRight),
      deleteColumn: t(I18N_KEYS.table.deleteColumn),
      deleteTable: t(I18N_KEYS.table.deleteTable),
      cancel: t(I18N_KEYS.table.cancel),
    },
  };

  return <MarkdownEditor value={content} onChange={setContent} texts={texts} />;
}
```

##### Add to your i18n JSON files

**en.json:**
```json
{
  "markdown_editor": {
    "table": {
      "row_operations": "Row Operations",
      "add_row_above": "Add Row Above",
      "add_row_below": "Add Row Below",
      "delete_row": "Delete Row",
      "column_operations": "Column Operations",
      "add_column_left": "Add Column Left",
      "add_column_right": "Add Column Right",
      "delete_column": "Delete Column",
      "delete_table": "Delete Entire Table",
      "cancel": "Cancel"
    }
  }
}
```

**ja.json:**
```json
{
  "markdown_editor": {
    "table": {
      "row_operations": "行の操作",
      "add_row_above": "上に行を追加",
      "add_row_below": "下に行を追加",
      "delete_row": "行を削除",
      "column_operations": "列の操作",
      "add_column_left": "左に列を追加",
      "add_column_right": "右に列を追加",
      "delete_column": "列を削除",
      "delete_table": "テーブル全体を削除",
      "cancel": "キャンセル"
    }
  }
}
```

See [docs/i18n.md](./docs/i18n.md) for more details.

#### Custom Toolbar

You can hide the built-in toolbar and provide your own UI:

```tsx
<MarkdownEditor
  value={content}
  onChange={setContent}
  showToolbar={false}
/>
```

#### Custom Extensions

You can inject TipTap extensions directly:

```tsx
import TextAlign from '@tiptap/extension-text-align';

<MarkdownEditor
  value={content}
  onChange={setContent}
  extensions={[
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ]}
/>
```

### Troubleshooting

#### Styles not loading

```tsx
import '@markdown-wysiwyg/editor/style.css';
```

Ensure the CSS is imported in your app entry.

#### "ReferenceError: global is not defined"

With some Vite setups you may need:

```ts
define: {
  global: 'window',
},
```

### Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
```

### License

MIT

### Credits

Built with:

- [TipTap](https://tiptap.dev/)
- [Lowlight](https://github.com/wooorm/lowlight)
- [Lucide](https://lucide.dev/) for icons
- [Mermaid](https://mermaid.js.org/)
