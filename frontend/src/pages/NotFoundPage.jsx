import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-slate-800 flex items-center justify-center text-teal-400 mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold font-mono text-white mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        The QA workspace or route you requested does not exist or has been relocated.
      </p>
      <Link to="/dashboard">
        <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
