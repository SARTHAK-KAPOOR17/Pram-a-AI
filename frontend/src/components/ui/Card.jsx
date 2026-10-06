import React from 'react';
import { cn } from '../../utils/cn.js';

export const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800/80 bg-surface-900/90 text-slate-100 shadow-sm transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-800/60', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('text-base font-semibold text-slate-100 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ className, children, ...props }) => {
  return (
    <p className={cn('text-xs text-slate-400 mt-1', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-800/60 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
};
