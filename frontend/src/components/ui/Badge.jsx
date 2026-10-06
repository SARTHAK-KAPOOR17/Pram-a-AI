import React from 'react';
import { cn } from '../../utils/cn.js';

const variantStyles = {
  success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
  error: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
  warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
  info: 'bg-sky-950/80 text-sky-400 border-sky-800/60',
  teal: 'bg-teal-950/80 text-teal-400 border-teal-800/60',
  neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
};

export const Badge = ({
  className,
  variant = 'neutral',
  dot = false,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'error' && 'bg-rose-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'info' && 'bg-sky-400',
            variant === 'teal' && 'bg-teal-400 animate-pulse',
            variant === 'neutral' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
};
