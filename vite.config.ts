import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MarkdownWysiwygEditor',
      fileName: (format) => 'index.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'mermaid', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          mermaid: 'mermaid',
        },
      },
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
