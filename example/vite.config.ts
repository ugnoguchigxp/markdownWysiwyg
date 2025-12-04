import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'markdown-wysiwyg-editor/style.css': path.resolve(__dirname, '../src/index.css'),
      'markdown-wysiwyg-editor': path.resolve(__dirname, '../src/index.ts'),
    },
  },
})
