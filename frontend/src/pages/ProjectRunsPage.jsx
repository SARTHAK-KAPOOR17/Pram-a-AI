import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlaySquare,
  Clock,
  Globe,
  User,
  ArrowRight,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { testRunService } from '../services/test-run.service.js';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const ProjectRunsPage = () => {
  const { project } = useOutletContext();
  const projectId = project._id;

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const {
    data: runs = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['project-runs', projectId],
    queryFn: () => testRunService.getRunsByProject(projectId),
  });

  const filteredRuns = runs.filter((run) => {
    if (statusFilter && run.status !== statusFilter) return false;
    if (search) {
      const testName = run.testCaseId?.name || '';
      const envName = run.environmentId?.name || '';
      const q = search.toLowerCase();
      return testName.toLowerCase().includes(q) || envName.toLowerCase().includes(q);
    }
    return true;
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
      case 'CANCELLED':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="error">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Test Execution Runs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical browser execution results, step breakdowns, and captured failure artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            isLoading={isRefetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link to={`/projects/${projectId}/tests`}>
            <Button size="sm">Go to Tests</Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by test case name or environment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-surface-900 border border-slate-800 text-xs pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 font-sans focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-surface-900 border border-slate-800 text-xs px-3 py-2 text-slate-200 font-sans focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="ERROR">Error</option>
            <option value="RUNNING">Running</option>
          </select>
        </div>
      </div>

      {/* Runs Table / Content */}
      {isLoading ? (
        <LoadingState message="Loading test runs..." />
      ) : runs.length === 0 ? (
        <EmptyState
          icon={PlaySquare}
          title="No test executions recorded"
          description="Execute your test cases against an environment to record automated Playwright browser test runs."
          actionLabel="View Test Cases"
          onAction={() => {}}
        />
      ) : filteredRuns.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-surface-900/40 border border-slate-800 text-slate-400 text-xs font-mono">
          No execution runs match the selected filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-surface-900/60 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-surface-950/80 font-mono text-slate-400">
                <th className="py-3 px-4 font-semibold">STATUS</th>
                <th className="py-3 px-4 font-semibold">TEST CASE</th>
                <th className="py-3 px-4 font-semibold">ENVIRONMENT</th>
                <th className="py-3 px-4 font-semibold">BROWSER</th>
                <th className="py-3 px-4 font-semibold">DURATION</th>
                <th className="py-3 px-4 font-semibold">STARTED AT</th>
                <th className="py-3 px-4 font-semibold">TRIGGERED BY</th>
                <th className="py-3 px-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRuns.map((run) => (
                <tr
                  key={run._id}
                  className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-mono">
                    {getStatusBadge(run.status)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/projects/${projectId}/runs/${run._id}`}
                      className="font-medium text-slate-200 group-hover:text-teal-400 transition-colors font-sans"
                    >
                      {run.testCaseId?.name || 'Untitled Test Case'}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      {run.environmentId?.name || 'Default'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 uppercase text-[11px]">
                    {run.browser || 'chromium'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {run.duration > 0 ? `${(run.duration / 1000).toFixed(2)}s` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {run.startedAt
                      ? new Date(run.startedAt).toLocaleString()
                      : new Date(run.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {run.triggeredBy?.name || 'User'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/projects/${projectId}/runs/${run._id}`}
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-mono transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
