import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Loader2,
  Layers,
  Camera,
  Terminal,
} from 'lucide-react';
import { environmentService } from '../../services/environment.service.js';
import { testRunService } from '../../services/test-run.service.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const RunTestModal = ({
  isOpen,
  onClose,
  testCase,
  projectId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedEnvId, setSelectedEnvId] = useState('');
  const [browser, setBrowser] = useState('chromium');
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeScreenshotModal, setActiveScreenshotModal] = useState(null);

  const pollingRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch project environments
  const { data: environments = [], isLoading: isLoadingEnvs } = useQuery({
    queryKey: ['environments', projectId],
    queryFn: () => environmentService.getEnvironments(projectId),
    enabled: isOpen && Boolean(projectId),
  });

  // Pre-select default environment
  useEffect(() => {
    if (environments.length > 0 && !selectedEnvId) {
      const defaultEnv = environments.find((e) => e.isDefault) || environments[0];
      setSelectedEnvId(defaultEnv._id);
    }
  }, [environments, selectedEnvId]);

  // Clean up timers on unmount or close
  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setExecutionResult(null);
      setExecutionError(null);
      setElapsedSeconds(0);
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isOpen]);

  // Poll active test run until terminal state
  const startPolling = (runId) => {
    clearTimers();
    setElapsedSeconds(0);

    // Elapsed timer ticker
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Run status polling every 1200ms
    pollingRef.current = setInterval(async () => {
      try {
        const latestRun = await testRunService.getTestRunById(runId);
        setExecutionResult(latestRun);

        if (['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(latestRun.status)) {
          clearTimers();
          queryClient.invalidateQueries({ queryKey: ['project-runs', projectId] });
          queryClient.invalidateQueries({ queryKey: ['test-runs', testCase?._id] });
        }
      } catch (err) {
        // Continue polling or log
      }
    }, 1200);
  };

  const runMutation = useMutation({
    mutationFn: (payload) => testRunService.executeTestRun(payload),
    onSuccess: (data) => {
      setExecutionResult(data);
      if (['QUEUED', 'RUNNING'].includes(data.status)) {
        startPolling(data._id);
      } else {
        queryClient.invalidateQueries({ queryKey: ['project-runs', projectId] });
        queryClient.invalidateQueries({ queryKey: ['test-runs', testCase?._id] });
      }
    },
    onError: (err) => {
      clearTimers();
      setExecutionError(err.message || 'Execution failed to complete');
    },
  });

  const handleExecute = (e) => {
    e.preventDefault();
    if (!selectedEnvId) return;

    setExecutionError(null);
    setExecutionResult(null);

    runMutation.mutate({
      testCaseId: testCase._id,
      environmentId: selectedEnvId,
      browser,
    });
  };

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

  const isExecutionActive =
    executionResult && ['QUEUED', 'RUNNING'].includes(executionResult.status);

  const completedSteps = (executionResult?.stepResults || []).filter(
    (s) => s.status === 'PASSED' || s.status === 'FAILED'
  ).length;
  const totalSteps = executionResult?.stepResults?.length || testCase?.steps?.length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        clearTimers();
        onClose();
      }}
      title={`Run Test: ${testCase?.name || 'Test Case'}`}
      description="Execute this test case in an isolated Playwright browser session against a target environment."
      maxWidth="max-w-2xl"
    >
      {!executionResult ? (
        <form onSubmit={handleExecute} className="space-y-5">
          {executionError && (
            <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <p>{executionError}</p>
            </div>
          )}

          {/* Target Environment Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Execution Environment Target
            </label>
            {isLoadingEnvs ? (
              <div className="text-xs text-slate-500 font-mono py-2">
                Loading environments...
              </div>
            ) : environments.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
                No environments configured for this project. Please create an environment first.
              </div>
            ) : (
              <select
                value={selectedEnvId}
                onChange={(e) => setSelectedEnvId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
                required
              >
                {environments.map((env) => (
                  <option key={env._id} value={env._id}>
                    {env.name} ({env.baseUrl || 'no base url'}) {env.isDefault ? '— [Default]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Browser Matrix Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Browser Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'chromium', label: 'Chromium', badge: 'Default' },
                { id: 'firefox', label: 'Firefox', badge: 'Stable' },
                { id: 'webkit', label: 'WebKit', badge: 'Safari' },
              ].map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => setBrowser(b.id)}
                  className={`px-3 py-2.5 rounded-lg text-left border transition-all ${
                    browser === b.id
                      ? 'bg-teal-950/40 border-teal-500 text-teal-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-medium flex items-center justify-between">
                    <span>{b.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">{b.badge}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Steps Overview */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">Steps to Execute</span>
              <span className="font-mono text-slate-300">{testCase?.steps?.length || 0} steps</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(testCase?.steps || []).map((step, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
                >
                  <span className="text-teal-400 font-bold">{step.order}.</span>
                  {step.action.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={runMutation.isPending || environments.length === 0 || !selectedEnvId}
              isLoading={runMutation.isPending}
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" />
              <span>Launch Execution</span>
            </Button>
          </div>
        </form>
      ) : (
        /* Live Execution / Result View */
        <div className="space-y-5">
          {/* Status Header */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {getStatusBadge(executionResult.status)}
              <div>
                <div className="text-sm font-semibold text-white font-mono">
                  {executionResult.status === 'RUNNING'
                    ? 'Executing Playwright browser session...'
                    : executionResult.status === 'QUEUED'
                    ? 'Execution queued in worker...'
                    : executionResult.status === 'PASSED'
                    ? 'All Test Steps Passed'
                    : 'Test Execution Failed'}
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                  <span>Browser: <strong className="text-slate-300">{executionResult.browser || browser}</strong></span>
                  <span>•</span>
                  <span>Run ID: {executionResult._id?.slice(-8)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              {isExecutionActive ? (
                <div className="flex items-center gap-2 text-teal-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{elapsedSeconds}s elapsed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{executionResult.duration || 0}ms</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar during active run */}
          {isExecutionActive && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Progress</span>
                <span>{completedSteps} / {totalSteps} steps completed</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full transition-all duration-300"
                  style={{
                    width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Execution Error Banner */}
          {executionResult.error && (
            <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Execution Failure Detected</span>
              </div>
              <p className="font-mono text-[11px] text-rose-200/90 pl-6">
                {executionResult.error.message || 'Test step assertion failed.'}
              </p>
            </div>
          )}

          {/* Step Timeline */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Step Execution Trace</span>
              <span className="font-mono text-xs text-slate-500">
                {executionResult.stepResults?.length || 0} steps
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-800/80 rounded-lg p-2 bg-slate-950/50">
              {(executionResult.stepResults || []).map((step) => {
                const isStepRunning = step.status === 'RUNNING';
                return (
                  <div
                    key={step.order}
                    className={`flex items-center justify-between p-2 rounded-md text-xs font-mono border transition-all ${
                      step.status === 'PASSED'
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                        : step.status === 'FAILED'
                        ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                        : isStepRunning
                        ? 'bg-teal-950/30 border-teal-800/60 text-teal-300'
                        : 'bg-slate-900/40 border-slate-800/50 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-5 text-slate-500 font-bold">{step.order}.</span>
                      {step.status === 'PASSED' && (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {step.status === 'FAILED' && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      {isStepRunning && (
                        <Loader2 className="w-4 h-4 text-teal-400 animate-spin shrink-0" />
                      )}
                      {step.status === 'PENDING' && (
                        <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      {step.status === 'SKIPPED' && (
                        <span className="w-4 text-center text-slate-600 shrink-0">-</span>
                      )}

                      <span className="font-semibold">{step.action.toUpperCase()}</span>
                      {step.error && (
                        <span className="text-[11px] text-rose-400 truncate max-w-xs">
                          — {step.error}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {step.screenshot && (
                        <button
                          type="button"
                          onClick={() => setActiveScreenshotModal(step.screenshot)}
                          className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 underline"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Shot</span>
                        </button>
                      )}
                      <span className="text-slate-400 text-[11px]">{step.duration}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setExecutionResult(null);
                setExecutionError(null);
              }}
              disabled={isExecutionActive}
            >
              Run Again
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearTimers();
                  onClose();
                }}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  clearTimers();
                  onClose();
                  navigate(`/projects/${projectId}/runs/${executionResult._id}`);
                }}
              >
                <span>View Full Report</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Screenshot Lightbox */}
      {activeScreenshotModal && (
        <Modal
          isOpen={Boolean(activeScreenshotModal)}
          onClose={() => setActiveScreenshotModal(null)}
          title="Failure Screenshot Capture"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
              <img
                src={activeScreenshotModal}
                alt="Test step failure screenshot"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveScreenshotModal(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
