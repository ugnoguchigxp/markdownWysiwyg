import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ToolbarButtonProps {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  title,
  onClick,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    data-tooltip={title}
    className={`
      w-8 h-8 flex items-center justify-center rounded transition-colors duration-150
      disabled:opacity-50 disabled:cursor-not-allowed
    `}
    style={{
      color: 'var(--mw-toolbar-text)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--mw-toolbar-hover-bg)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    <Icon className="w-4 h-4" />
  </button>
);
