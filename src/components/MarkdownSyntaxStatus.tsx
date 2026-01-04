import type React from 'react';

import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS } from '../types/index';
import type { ISelectionInfo } from '../utils/selectionUtils';

interface IMarkdownSyntaxStatusProps {
  selectionInfo: ISelectionInfo | null;
  className?: string;
}

export const MarkdownSyntaxStatus: React.FC<IMarkdownSyntaxStatusProps> = ({
  selectionInfo,
  className = '',
}) => {
  const { t } = useI18n();

  if (!selectionInfo || !selectionInfo.selectedText.trim()) {
    return (
      <div
        className={`bg-muted border-t border-border px-4 py-2 text-sm text-muted-foreground ${className}`}
      >
        <span>{t(I18N_KEYS.syntaxStatus.help)}</span>
      </div>
    );
  }

  return (
    <div className={`bg-muted border-t border-border px-4 py-2 text-sm ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <span className="font-medium text-foreground">
            {t(I18N_KEYS.syntaxStatus.selectedText)}:
          </span>
          <span className="text-foreground truncate max-w-xs">{selectionInfo.selectedText}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-medium text-foreground">
            {t(I18N_KEYS.syntaxStatus.markdownSyntax)}:
          </span>
          <code className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-mono">
            {selectionInfo.markdownSyntax}
          </code>
        </div>

        {selectionInfo.marks.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="font-medium text-foreground">{t(I18N_KEYS.syntaxStatus.styles)}:</span>
            <div className="flex gap-2">
              {selectionInfo.marks.map((mark) => (
                <span
                  key={mark}
                  className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-xs"
                >
                  {mark}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <span className="font-medium text-foreground">{t(I18N_KEYS.syntaxStatus.nodeType)}:</span>
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">
            {selectionInfo.nodeType}
          </span>
        </div>
      </div>
    </div>
  );
};
