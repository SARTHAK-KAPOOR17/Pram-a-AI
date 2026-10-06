import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, FolderPlus, Globe, ArrowRight, AlertCircle } from 'lucide-react';
import { projectService } from '../services/project.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';

export const CreateProjectPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [error, setError] = useState(null);

  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${newProject._id}`);
    },
    onError: (err) => {
      setError(err.message || 'Failed to create project. Please verify inputs.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!baseUrl.trim()) {
      setError('Base Application URL is required');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      baseUrl: baseUrl.trim(),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Back button */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-mono transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      <Card className="border-slate-800 bg-surface-900/90 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/80 flex items-center justify-center text-teal-400 shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Define the primary application under test and target URL.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Project Name"
              placeholder="e.g. E-Commerce Storefront"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              helperText="A descriptive identifier for this software application."
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm px-3.5 py-2 transition-colors focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                placeholder="e.g. Core web storefront, checkout funnel, and customer onboarding tests."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Input
              label="Application URL"
              type="url"
              placeholder="https://example.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
              leftIcon={<Globe className="w-4 h-4" />}
              helperText="The baseline root URL for Playwright browser navigation."
            />

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link to="/projects">
                <Button variant="ghost" size="sm" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                isLoading={createMutation.isPending}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
