import type { NodeViewProps } from '@tiptap/core';
import { useEffect, useState } from 'react';
import { createLogger } from '../utils/logger';
import {
  getMermaidLib,
  getMermaidLibVersion,
  setMermaidLib,
  subscribeMermaidLib,
} from './mermaidRegistry';
import { MermaidCodeBlockView } from './CodeBlockNodeView/MermaidCodeBlockView';
import { RegularCodeBlockView } from './CodeBlockNodeView/RegularCodeBlockView';

const log = createLogger('CodeBlockNodeView');

try {
  // This will be imported by the user if they enable Mermaid
  // @ts-expect-error - Mermaid is optional
  if (typeof window !== 'undefined' && window.mermaid) {
    // @ts-expect-error - Mermaid is optional
    setMermaidLib(window.mermaid);
  }
} catch {
  log.debug('Mermaid not available (optional)');
}

export const CodeBlockNodeView = ({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) => {
  const language = node.attrs.language || '';
  const code = node.textContent;
  const [mermaidLibVersion, setMermaidLibVersion] = useState(getMermaidLibVersion());
  const mermaidLib = getMermaidLib();

  log.debug('CodeBlockNodeView render', { language, editable: editor.isEditable, selected });

  useEffect(() => {
    return subscribeMermaidLib(() => {
      setMermaidLibVersion(getMermaidLibVersion());
    });
  }, []);

  if (language === 'mermaid' && mermaidLib) {
    return (
      <MermaidCodeBlockView
        code={code}
        selected={selected}
        editable={editor.isEditable}
        updateAttributes={updateAttributes}
        deleteNode={deleteNode}
        mermaidLib={mermaidLib}
        mermaidLibVersion={mermaidLibVersion}
      />
    );
  }

  return (
    <RegularCodeBlockView
      language={language}
      selected={selected}
      editable={editor.isEditable}
      updateAttributes={updateAttributes}
      deleteNode={deleteNode}
    />
  );
};
