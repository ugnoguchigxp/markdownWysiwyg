import { createLogger } from '../utils/logger';

const log = createLogger('mermaidRegistry');

let mermaidLib: typeof import('mermaid').default | null = null;
let version = 0;
const listeners = new Set<() => void>();

export const setMermaidLib = (lib: typeof import('mermaid').default | null) => {
  mermaidLib = lib;
  version += 1;
  for (const listener of listeners) {
    listener();
  }

  try {
    mermaidLib?.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: 'inherit',
      flowchart: {
        htmlLabels: false,
      },
    });
  } catch {
    log.debug('Mermaid not available (optional)');
  }
};

export const getMermaidLib = () => mermaidLib;

export const getMermaidLibVersion = () => version;

export const subscribeMermaidLib = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
