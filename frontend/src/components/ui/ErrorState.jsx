import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';
import { cn } from '../../utils/cn.js';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while fetching information.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-900/40 bg-rose-950/20 text-slate-300 max-w-md mx-auto my-6',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-400 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-100 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
