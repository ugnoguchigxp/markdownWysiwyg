import type React from 'react';
import type { LucideIcon } from '../ui/icons';

interface ToolbarButtonProps {
  icon: LucideIcon;
  title: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
    onClick={(e) => onClick(e)}
    onMouseDown={(e) => {
      // Prevent default to keep editor focus, but allow click event to propagate
      e.preventDefault();
    }}
    disabled={disabled}
    data-tooltip={title}
    className={`
      w-8 h-8 flex items-center justify-center rounded transition-colors duration-150
      disabled:opacity-50 disabled:cursor-not-allowed
      text-foreground hover:bg-accent
    `}
  >
    <Icon className="w-4 h-4" />
  </button>
);
