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
  Maximize2,
  Video,
  FileArchive,
  Terminal,
  Activity,
  Code2,
  Download,
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

  const [activeTab, setActiveTab] = useState('steps'); // 'steps' | 'artifacts' | 'console' | 'network' | 'diagnostics'
  const [activeScreenshot, setActiveScreenshot] = useState(null);
  const [consoleFilter, setConsoleFilter] = useState('all');

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

  const filteredConsoleLogs = (run.consoleLogs || []).filter((log) => {
    if (consoleFilter === 'all') return true;
    return log.type?.toLowerCase() === consoleFilter;
  });

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

      {/* Failure Overview Alert */}
      {run.status === 'FAILED' && run.error?.message && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 overflow-hidden">
              <h3 className="text-sm font-semibold text-rose-200 font-mono">
                Failure Detected at Step {run.artifacts?.failedStepOrder || 'Execution'}
              </h3>
              <p className="text-xs text-rose-300 font-mono break-words">
                {run.error.message}
              </p>
              {run.artifacts?.currentUrl && (
                <p className="text-[11px] text-rose-400/80 font-mono flex items-center gap-1.5 pt-1">
                  <span>URL at failure:</span>
                  <a
                    href={run.artifacts.currentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-white truncate"
                  >
                    {run.artifacts.currentUrl}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800">
        {[
          { id: 'steps', label: 'Step Results', icon: Layers, count: run.stepResults?.length },
          {
            id: 'artifacts',
            label: 'Artifacts & Media',
            icon: Video,
            count: [run.artifacts?.screenshot, run.artifacts?.video, run.artifacts?.trace].filter(Boolean).length,
          },
          { id: 'console', label: 'Console Logs', icon: Terminal, count: run.consoleLogs?.length || 0 },
          { id: 'network', label: 'Network Activity', icon: Activity, count: run.networkLogs?.length || 0 },
          ...(run.failureDetails || run.status === 'FAILED'
            ? [{ id: 'diagnostics', label: 'Failure Diagnostics', icon: Code2 }]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-teal-500 text-teal-400 bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Step Execution Breakdown */}
      {activeTab === 'steps' && (
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

                  {/* Step screenshot thumbnail if present */}
                  {step.screenshot && (
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
      )}

      {/* Tab: Artifacts & Media (Screenshot, Video, Trace) */}
      {activeTab === 'artifacts' && (
        <div className="space-y-6">
          {/* Failure Screenshot */}
          {run.artifacts?.screenshot && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-400" />
                  <span>Failure Screenshot</span>
                </CardTitle>
                <a
                  href={run.artifacts.screenshot}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
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

          {/* Execution Video Player */}
          {run.artifacts?.video && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Video className="w-4 h-4 text-teal-400" />
                  <span>Session Video Recording</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                  <video
                    controls
                    className="w-full max-h-96 object-contain"
                    src={run.artifacts.video}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Playwright Trace File */}
          {run.artifacts?.trace && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-teal-400" />
                  <span>Playwright Trace Archive</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-200 font-mono">
                      trace.zip
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Contains DOM snapshots, network requests, console entries, and action timings. Inspect with{' '}
                      <code className="text-teal-400">npx playwright show-trace</code>.
                    </p>
                  </div>
                  <a
                    href={run.artifacts.trace}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-mono font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Trace</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {!run.artifacts?.screenshot && !run.artifacts?.video && !run.artifacts?.trace && (
            <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
              No media or execution artifacts were generated for this run.
            </div>
          )}
        </div>
      )}

      {/* Tab: Console Logs */}
      {activeTab === 'console' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span>Browser Console Output ({run.consoleLogs?.length || 0})</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              {['all', 'error', 'warning', 'info', 'log'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setConsoleFilter(lvl)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded capitalize transition-colors ${
                    consoleFilter === lvl
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredConsoleLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No console messages captured matching filter.
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-900">
                {filteredConsoleLogs.map((c, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 rounded flex items-start gap-2 ${
                      c.type === 'error'
                        ? 'bg-rose-950/30 text-rose-300'
                        : c.type === 'warning'
                        ? 'bg-amber-950/30 text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="uppercase text-[10px] font-bold opacity-60 w-12 shrink-0">
                      [{c.type}]
                    </span>
                    <span className="flex-1 break-all">{c.text}</span>
                    {c.location && (
                      <span className="text-[10px] opacity-40 shrink-0">{c.location}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Network Activity */}
      {activeTab === 'network' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Network Requests ({run.networkLogs?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!run.networkLogs || run.networkLogs.length === 0) ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No network activity recorded during this session.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                      <th className="pb-2 font-normal">Method</th>
                      <th className="pb-2 font-normal">Status</th>
                      <th className="pb-2 font-normal">Type</th>
                      <th className="pb-2 font-normal">URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {run.networkLogs.map((req, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-2 text-teal-400 font-bold">{req.method}</td>
                        <td className="py-2">
                          <span
                            className={
                              req.status >= 400
                                ? 'text-rose-400 font-bold'
                                : req.status >= 300
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-2 text-slate-400 text-[11px]">{req.resourceType}</td>
                        <td className="py-2 text-slate-300 truncate max-w-md" title={req.url}>
                          {req.url}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Failure Diagnostics & Self-Healing Context */}
      {activeTab === 'diagnostics' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Code2 className="w-4 h-4 text-teal-400" />
              <span>Structured Failure Diagnostics & DOM Telemetry</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {run.failureDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block">Failed Step:</span>
                    <span className="text-white font-bold">
                      Step {run.failureDetails.stepOrder} ({run.failureDetails.action})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Selector Strategy:</span>
                    <span className="text-teal-400">
                      {run.failureDetails.locatorStrategy}: "{run.failureDetails.locatorValue}"
                    </span>
                  </div>
                </div>

                {run.failureDetails.domContext && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-slate-400">DOM Context Snapshot:</span>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-80">
                      {JSON.stringify(run.failureDetails.domContext, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No structured failure telemetry available for this run.
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
