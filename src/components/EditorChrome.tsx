import type { Editor } from '@tiptap/react';
import type React from 'react';

import { useI18n } from '../i18n/I18nContext';
import { I18N_KEYS } from '../types/index';
import type { ISelectionInfo } from '../utils/selectionUtils';

import { MarkdownSyntaxStatus } from './MarkdownSyntaxStatus';
import { MarkdownToolbar } from './MarkdownToolbar';

interface EditorChromeProps {
  editor: Editor;
  selectionInfo: ISelectionInfo | null;
  editable: boolean;
  effectiveShowToolbar: boolean;
  effectiveShowSyntaxStatus: boolean;
  effectiveShowPasteDebug: boolean;
  showDownloadButton: boolean;
  onDownloadAsMarkdown: () => void;
  onInsertMarkdown: (markdown: string, cursorOffset?: number) => void;
  pasteEvents: Array<{
    timestamp: number;
    type: string;
    content: string;
    result: string;
  }>;
  onClearPasteEvents: () => void;
  children: React.ReactNode;
}

export const EditorChrome: React.FC<EditorChromeProps> = ({
  editor,
  selectionInfo,
  editable,
  effectiveShowToolbar,
  effectiveShowSyntaxStatus,
  effectiveShowPasteDebug,
  showDownloadButton,
  onDownloadAsMarkdown,
  onInsertMarkdown,
  pasteEvents,
  onClearPasteEvents,
  children,
}) => {
  const { t } = useI18n();

  return (
    <>
      {effectiveShowToolbar && (
        <div className="border-b p-ui-y rounded-t-ui transition-colors duration-200 bg-popover border-border">
          <MarkdownToolbar
            onInsertMarkdown={onInsertMarkdown}
            selectedText={selectionInfo?.selectedText || ''}
            disabled={!editable}
            editor={editor}
            showDownloadButton={showDownloadButton}
            onDownloadAsMarkdown={onDownloadAsMarkdown}
          />
        </div>
      )}

      {children}

      {effectiveShowSyntaxStatus && (
        <MarkdownSyntaxStatus selectionInfo={selectionInfo} className="rounded-b-ui" />
      )}

      {effectiveShowPasteDebug && (
        <div className="bg-muted border-t border-border p-ui-x">
          <div className="flex justify-between items-center mb-ui-y">
            <h3 className="text-sm font-semibold text-foreground">
              {t(I18N_KEYS.pasteDebugPanel)}
            </h3>
            <button
              type="button"
              onClick={onClearPasteEvents}
              className="text-xs px-ui-x py-[calc(var(--spacing-ui-y)*0.5)] bg-destructive/10 text-destructive rounded-ui hover:bg-destructive/20"
            >
              {t(I18N_KEYS.clear)}
            </button>
          </div>

          <div className="space-y-2">
            {pasteEvents.map((event) => (
              <div
                key={`${event.timestamp}-${event.type}`}
                className="text-xs bg-background p-ui-y rounded-ui border border-border"
              >
                <div className="font-semibold">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div>
                  {t(I18N_KEYS.type)}: {event.type}
                </div>
                <div className="truncate">
                  {t(I18N_KEYS.content)}: {event.content}
                </div>
                <div className="truncate text-primary">
                  {t(I18N_KEYS.result)}: {event.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
