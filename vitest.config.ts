import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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
