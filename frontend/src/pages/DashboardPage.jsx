import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Play,
  CheckCircle2,
  Sparkles,
  Terminal,
  RefreshCw,
  FolderKanban,
  Plus,
  ArrowRight,
  Layers,
  Globe,
  FileCode2,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useHealth } from '../hooks/useHealth.js';
import { projectService } from '../services/project.service.js';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: health, isLoading: isHealthLoading, refetch: refetchHealth } = useHealth();

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  const totalTests = projects.reduce((acc, p) => acc + (p.testCount || 0), 0);
  const totalSuites = projects.reduce((acc, p) => acc + (p.suiteCount || 0), 0);

  const handleRefreshAll = () => {
    refetchHealth();
    refetchProjects();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              QA Automation Dashboard
            </h1>
            <Badge variant="teal">Phase 2 Active</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test authoring, application project workspaces, and environment telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link to="/projects/new">
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/projects">
          <Card className="hover:border-slate-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Active Projects
                </span>
                <FolderKanban className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100 font-mono mt-2">
                {projects.length}
              </p>
              <span className="text-[11px] text-teal-400 mt-2 block font-mono">
                View all workspaces &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Authored Tests
              </span>
              <FileCode2 className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono mt-2">{totalTests}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
              <span>Across {totalSuites} test suites</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Self-Healing Ready
              </span>
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-teal-400 font-mono mt-2">Enabled</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
              <span>Locators & metadata stored</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                API Engine State
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <p className="text-xl font-bold text-slate-100 font-mono mt-2">
              {isHealthLoading ? 'Checking...' : health?.success ? 'Healthy (200)' : 'Degraded'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
              <span>DB: {health?.database || 'Standby'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Software Testing Projects</CardTitle>
            <CardDescription>
              Select a project to access its test suites, test cases, and environment configurations.
            </CardDescription>
          </div>
          <Link to="/projects">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              All Projects
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-surface-950 border border-slate-800 flex items-center justify-center text-teal-400 mx-auto">
                <FolderKanban className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">No projects yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Get started by creating your first testing project workspace.
              </p>
              <Link to="/projects/new">
                <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project._id}
                  className="p-4 rounded-xl bg-surface-950 border border-slate-800 hover:border-teal-800/80 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-100 group-hover:text-teal-300 transition-colors">
                        {project.name}
                      </h4>
                      <Badge variant="teal" dot>
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono truncate">
                      <Globe className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="truncate">{project.baseUrl}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      {project.testCount || 0} tests &bull; {project.suiteCount || 0} suites
                    </span>
                    <Link
                      to={`/projects/${project._id}`}
                      className="text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1"
                    >
                      Open &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
