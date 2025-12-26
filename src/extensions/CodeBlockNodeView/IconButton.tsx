import React from 'react';

interface IconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}

export const IconButton = ({ onClick, title, children }: IconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="flex items-center justify-center w-7 h-7 bg-slate-700 border border-slate-600 rounded text-slate-200 hover:bg-slate-600 transition-colors text-sm"
  >
    {children}
  </button>
);
