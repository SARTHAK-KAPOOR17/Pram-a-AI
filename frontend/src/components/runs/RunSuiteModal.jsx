import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { environmentService } from '../../services/environment.service.js';
import { testRunService } from '../../services/test-run.service.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const RunSuiteModal = ({
  isOpen,
  onClose,
  suite,
  projectId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedEnvId, setSelectedEnvId] = useState('');
  const [browser, setBrowser] = useState('chromium');
  const [suiteRunResult, setSuiteRunResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  useEffect(() => {
    if (isOpen) {
      setSuiteRunResult(null);
      setExecutionError(null);
      setElapsedSeconds(0);
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isOpen]);

  const startPolling = (suiteRunId) => {
    clearTimers();
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    pollingRef.current = setInterval(async () => {
      try {
        const latestSuiteRun = await testRunService.getSuiteRunById(suiteRunId);
        setSuiteRunResult(latestSuiteRun);

        if (['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(latestSuiteRun.status)) {
          clearTimers();
          queryClient.invalidateQueries({ queryKey: ['project-runs', projectId] });
          queryClient.invalidateQueries({ queryKey: ['suites', projectId] });
        }
      } catch (err) {
        // Continue polling
      }
    }, 1500);
  };

  const runMutation = useMutation({
    mutationFn: (payload) => testRunService.executeSuiteRun(suite._id, payload),
    onSuccess: (data) => {
      setSuiteRunResult(data);
      if (['QUEUED', 'RUNNING'].includes(data.status)) {
        startPolling(data._id);
      } else {
        queryClient.invalidateQueries({ queryKey: ['project-runs', projectId] });
      }
    },
    onError: (err) => {
      clearTimers();
      setExecutionError(err.message || 'Failed to start suite execution');
    },
  });

  const handleExecute = (e) => {
    e.preventDefault();
    if (!selectedEnvId) return;

    setExecutionError(null);
    setSuiteRunResult(null);

    runMutation.mutate({
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
      default:
        return <Badge variant="error">{status}</Badge>;
    }
  };

  const isExecutionActive =
    suiteRunResult && ['QUEUED', 'RUNNING'].includes(suiteRunResult.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        clearTimers();
        onClose();
      }}
      title={`Run Test Suite: ${suite?.name || 'Suite'}`}
      description="Sequentially executes all test cases in this suite using Playwright."
      maxWidth="max-w-2xl"
    >
      {!suiteRunResult ? (
        <form onSubmit={handleExecute} className="space-y-5">
          {executionError && (
            <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <p>{executionError}</p>
            </div>
          )}

          {/* Environment selection */}
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
                No environments configured for this project.
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

          {/* Browser engine selector */}
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

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Tests in Suite:</span>
            <span className="text-teal-400 font-bold">{suite?.testCount || 0} TestCases</span>
          </div>

          {/* Actions */}
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
              <span>Launch Suite Execution</span>
            </Button>
          </div>
        </form>
      ) : (
        /* Suite Execution Results View */
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {getStatusBadge(suiteRunResult.status)}
              <div>
                <div className="text-sm font-semibold text-white font-mono">
                  {suiteRunResult.status === 'RUNNING'
                    ? 'Executing Test Suite in Background...'
                    : suiteRunResult.status === 'QUEUED'
                    ? 'Suite Run Queued in Worker...'
                    : suiteRunResult.status === 'PASSED'
                    ? 'All Test Cases Passed Successfully'
                    : 'Suite Completed with Failures'}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Browser: <strong className="text-slate-300">{suiteRunResult.browser || browser}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              {isExecutionActive ? (
                <div className="flex items-center gap-2 text-teal-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{elapsedSeconds}s elapsed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{suiteRunResult.duration || 0}ms</span>
                </div>
              )}
            </div>
          </div>

          {/* Suite Summary Cards */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Total</span>
              <span className="text-sm font-bold text-white">
                {suiteRunResult.summary?.total || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
              <span className="text-[10px] text-emerald-400 block uppercase">Passed</span>
              <span className="text-sm font-bold text-emerald-300">
                {suiteRunResult.summary?.passed || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
              <span className="text-[10px] text-rose-400 block uppercase">Failed</span>
              <span className="text-sm font-bold text-rose-300">
                {suiteRunResult.summary?.failed || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40">
              <span className="text-[10px] text-amber-400 block uppercase">Errors</span>
              <span className="text-sm font-bold text-amber-300">
                {suiteRunResult.summary?.error || 0}
              </span>
            </div>
          </div>

          {/* Executed Test Cases List */}
          {suiteRunResult.testRuns?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-300">Executed Test Runs</div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-lg p-2 bg-slate-950/40 font-mono text-xs">
                {suiteRunResult.testRuns.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800"
                  >
                    <span className="text-slate-200 truncate">
                      {typeof r === 'object' && r.testCaseId?.name ? r.testCaseId.name : `Run #${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearTimers();
                        onClose();
                        navigate(`/projects/${projectId}/runs/${typeof r === 'object' ? r._id : r}`);
                      }}
                      className="text-teal-400 hover:text-teal-300 text-[11px] inline-flex items-center gap-1"
                    >
                      <span>View Run</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSuiteRunResult(null);
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
                  navigate(`/projects/${projectId}/runs`);
                }}
              >
                <span>View Project Runs</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
