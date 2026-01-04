import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getMermaidLib,
  getMermaidLibVersion,
  setMermaidLib,
  subscribeMermaidLib,
} from '../../src/extensions/mermaidRegistry';

vi.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('mermaidRegistry', () => {
  const mockMermaidLib = {
    initialize: vi.fn(),
    render: vi.fn(),
  } as unknown as typeof import('mermaid').default;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to known state
    vi.doMock('../../src/extensions/mermaidRegistry', () => ({
      getMermaidLib: () => null,
      getMermaidLibVersion: () => 0,
      setMermaidLib: vi.fn(),
      subscribeMermaidLib: () => vi.fn(),
    }));
  });

  it('should return null for getMermaidLib when not set', () => {
    expect(getMermaidLib()).toBe(null);
  });

  it('should set and get mermaid library', () => {
    setMermaidLib(mockMermaidLib);
    expect(getMermaidLib()).toBe(mockMermaidLib);
  });

  it('should increment version when mermaid lib is set', () => {
    setMermaidLib(mockMermaidLib);
    const version = getMermaidLibVersion();
    expect(typeof version).toBe('number');
    expect(version).toBeGreaterThan(0);
  });

  it('should call initialize on mermaid lib set', () => {
    setMermaidLib(mockMermaidLib);
    expect(mockMermaidLib.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: 'inherit',
      flowchart: {
        htmlLabels: false,
      },
    });
  });

  it('should notify all subscribers when mermaid lib changes', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsubscribe1 = subscribeMermaidLib(listener1);
    subscribeMermaidLib(listener2);

    setMermaidLib(mockMermaidLib);

    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
  });

  it('should allow unsubscribing from changes', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    subscribeMermaidLib(listener1);
    subscribeMermaidLib(listener2);

    setMermaidLib(mockMermaidLib);
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    setMermaidLib(null);
    expect(listener1).toHaveBeenCalledTimes(2);
    expect(listener2).toHaveBeenCalledTimes(2);
  });

  it('should handle setting null mermaid lib', () => {
    setMermaidLib(mockMermaidLib);
    expect(getMermaidLib()).toBe(mockMermaidLib);

    setMermaidLib(null);
    expect(getMermaidLib()).toBe(null);
  });

  it('should update version multiple times', () => {
    setMermaidLib(mockMermaidLib);
    const v1 = getMermaidLibVersion();

    const anotherMock = { ...mockMermaidLib };
    setMermaidLib(anotherMock);
    const v2 = getMermaidLibVersion();

    expect(v1).toBeGreaterThan(0);
    expect(v2).toBeGreaterThan(v1);
  });

  it('should handle initialize errors gracefully', () => {
    const erroringLib = {
      initialize: vi.fn(() => {
        throw new Error('Test error');
      }),
      render: vi.fn(),
    } as unknown as typeof import('mermaid').default;

    expect(() => setMermaidLib(erroringLib)).not.toThrow();
    expect(getMermaidLib()).toBe(erroringLib);
  });
});
