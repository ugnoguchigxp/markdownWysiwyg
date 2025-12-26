import { describe, expect, it, vi } from 'vitest';

const { mockReactNodeViewRenderer } = vi.hoisted(() => ({
  mockReactNodeViewRenderer: vi.fn(() => 'node-view-renderer'),
}));

vi.mock('@tiptap/react', () => ({
  ReactNodeViewRenderer: mockReactNodeViewRenderer,
}));

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

import { CustomCodeBlock } from '../../src/extensions/CustomCodeBlock';

describe('CustomCodeBlock', () => {
  it('should be an extension with correct name', () => {
    expect(CustomCodeBlock.name).toBe('codeBlock');
  });

  it('should have addNodeView method', () => {
    expect(typeof CustomCodeBlock.config.addNodeView).toBe('function');
  });

  it('should return a node view renderer', () => {
    const nodeView = CustomCodeBlock.config.addNodeView?.();
    expect(nodeView).toBe('node-view-renderer');
    expect(mockReactNodeViewRenderer).toHaveBeenCalled();
  });

  it('should create a valid extension', () => {
    expect(CustomCodeBlock).toBeDefined();
  });
});
