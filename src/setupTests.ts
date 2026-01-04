import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocking some browser APIs that might be missing in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// TipTap/ProseMirror requires some specific mocks sometimes
// Add them here as needed
