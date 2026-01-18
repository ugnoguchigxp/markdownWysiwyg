import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/types.ts',
        '**/*.config.{js,ts}',
        'eslint.config.js',
        'vite.config.ts',
        'vitest.config.ts',
        'src/types/editor.ts',
        'example/**',
      ],
    },
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      'markdown-wysiwyg-editor': path.resolve(__dirname, './src/index.ts'),
    },
  },
});
