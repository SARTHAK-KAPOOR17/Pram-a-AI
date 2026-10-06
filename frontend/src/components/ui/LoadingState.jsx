import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const LoadingState = ({
  message = 'Loading data...',
  className,
  fullPage = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-400',
        fullPage && 'min-h-[60vh]',
        className
      )}
    >
      <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
