import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useEditorState } from './useEditorState';

describe('useEditorState', () => {
  it('initializes with default values and updates state', () => {
    const { result } = renderHook(() => useEditorState());

    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.processingProgress).toEqual({ processed: 0, total: 0 });

    act(() => {
      result.current.setIsUpdating(true);
      result.current.setIsProcessing(true);
      result.current.setProcessingProgress({ processed: 2, total: 5 });
    });

    expect(result.current.isUpdating).toBe(true);
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.processingProgress).toEqual({ processed: 2, total: 5 });
  });
});
