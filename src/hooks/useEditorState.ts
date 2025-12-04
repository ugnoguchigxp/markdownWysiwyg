import { useState } from 'react';

interface ProcessingProgress {
  processed: number;
  total: number;
}

export const useEditorState = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress>({
    processed: 0,
    total: 0,
  });

  return {
    isUpdating,
    setIsUpdating,
    isProcessing,
    setIsProcessing,
    processingProgress,
    setProcessingProgress,
  } as const;
};
