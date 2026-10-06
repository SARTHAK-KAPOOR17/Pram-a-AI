import React from 'react';
import { cn } from '../../utils/cn.js';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold shadow-sm shadow-teal-500/20 active:translate-y-px',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:translate-y-px',
  outline: 'bg-transparent border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm shadow-rose-600/20 active:translate-y-px',
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-3.5 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2.5',
};

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-surface-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
