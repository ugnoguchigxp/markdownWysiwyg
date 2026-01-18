import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    cssMinify: false,
  },
  server: {
    port: 4123,
    strictPort: true,
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'markdown-wysiwyg-editor/style.css': path.resolve(__dirname, '../src/index.css'),
      'markdown-wysiwyg-editor/theme.css': path.resolve(__dirname, '../src/theme.css'),
      'markdown-wysiwyg-editor': path.resolve(__dirname, '../src/index.ts'),
    },
  },
});
