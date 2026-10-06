import React from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Layers,
  FileCode2,
  Globe,
  PlaySquare,
  Settings,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar.jsx';
import { projectService } from '../services/project.service.js';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { cn } from '../utils/cn.js';
import { Badge } from '../components/ui/Badge.jsx';

export const ProjectLayout = () => {
  const { projectId } = useParams();

  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProjectById(projectId),
    enabled: !!projectId,
  });

  const navLinks = [
    {
      name: 'Overview',
      path: `/projects/${projectId}`,
      exact: true,
      icon: LayoutDashboard,
    },
    {
      name: 'Test Cases',
      path: `/projects/${projectId}/tests`,
      icon: FileCode2,
      badge: project?.testCount ?? undefined,
    },
    {
      name: 'Test Suites',
      path: `/projects/${projectId}/suites`,
      icon: Layers,
      badge: project?.suiteCount ?? undefined,
    },
    {
      name: 'Environments',
      path: `/projects/${projectId}/environments`,
      icon: Globe,
      badge: project?.environmentCount ?? undefined,
    },
    {
      name: 'Test Runs',
      path: '#test-runs',
      icon: PlaySquare,
      badge: 'Phase 3',
      disabled: true,
    },
    {
      name: 'Settings',
      path: `/projects/${projectId}/settings`,
      icon: Settings,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-950">
        <Navbar />
        <LoadingState message="Loading project workspace..." fullPage />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-950">
        <Navbar />
        <div className="p-8">
          <ErrorState
            title="Failed to load project"
            message={error?.message || 'Project could not be found or access was denied.'}
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Project Specific Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-surface-950 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
          <div className="p-4 space-y-6">
            {/* Back to all projects link */}
            <div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-mono transition-colors mb-3"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>All Projects</span>
              </Link>

              {/* Active Project Card */}
              <div className="p-3 rounded-lg bg-surface-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm text-slate-100 truncate">
                    {project?.name || 'Project'}
                  </h2>
                  <Badge variant="teal" dot>
                    Active
                  </Badge>
                </div>
                {project?.baseUrl && (
                  <a
                    href={project.baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-300 font-mono truncate max-w-full"
                  >
                    <span className="truncate">{project.baseUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
                Project Workspace
              </p>
              {navLinks.map((item) => {
                const Icon = item.icon;
                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed select-none opacity-60"
                      title="Available in Phase 3 Execution Engine"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                        {item.badge}
                      </span>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-teal-950/60 text-teal-300 border border-teal-800/50'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-surface-900'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-900 text-slate-400 border border-slate-800">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-slate-800/60">
            <div className="text-[11px] text-slate-500 font-mono">
              Workspace ID: {projectId.slice(-6)}
            </div>
          </div>
        </aside>

        {/* Workspace Content */}
        <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
          <Outlet context={{ project, refetchProject: refetch }} />
        </main>
      </div>
    </div>
  );
};
