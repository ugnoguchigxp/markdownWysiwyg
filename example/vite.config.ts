import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4123,
    strictPort: true,
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'markdown-wysiwyg-editor/style.css': path.resolve(__dirname, '../src/index.css'),
      'markdown-wysiwyg-editor': path.resolve(__dirname, '../src/index.ts'),
    },
  },
});
