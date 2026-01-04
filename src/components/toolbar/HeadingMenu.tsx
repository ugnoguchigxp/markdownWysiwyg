import type React from 'react';
import type { Translator } from '../../i18n/I18nContext';
import { I18N_KEYS } from '../../types/index';
import { Heading1 } from '../ui/icons';

interface HeadingMenuProps {
  isOpen: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onInsertMarkdown: (markdown: string) => void;
  t: Translator;
}

const headingLevels = [
  {
    level: 1,
    markdown: '# ',
    className: 'text-4xl font-bold text-foreground',
    preview: 'H1',
    bgColor: 'bg-background hover:bg-accent',
  },
  {
    level: 2,
    markdown: '## ',
    className: 'text-3xl font-bold text-foreground',
    preview: 'H2',
    bgColor: 'bg-background hover:bg-accent',
  },
  {
    level: 3,
    markdown: '### ',
    className: 'text-2xl font-semibold text-foreground',
    preview: 'H3',
    bgColor: 'bg-background hover:bg-accent',
  },
  {
    level: 4,
    markdown: '#### ',
    className: 'text-xl font-semibold text-foreground',
    preview: 'H4',
    bgColor: 'bg-background hover:bg-accent',
  },
  {
    level: 5,
    markdown: '##### ',
    className: 'text-lg font-medium text-foreground',
    preview: 'H5',
    bgColor: 'bg-background hover:bg-accent',
  },
];

export const HeadingMenu: React.FC<HeadingMenuProps> = ({
  isOpen,
  disabled = false,
  onToggle,
  onClose,
  onInsertMarkdown,
  t,
}) => (
  <div className="relative group">
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      data-tooltip={t(I18N_KEYS.heading)}
      className={`
        w-8 h-8 flex items-center justify-center rounded-[var(--radius)] transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        relative text-foreground hover:bg-accent
      `}
    >
      <Heading1 className="w-icon-md h-icon-md" />
      <svg
        className="w-icon-xs h-icon-xs absolute -bottom-0.5 -right-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <title>{t(I18N_KEYS.heading)}</title>
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>

    {isOpen && (
      <>
        <button
          type="button"
          aria-label={t(I18N_KEYS.closeHeadingMenu)}
          className="fixed inset-0 z-10 bg-transparent"
          onClick={onClose}
        />

        <div
          className={`
            absolute left-0 mt-ui-y w-80 bg-popover rounded-[calc(var(--radius)+4px)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-border
            transform transition-all duration-200 origin-top-left
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
          `}
        >
          <div className="py-ui-y">
            {headingLevels.map((heading) => (
              <button
                key={heading.level}
                type="button"
                onClick={() => {
                  onInsertMarkdown(heading.markdown);
                  onClose();
                }}
              >
                <div className="flex items-center w-full">
                  <div
                    className={`
                        flex-1 px-ui-x py-ui-y rounded-md transition-colors duration-150
                        hover:bg-accent hover:text-accent-foreground
                      `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-8 rounded-ui border flex items-center justify-center font-bold shadow-sm bg-background border-border text-foreground">
                        <span
                          className={`
                          ${heading.level === 1 ? 'text-[18px]' : ''}
                          ${heading.level === 2 ? 'text-[16px]' : ''}
                          ${heading.level === 3 ? 'text-[14px]' : ''}
                          ${heading.level >= 4 ? 'text-[12px]' : ''}
                        `}
                        >
                          {heading.preview}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <div
                      className={`
                        truncate max-w-[200px] text-popover-foreground
                        ${heading.level === 1 ? 'text-[22px] font-bold leading-[28px]' : ''}
                        ${heading.level === 2 ? 'text-[18px] font-bold leading-[24px]' : ''}
                        ${heading.level === 3 ? 'text-[16px] font-semibold leading-[22px]' : ''}
                        ${heading.level === 4 ? 'text-[14px] font-semibold leading-[20px]' : ''}
                        ${heading.level === 5 ? 'text-[13px] font-semibold leading-[18px]' : ''}
                      `}
                    >
                      {`${t(I18N_KEYS.heading)}${heading.level}`}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
);
