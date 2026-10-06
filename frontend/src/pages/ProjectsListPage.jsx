import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  Plus,
  Search,
  ArrowRight,
  Globe,
  Layers,
  FileCode2,
  Calendar,
} from 'lucide-react';
import { projectService } from '../services/project.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Input } from '../components/ui/Input.jsx';

export const ProjectsListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
    p.baseUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Testing Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your applications under test, suites, and target environments.
          </p>
        </div>

        <Link to="/projects/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create Project
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search projects by name, URL, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-500" />}
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && <LoadingState message="Loading projects..." />}

      {isError && (
        <ErrorState
          title="Could not load projects"
          message={error?.message || 'Failed to fetch projects.'}
          onRetry={refetch}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No testing projects yet"
          description="Create your first project to start authoring test suites, configuring environments, and executing tests."
          actionLabel="Create Project"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={() => navigate('/projects/new')}
        />
      )}

      {/* Projects Grid */}
      {!isLoading && !isError && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project._id}
              className="flex flex-col justify-between hover:border-slate-700 hover:shadow-lg transition-all group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-950 border border-slate-800 flex items-center justify-center text-teal-400 shrink-0 group-hover:border-teal-700/60 transition-colors">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <Badge variant={project.status === 'active' ? 'teal' : 'neutral'} dot>
                    {project.status === 'active' ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[2rem]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Target URL */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-surface-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80">
                  <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="truncate">{project.baseUrl}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{project.testCount || 0} Tests</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>{project.suiteCount || 0} Suites</span>
                  </div>
                </div>

                {/* Open project button */}
                <div className="pt-2">
                  <Link
                    to={`/projects/${project._id}`}
                    className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-surface-950 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-800/80 text-xs font-medium text-slate-200 hover:text-teal-300 transition-colors group/btn"
                  >
                    <span>Open Project Workspace</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover/btn:text-teal-400 group-hover/btn:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
