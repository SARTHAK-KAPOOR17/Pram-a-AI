import React, { useState } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCode2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Play,
  Layers,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { testCaseService } from '../services/test-case.service.js';
import { suiteService } from '../services/suite.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ConfirmModal } from '../components/ui/ConfirmModal.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { RunTestModal } from '../components/runs/RunTestModal.jsx';

export const TestCasesListPage = () => {
  const { project } = useOutletContext();
  const projectId = project._id;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedSuite, setSelectedSuite] = useState(searchParams.get('suiteId') || 'all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [deletingTest, setDeletingTest] = useState(null);
  const [runningTest, setRunningTest] = useState(null);

  const { data: suites = [] } = useQuery({
    queryKey: ['suites', projectId],
    queryFn: () => suiteService.getSuites(projectId),
  });

  const {
    data: testCases = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['test-cases', projectId, selectedSuite, selectedPriority, selectedStatus, search],
    queryFn: () =>
      testCaseService.getTestCases(projectId, {
        suiteId: selectedSuite !== 'all' ? selectedSuite : undefined,
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: search.trim() || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (testId) => testCaseService.deleteTestCase(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setDeletingTest(null);
    },
    onError: (err) => {
      alert(err.message || 'Failed to delete test case');
      setDeletingTest(null);
    },
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="error">Critical</Badge>;
      case 'high':
        return <Badge variant="warning">High</Badge>;
      case 'medium':
        return <Badge variant="info">Medium</Badge>;
      default:
        return <Badge variant="neutral">Low</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" dot>Active</Badge>;
      case 'flaky':
        return <Badge variant="warning" dot>Flaky</Badge>;
      case 'deprecated':
        return <Badge variant="error" dot>Deprecated</Badge>;
      default:
        return <Badge variant="neutral" dot>Draft</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Test Cases
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authored automated test flows with locators, actions, and verification assertions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}/tests/new`}>
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Test Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-xl bg-surface-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Input
            placeholder="Search test cases by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-500" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Suite Filter */}
          <select
            value={selectedSuite}
            onChange={(e) => setSelectedSuite(e.target.value)}
            className="rounded-lg bg-surface-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 focus:outline-none focus:border-teal-500 font-mono"
          >
            <option value="all">All Suites</option>
            <option value="unassigned">Unassigned</option>
            {suites.map((s) => (
              <option key={s._id} value={s._id}>
                Suite: {s.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-lg bg-surface-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 focus:outline-none focus:border-teal-500 font-mono"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg bg-surface-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 focus:outline-none focus:border-teal-500 font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="flaky">Flaky</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
      </div>

      {isLoading && <LoadingState message="Loading test cases..." />}

      {!isLoading && testCases.length === 0 && (
        <EmptyState
          icon={FileCode2}
          title="No test cases match your filters"
          description="Build automated browser testing flows with structured locators and assertion checks."
          actionLabel="Create Test Case"
          onAction={() => window.location.assign(`/projects/${projectId}/tests/new`)}
        />
      )}

      {/* Test Cases Table */}
      {!isLoading && testCases.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Test Name</th>
                    <th className="py-3.5 px-4">Suite</th>
                    <th className="py-3.5 px-4">Steps</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {testCases.map((tc) => (
                    <tr
                      key={tc._id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/projects/${projectId}/tests/${tc._id}/edit`}
                          className="font-medium text-slate-100 hover:text-teal-300 transition-colors block"
                        >
                          {tc.name}
                        </Link>
                        {tc.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                            {tc.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {tc.suiteId?.name ? (
                          <span className="text-slate-300 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {tc.suiteId.name}
                          </span>
                        ) : (
                          <span className="text-slate-600">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {tc.steps?.length || 0} steps
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {getPriorityBadge(tc.priority)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {getStatusBadge(tc.status)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(tc.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setRunningTest(tc)}
                            className="p-1.5 rounded hover:bg-teal-950/40 text-teal-400 hover:text-teal-300 transition-colors"
                            title="Run Test Case"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/projects/${projectId}/tests/${tc._id}/edit`}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Edit Test Case"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeletingTest(tc)}
                            className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Test Case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Test Case Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTest}
        onClose={() => setDeletingTest(null)}
        onConfirm={() => deleteMutation.mutate(deletingTest._id)}
        title={`Delete Test Case "${deletingTest?.name}"`}
        description="Are you sure you want to delete this test case? This will remove all associated steps and locator definitions."
        isLoading={deleteMutation.isPending}
      />

      {/* Run Test Execution Modal */}
      <RunTestModal
        isOpen={Boolean(runningTest)}
        onClose={() => setRunningTest(null)}
        testCase={runningTest}
        projectId={projectId}
      />
    </div>
  );
};
