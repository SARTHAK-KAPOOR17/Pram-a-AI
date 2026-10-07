import React, { useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  Clock,
  Globe,
  User,
  AlertCircle,
  ExternalLink,
  Camera,
  CheckCircle,
  XCircle,
  Play,
  Layers,
  Copy,
  Maximize2,
} from 'lucide-react';
import { testRunService } from '../services/test-run.service.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Modal } from '../components/ui/Modal.jsx';

export const RunDetailsPage = () => {
  const { projectId, runId } = useParams();
  const { project } = useOutletContext();

  const [activeScreenshot, setActiveScreenshot] = useState(null);

  const {
    data: run,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['run-detail', runId],
    queryFn: () => testRunService.getTestRunById(runId),
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASSED':
        return <Badge variant="success" dot>Passed</Badge>;
      case 'FAILED':
        return <Badge variant="error" dot>Failed</Badge>;
      case 'RUNNING':
        return <Badge variant="teal" dot>Running</Badge>;
      case 'QUEUED':
        return <Badge variant="info">Queued</Badge>;
      case 'SKIPPED':
        return <Badge variant="neutral">Skipped</Badge>;
      default:
        return <Badge variant="error">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading test execution run..." fullPage />;
  }

  if (isError || !run) {
    return (
      <ErrorState
        title="Failed to load test run"
        message={error?.message || 'Execution run not found or access denied.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Link & Header */}
      <div>
        <Link
          to={`/projects/${projectId}/runs`}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-teal-400 font-mono transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Runs</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                {run.testCaseId?.name || 'Execution Run'}
              </h1>
              {getStatusBadge(run.status)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Run ID: <span className="text-slate-300">{run._id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {run.testCaseId?._id && (
              <Link to={`/projects/${projectId}/tests/${run.testCaseId._id}/edit`}>
                <Button size="sm" variant="secondary">
                  Open Test Case
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Duration
          </span>
          <div className="text-base font-bold font-mono text-slate-100 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>{run.duration > 0 ? `${(run.duration / 1000).toFixed(2)}s` : '—'}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Environment Target
          </span>
          <div className="text-xs font-semibold text-slate-200 truncate">
            {run.environmentId?.name || 'Default'}
          </div>
          <p className="text-[11px] font-mono text-slate-400 truncate">
            {run.environmentId?.baseUrl || ''}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Browser
          </span>
          <div className="text-xs font-mono font-semibold uppercase text-slate-200">
            {run.browser || 'chromium'} (headless)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Triggered By
          </span>
          <div className="text-xs font-medium text-slate-200 truncate">
            {run.triggeredBy?.name || 'User'}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {run.triggeredBy?.email || ''}
          </p>
        </div>
      </div>

      {/* Failure Overview Banner */}
      {run.status === 'FAILED' && run.error?.message && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-rose-200 font-mono">
                Execution Assertion / Step Failure
              </h3>
              <p className="text-xs font-mono text-rose-300 break-words">
                {run.error.message}
              </p>
              {run.artifacts?.currentUrl && (
                <p className="text-[11px] font-mono text-rose-400/80 pt-1">
                  URL at failure: <span className="underline">{run.artifacts.currentUrl}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Failure Screenshot Artifact Card */}
      {run.artifacts?.screenshot && (
        <Card className="border-rose-900/40 bg-surface-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-400" />
                <CardTitle className="text-sm">Captured Failure Screenshot</CardTitle>
              </div>
              <a
                href={run.artifacts.screenshot}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-400 hover:text-teal-300 font-mono inline-flex items-center gap-1"
              >
                <span>Open Raw</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="relative group rounded-lg overflow-hidden border border-slate-800 bg-black cursor-pointer"
              onClick={() => setActiveScreenshot(run.artifacts.screenshot)}
            >
              <img
                src={run.artifacts.screenshot}
                alt="Test Failure Screenshot"
                className="w-full max-h-96 object-contain object-top"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-mono text-white gap-1.5">
                <Maximize2 className="w-4 h-4" />
                <span>Click to expand screenshot</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Execution Sequence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-mono">
            Sequential Step Breakdown ({run.stepResults?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {run.stepResults?.map((step) => (
              <div
                key={step.order}
                className={`p-4 rounded-xl border transition-all ${
                  step.status === 'PASSED'
                    ? 'bg-surface-950/70 border-slate-800/80'
                    : step.status === 'FAILED'
                    ? 'bg-rose-950/20 border-rose-800/80'
                    : 'bg-surface-950/30 border-slate-900 text-slate-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md bg-surface-900 border border-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.order}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-400 uppercase text-xs">
                          {step.action}
                        </span>
                        {getStatusBadge(step.status)}
                      </div>

                      {step.currentUrl && (
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-lg">
                          URL: {step.currentUrl}
                        </p>
                      )}

                      {step.error && (
                        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs font-mono text-rose-300 mt-2">
                          {step.error}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-slate-400">
                      {step.duration > 0 ? `${step.duration}ms` : '—'}
                    </span>
                  </div>
                </div>

                {/* Step specific screenshot thumbnail if present */}
                {step.screenshot && step.screenshot !== run.artifacts?.screenshot && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setActiveScreenshot(step.screenshot)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-mono"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>View Step Screenshot</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Expand Modal */}
      <Modal
        isOpen={Boolean(activeScreenshot)}
        onClose={() => setActiveScreenshot(null)}
        title="Execution Screenshot Preview"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-3">
          <div className="overflow-auto max-h-[75vh] rounded-lg border border-slate-800 bg-black">
            <img
              src={activeScreenshot}
              alt="Execution Failure"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setActiveScreenshot(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
