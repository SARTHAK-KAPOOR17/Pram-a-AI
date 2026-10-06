import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Trash2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { projectService } from '../services/project.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { ConfirmModal } from '../components/ui/ConfirmModal.jsx';

export const ProjectSettingsPage = () => {
  const { project, refetchProject } = useOutletContext();
  const projectId = project._id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(project.name || '');
  const [description, setDescription] = useState(project.description || '');
  const [baseUrl, setBaseUrl] = useState(project.baseUrl || '');
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => projectService.updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProject();
      setStatusMessage('Project settings saved successfully');
      setErrorMessage(null);
      setTimeout(() => setStatusMessage(null), 4000);
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to update project settings');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
    onError: (err) => {
      alert(err.message || 'Failed to archive project');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!name.trim()) {
      setErrorMessage('Project name is required');
      return;
    }

    updateMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      baseUrl: baseUrl.trim(),
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
          Project Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure general workspace parameters, application URLs, and deletion options.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <p>{statusMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Configuration</CardTitle>
          <CardDescription>
            Update project metadata and target application coordinates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm px-3.5 py-2 transition-colors focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none font-sans"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Input
              label="Base Application URL"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
            />

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                size="sm"
                isLoading={updateMutation.isPending}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-900/40 bg-surface-900/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <CardTitle className="text-rose-400">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions regarding this project workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-950 border border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Archive / Delete Project
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Archiving this project removes it from your active workspace list.
              </p>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Archive Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Archive Project "${project.name}"`}
        description="Are you sure you want to archive this project? All associated test suites, environments, and test cases will be archived."
        confirmLabel="Archive Project"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
