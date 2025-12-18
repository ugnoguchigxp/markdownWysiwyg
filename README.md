# markdown-wysiwyg-editor

Lightweight Markdown WYSIWYG editor for React, powered by TipTap.

![Screenshot](https://raw.githubusercontent.com/ugnoguchigxp/markdownWysiwyg/main/assets/example.png)

---

## Features

- Rich text editing with Markdown syntax
- Code blocks with syntax highlighting (19 languages)
- Table editing with context menu and resize controls
- Optional Mermaid diagram support
- Optional image insertion
- Emoji picker for inserting emojis
- Bidirectional Markdown conversion
- Link context menu
- TypeScript support

## Installation

This editor is a React component targeting **React 18+ / ReactDOM 18+**.

This package is **Tailwind CSS + shadcn/ui token compatible**. It ships its own base CSS (`style.css`) for the editor content, but the UI uses Tailwind utility classes (e.g. `bg-background`, `text-foreground`).

```bash
pnpm add markdown-wysiwyg-editor
# or
npm install markdown-wysiwyg-editor
# or
yarn add markdown-wysiwyg-editor
```

## Quick Start

**⚠️ IMPORTANT**

- **You MUST import the CSS file** for the editor content styles.
- **Your app MUST have Tailwind CSS** configured so the editor's utility classes are generated.

```tsx
import { useState } from 'react';
import { MarkdownEditor } from 'markdown-wysiwyg-editor';
import 'markdown-wysiwyg-editor/style.css'; // ← REQUIRED

function App() {
  const [content, setContent] = useState('');

  return <MarkdownEditor value={content} onChange={setContent} />;
}
```

## Essential Setup Steps

### 1. CSS Import (Required)

**Without the CSS import, the editor will not display properly**. Make sure to import the stylesheet:

```tsx
import 'markdown-wysiwyg-editor/style.css';
```

You can import this in your main app file (e.g., `App.tsx` or `index.tsx`) to make it available globally.

### 2. Theming (shadcn CSS Variables)

This library uses **shadcn-style CSS variables** for theming. Define these variables in your host project's global CSS:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
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
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
}

/* Dark mode - use .dark class or @media (prefers-color-scheme: dark) */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
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
  --ring: 224.3 76.3% 48%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
}
```

> **Note**: If you already use shadcn/ui in your project, these variables are likely already defined. The editor will automatically use your existing theme.

#### Tailwind CSS Configuration

This library uses Tailwind utility classes like `bg-background`, `text-foreground`, `border-border`.

- If you already initialized shadcn/ui in your project, your Tailwind config should already include the required theme tokens.
- If you did **not** initialize shadcn/ui, you must define shadcn-style theme tokens (colors/radius) in your Tailwind config.

Make sure Tailwind scans this package's output **and** has shadcn-compatible theme tokens:

```js
// tailwind.config.js
export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/markdown-wysiwyg-editor/dist/**/*.{js,cjs,mjs}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
}
```

### 3. Height and Scroll Configuration

The editor needs proper height configuration to enable scrolling. Choose one approach:

#### Option A: Fixed Height (Recommended)

```tsx
<MarkdownEditor
  value={content}
  onChange={setContent}
  className="h-96" // Fixed height (384px)
  enableVerticalScroll={true} // Enable internal scrolling
/>
```

#### Option B: Flex Layout (For Full-Height Containers)

```tsx
// Parent container must have defined height
<div className="flex flex-col h-screen">
  <MarkdownEditor
    value={content}
    onChange={setContent}
    className="flex-1" // Fill remaining space
    enableVerticalScroll={true} // Enable internal scrolling
  />
</div>
```

#### Option C: Auto-Height (No Scroll)

```tsx
<MarkdownEditor
  value={content}
  onChange={setContent}
  autoHeight={true} // Grow with content
  enableVerticalScroll={false} // No internal scrolling
/>
```

### 4. Common Issues and Solutions

#### Issue: Lists not displaying correctly

- Make sure the CSS is imported properly
- The CSS file contains all necessary styles for headings, lists, tables, etc.

#### Issue: No scrollbar appears

- Set a fixed height using `className="h-96"` or similar
- Enable scroll with `enableVerticalScroll={true}`

#### Issue: Styles not applying

- Verify the CSS import path: `'markdown-wysiwyg-editor/style.css'`
- Check browser console for CSS loading errors
- Make sure you're not using CSS modules that might interfere with global styles

#### Issue: Toolbar / menus look unstyled

- Ensure Tailwind CSS is installed and running in your app build pipeline
- Ensure your `tailwind.config.*` `content` includes this package:
  - `./node_modules/markdown-wysiwyg-editor/dist/**/*.{js,cjs,mjs}`
- Ensure your Tailwind theme has shadcn-compatible tokens (see Tailwind config snippet above)

### With Mermaid

`mermaid` is an optional peer dependency. Install it only if you enable Mermaid:

```bash
pnpm add mermaid
# or
npm install mermaid
```

```tsx
import { useState } from 'react';
import mermaid from 'mermaid';
import { MarkdownEditor } from 'markdown-wysiwyg-editor';
import 'markdown-wysiwyg-editor/style.css';

mermaid.initialize({ startOnLoad: false });

function App() {
  const [content, setContent] = useState('');

  return (
    <MarkdownEditor value={content} onChange={setContent} enableMermaid mermaidLib={mermaid} />
  );
}
```

### Disable Features

```tsx
<MarkdownEditor value={content} onChange={setContent} enableImage={false} enableTable={false} />
```

Emoji insertion is available via the built-in toolbar. To hide it, hide the toolbar:

```tsx
<MarkdownEditor value={content} onChange={setContent} showToolbar={false} />
```

### Image whitelist (local images)

For security reasons, **local image paths are not rendered by default**.

- Remote images are allowed only with `http` / `https`.
- For local paths (e.g. `/images/foo.png`), set `publicImagePathPrefix` and the `src` must start with that prefix.
- The following are rejected: `javascript:` / `data:` / `file:` / protocol-relative (`//...`) / path traversal (`../`).

Example:

```tsx
<MarkdownEditor
  value={content}
  onChange={setContent}
  publicImagePathPrefix="/images"
/>
```

## API (Props)

| Prop              | Type                      | Default             | Description                                         |
| ----------------- | ------------------------- | ------------------- | --------------------------------------------------- |
| `value`           | `string`                  | -                   | Markdown content (required)                         |
| `onChange`        | `(value: string) => void` | -                   | Change handler (required)                           |
| `editable`        | `boolean`                 | `true`              | Enable editing                                      |
| `enableMermaid`   | `boolean`                 | `false`             | Enable Mermaid diagrams                             |
| `enableImage`     | `boolean`                 | `true`              | Enable image insertion                              |
| `enableTable`     | `boolean`                 | `true`              | Enable table editing                                |
| `enableCodeBlock` | `boolean`                 | `true`              | Enable code blocks                                  |
| `enableLink`      | `boolean`                 | `true`              | Enable links                                        |
| `publicImagePathPrefix` | `string`            | -                   | Allow local image `src` only when it starts with this prefix (e.g. `/images`) |
| `mermaidLib`      | `typeof mermaid`          | -                   | Mermaid instance (required if `enableMermaid=true`) |
| `debug`           | `boolean`                 | `false`             | Show debug info (syntax status, paste debug)        |
| `className`       | `string`                  | -                   | Additional CSS class                                |
| `style`           | `React.CSSProperties`     | -                   | Inline styles                                       |
| `onBlur`          | `() => void`              | -                   | Blur event handler                                  |
| `onFocus`         | `() => void`              | -                   | Focus event handler                                 |
| `extensions`      | `Extension[]`             | -                   | Custom TipTap extensions                            |

## Supported Languages (Code Blocks)

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

## Bundle Size (rough guideline)

- Without Mermaid: ~150KB (gzipped)
- With Mermaid: +2.5MB

Consider your app's performance and whether you really need Mermaid.

## Limitations / Notes

- Focused on **Markdown-based WYSIWYG**. It is not a full block editor like Notion.
- Styling assumes a relatively neutral, Tailwind-friendly base; you are expected to adapt it to your design system.
- TipTap / Mermaid and other internals may receive major updates; this library will follow with its own major bumps.

## Browser Support

- Chrome / Edge: latest 2 versions
- Firefox: latest 2 versions
- Safari: latest 2 versions
- Mobile: iOS Safari 15+, Chrome Android

## Advanced Usage

### Internationalization (i18n)

This editor uses a host-driven i18n strategy.

- Your app provides a translator function `t(key)` via `I18nProvider`.
- All UI labels are defined by `I18N_KEYS` (translation keys).
- If you don't provide a translator, the default behavior is to render the key itself.

#### With react-i18next

```tsx
import { I18nProvider, MarkdownEditor, type Translator } from 'markdown-wysiwyg-editor';
import { useTranslation } from 'react-i18next';

function App() {
  const { t: t18n } = useTranslation();
  const [content, setContent] = useState('');

  const t: Translator = (key, fallback) => t18n(key, { defaultValue: fallback ?? key });

  return (
    <I18nProvider t={t}>
      <MarkdownEditor value={content} onChange={setContent} />
    </I18nProvider>
  );
}
```

#### Add to your i18n JSON files

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

### Custom Toolbar

You can hide the built-in toolbar and provide your own UI:

```tsx
<MarkdownEditor value={content} onChange={setContent} showToolbar={false} />
```

### Custom Extensions

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
/>;
```

## Troubleshooting

### Styles not loading

```tsx
import 'markdown-wysiwyg-editor/style.css';
```

Ensure the CSS is imported in your app entry.

If the editor content is styled but the toolbar/buttons are not, Tailwind is not generating the required utility classes. Re-check the Tailwind `content` paths and shadcn-compatible theme tokens.

### "ReferenceError: global is not defined"

With some Vite setups you may need:

```ts
define: {
  global: 'window',
},
```

## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
```

## License

MIT

## Credits

Built with:

- [TipTap](https://tiptap.dev/)
- [Lowlight](https://github.com/wooorm/lowlight)
- [Lucide](https://lucide.dev/) for icons
- [Mermaid](https://mermaid.js.org/)
