import React, { useState, useEffect } from 'react';
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

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setExecutionResult(null);
      setExecutionError(null);
    }
  }, [isOpen]);

  const runMutation = useMutation({
    mutationFn: (payload) => testRunService.executeTestRun(payload),
    onSuccess: (data) => {
      setExecutionResult(data);
      queryClient.invalidateQueries({ queryKey: ['project-runs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['test-runs', testCase?._id] });
    },
    onError: (err) => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
                className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 text-sm px-3.5 py-2 focus:outline-none focus:border-teal-500 font-sans"
                required
              >
                {environments.map((env) => (
                  <option key={env._id} value={env._id}>
                    {env.name} ({env.baseUrl}) {env.isDefault ? '— [Default]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Browser Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Browser Engine
            </label>
            <select
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 text-sm px-3.5 py-2 focus:outline-none focus:border-teal-500 font-sans"
            >
              <option value="chromium">Chromium (Headless Desktop)</option>
            </select>
          </div>

          {/* Test Case Overview */}
          <div className="p-3 rounded-lg bg-surface-950 border border-slate-800/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Steps Sequence:</span>
              <span className="font-mono text-slate-200">
                {testCase?.steps?.length || 0} steps
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Priority:</span>
              <span className="capitalize font-mono text-slate-200">
                {testCase?.priority || 'medium'}
              </span>
            </div>
          </div>

          {/* Running State Indicator */}
          {runMutation.isPending && (
            <div className="p-4 rounded-xl bg-surface-900/90 border border-teal-800/60 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-teal-400 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-100">
                  Executing Playwright browser session...
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Launching headless Chromium, resolving target selectors, and verifying step assertions.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={runMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={runMutation.isPending}
              disabled={environments.length === 0 || runMutation.isPending}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              {runMutation.isPending ? 'Executing...' : 'Run Test Now'}
            </Button>
          </div>
        </form>
      ) : (
        /* Execution Results View */
        <div className="space-y-5">
          {/* Top Status Card */}
          <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Result:</span>
                {getStatusBadge(executionResult.status)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{(executionResult.duration / 1000).toFixed(2)}s</span>
              </div>
            </div>

            {executionResult.error?.message && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                <p className="font-semibold font-mono">Failure Reason:</p>
                <p className="mt-1 font-mono text-[11px] break-words">
                  {executionResult.error.message}
                </p>
              </div>
            )}
          </div>

          {/* Step Results List */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase">
              Step Execution Breakdown ({executionResult.stepResults?.length || 0})
            </h4>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {executionResult.stepResults?.map((step) => (
                <div
                  key={step.order}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                    step.status === 'PASSED'
                      ? 'bg-surface-950/80 border-slate-800/80'
                      : step.status === 'FAILED'
                      ? 'bg-rose-950/30 border-rose-800/60'
                      : 'bg-surface-950/40 border-slate-900 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-surface-900 border border-slate-800 text-[10px] font-mono flex items-center justify-center shrink-0">
                      {step.order}
                    </span>
                    <span className="font-mono font-semibold text-teal-400 uppercase text-[11px]">
                      {step.action}
                    </span>
                    {step.error && (
                      <span className="text-[11px] text-rose-300 truncate">
                        — {step.error}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {step.duration > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {step.duration}ms
                      </span>
                    )}
                    {getStatusBadge(step.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Failure Screenshot Preview if present */}
          {executionResult.artifacts?.screenshot && (
            <div className="p-3 rounded-lg bg-surface-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-400">
                Failure Screenshot Captured:
              </span>
              <a
                href={executionResult.artifacts.screenshot}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-md border border-slate-800 hover:border-teal-500 transition-colors"
              >
                <img
                  src={executionResult.artifacts.screenshot}
                  alt="Failure Screenshot"
                  className="w-full h-32 object-cover object-top"
                />
              </a>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/projects/${projectId}/runs/${executionResult._id}`);
              }}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
            >
              View Full Run Details
            </Button>

            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
