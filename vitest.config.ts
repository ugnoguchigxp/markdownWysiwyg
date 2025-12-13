/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['Test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'example/**',
        'docs/**',
        '**/*.config.{js,ts,cjs}',
        'dist/**',
        'Test/**',
        'src/**/*.test.{ts,tsx}',
        'src/types/editor.ts',
        'src/index.ts',
        '.eslintrc.cjs',
      ],
    },
  },
});
