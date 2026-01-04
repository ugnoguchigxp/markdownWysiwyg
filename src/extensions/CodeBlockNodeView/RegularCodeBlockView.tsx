import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { Trash2 } from '../../components/ui/icons';
import { createLogger } from '../../utils/logger';
import { IconButton } from './IconButton';
import { SUPPORTED_LANGUAGES } from './constants';

const log = createLogger('CodeBlockNodeView');

interface RegularCodeBlockViewProps {
  language: string;
  selected: boolean;
  editable: boolean;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}

export const RegularCodeBlockView = ({
  language,
  selected,
  editable,
  updateAttributes,
  deleteNode,
}: RegularCodeBlockViewProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState(language || '');
  const [isEditable, setIsEditable] = useState(editable);

  useEffect(() => {
    setIsEditable(editable);
    log.debug('RegularCodeBlockView editable changed', { language, editable, selected });
  }, [editable, language, selected]);

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
  };

  const handleRender = () => {
    updateAttributes({ language: selectedLanguage });
  };

  return (
    <NodeViewWrapper className={`code-block ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <div
        className={`relative bg-slate-800 rounded-ui p-ui-x border ${selected ? 'border-blue-500' : 'border-slate-700'}`}
      >
        {isEditable && (
          <div className="absolute top-0 right-0 flex gap-1 items-center z-10">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-ui-x py-ui-y border border-slate-600 rounded-ui text-xs bg-slate-700 text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <IconButton onClick={handleRender} title="レンダリング">
              &#x25B6;
            </IconButton>
            <IconButton onClick={deleteNode} title="削除">
              <Trash2 size="var(--spacing-icon-md)" />
            </IconButton>
          </div>
        )}
        <pre className="m-0 relative overflow-visible whitespace-pre text-slate-200">
          <code className="block overflow-auto text-slate-200">
            <NodeViewContent />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
};
