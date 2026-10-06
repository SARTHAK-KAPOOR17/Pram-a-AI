import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileCode2,
  Layers,
  Globe,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { testCaseService } from '../services/test-case.service.js';
import { suiteService } from '../services/suite.service.js';
import { environmentService } from '../services/environment.service.js';

export const ProjectOverviewPage = () => {
  const { project } = useOutletContext();
  const projectId = project._id;

  const { data: testCases = [] } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: () => testCaseService.getTestCases(projectId),
  });

  const { data: suites = [] } = useQuery({
    queryKey: ['suites', projectId],
    queryFn: () => suiteService.getSuites(projectId),
  });

  const { data: environments = [] } = useQuery({
    queryKey: ['environments', projectId],
    queryFn: () => environmentService.getEnvironments(projectId),
  });

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              {project.name}
            </h1>
            <Badge variant="teal" dot>
              Active
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {project.description || 'Application workspace for test authoring and environment management.'}
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to={`/projects/${projectId}/tests`}>
          <Card className="hover:border-slate-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Test Cases
                </span>
                <FileCode2 className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100 font-mono mt-2">
                {testCases.length}
              </p>
              <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                Authored automated specs &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectId}/suites`}>
          <Card className="hover:border-slate-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Test Suites
                </span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100 font-mono mt-2">
                {suites.length}
              </p>
              <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                Logical test collections &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${projectId}/environments`}>
          <Card className="hover:border-slate-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Environments
                </span>
                <Globe className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100 font-mono mt-2">
                {environments.length}
              </p>
              <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                Deployment targets &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout: Environments & Recent Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Environments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Configured Environments</CardTitle>
              <CardDescription>Target URLs for browser execution</CardDescription>
            </div>
            <Link to={`/projects/${projectId}/environments`}>
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {environments.map((env) => (
              <div
                key={env._id}
                className="p-3 rounded-lg bg-surface-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{env.name}</span>
                    {env.isDefault && <Badge variant="teal">Default</Badge>}
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] truncate block max-w-xs">
                    {env.baseUrl}
                  </span>
                </div>
                <a
                  href={env.baseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Test Cases Preview */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Authored Test Cases</CardTitle>
              <CardDescription>Recently created verification flows</CardDescription>
            </div>
            <Link to={`/projects/${projectId}/tests`}>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            {testCases.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No test cases authored yet. Click "Create Test Case" to begin.
              </p>
            ) : (
              <div className="space-y-2">
                {testCases.slice(0, 5).map((tc) => (
                  <Link
                    key={tc._id}
                    to={`/projects/${projectId}/tests/${tc._id}/edit`}
                    className="p-3 rounded-lg bg-surface-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition-colors group block"
                  >
                    <div>
                      <p className="font-medium text-slate-200 group-hover:text-teal-300 transition-colors">
                        {tc.name}
                      </p>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {tc.steps?.length || 0} steps &bull; {tc.priority.toUpperCase()}
                      </span>
                    </div>
                    <Badge variant={tc.status === 'active' ? 'success' : 'neutral'}>
                      {tc.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
