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
