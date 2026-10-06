import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  ExternalLink,
  Variable,
  AlertCircle,
} from 'lucide-react';
import { environmentService } from '../services/environment.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { ConfirmModal } from '../components/ui/ConfirmModal.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const EnvironmentsPage = () => {
  const { project } = useOutletContext();
  const projectId = project._id;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [deletingEnv, setDeletingEnv] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [variables, setVariables] = useState([]);
  const [formError, setFormError] = useState(null);

  const {
    data: environments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['environments', projectId],
    queryFn: () => environmentService.getEnvironments(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingEnv) {
        return environmentService.updateEnvironment(editingEnv._id, data);
      }
      return environmentService.createEnvironment(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments', projectId] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to save environment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (envId) => environmentService.deleteEnvironment(envId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments', projectId] });
      setDeletingEnv(null);
    },
    onError: (err) => {
      alert(err.message || 'Cannot delete environment');
      setDeletingEnv(null);
    },
  });

  const openCreateModal = (presetName = '') => {
    setEditingEnv(null);
    setName(presetName);
    setBaseUrl(project.baseUrl || 'https://');
    setIsDefault(environments.length === 0);
    setVariables([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (env) => {
    setEditingEnv(env);
    setName(env.name);
    setBaseUrl(env.baseUrl);
    setIsDefault(env.isDefault);
    setVariables(env.variables || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEnv(null);
    setFormError(null);
  };

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '', isSecret: false }]);
  };

  const updateVariable = (idx, field, val) => {
    const updated = [...variables];
    updated[idx][field] = val;
    setVariables(updated);
  };

  const removeVariable = (idx) => {
    setVariables(variables.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Environment name is required');
      return;
    }
    if (!baseUrl.trim()) {
      setFormError('Base URL is required');
      return;
    }

    // Clean variables
    const cleanVars = variables
      .filter((v) => v.key.trim() !== '')
      .map((v) => ({
        key: v.key.trim(),
        value: v.value,
        isSecret: Boolean(v.isSecret),
      }));

    saveMutation.mutate({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      isDefault,
      variables: cleanVars,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Environment Targets
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure target base URLs and environment parameters for test executions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openCreateModal()} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Environment
          </Button>
        </div>
      </div>

      {/* Quick Presets If Few Environments Exist */}
      {environments.length < 3 && (
        <div className="p-4 rounded-xl bg-surface-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="w-4 h-4 text-teal-400" />
            <span>Quick Presets:</span>
          </div>
          <div className="flex items-center gap-2">
            {['Development', 'Staging', 'Production'].map((preset) => {
              const exists = environments.some(
                (e) => e.name.toLowerCase() === preset.toLowerCase()
              );
              return (
                <button
                  key={preset}
                  disabled={exists}
                  onClick={() => openCreateModal(preset)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
                    exists
                      ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'border-slate-700 bg-surface-950 text-slate-300 hover:border-teal-500 hover:text-teal-300'
                  }`}
                >
                  + {preset}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Environment List */}
      {isLoading && <LoadingState message="Loading environments..." />}

      {!isLoading && environments.length === 0 && (
        <EmptyState
          icon={Globe}
          title="No environments configured"
          description="Define development, staging, or production target environments for this project."
          actionLabel="Create Environment"
          onAction={() => openCreateModal()}
        />
      )}

      {!isLoading && environments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {environments.map((env) => (
            <Card
              key={env._id}
              className={`hover:border-slate-700 transition-colors ${
                env.isDefault ? 'border-teal-800/60 bg-surface-900/90' : ''
              }`}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-surface-950 border border-slate-800 flex items-center justify-center text-teal-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">
                        {env.name}
                      </h3>
                      {env.isDefault ? (
                        <Badge variant="teal" dot>
                          Default Execution Target
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Secondary Target
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(env)}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Edit environment"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingEnv(env)}
                      disabled={environments.length <= 1}
                      className="p-1.5 rounded-md hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete environment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Target URL */}
                <div className="p-2.5 rounded-lg bg-surface-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 truncate">{env.baseUrl}</span>
                  <a
                    href={env.baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-teal-400 ml-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>

                {/* Environment Variables summary */}
                <div className="pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Variables: {env.variables?.length || 0} configured
                  </span>
                  {env.variables && env.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {env.variables.map((v, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-surface-950 text-[10px] font-mono text-slate-300 border border-slate-800"
                        >
                          {v.key}: {v.isSecret ? '••••••' : v.value || 'null'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Environment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEnv ? 'Edit Environment' : 'Create Environment'}
        description="Specify target application base URL and environment-level configuration variables."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <p>{formError}</p>
            </div>
          )}

          <Input
            label="Environment Name"
            placeholder="e.g. Staging, Development, Production"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Base URL"
            type="url"
            placeholder="https://staging.example.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            required
            leftIcon={<Globe className="w-4 h-4" />}
          />

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded bg-surface-900 border-slate-800 text-teal-500 focus:ring-teal-500"
            />
            <span>Set as default execution environment for this project</span>
          </label>

          {/* Environment Variables Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Environment Variables
              </span>
              <button
                type="button"
                onClick={addVariable}
                className="text-xs text-teal-400 hover:text-teal-300 font-mono"
              >
                + Add Variable
              </button>
            </div>

            {variables.map((variable, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="KEY"
                  value={variable.key}
                  onChange={(e) => updateVariable(idx, 'key', e.target.value)}
                  className="w-1/3 rounded-lg bg-surface-900 border border-slate-800 text-xs px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
                <input
                  type={variable.isSecret ? 'password' : 'text'}
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => updateVariable(idx, 'value', e.target.value)}
                  className="flex-1 rounded-lg bg-surface-900 border border-slate-800 text-xs px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
                <label className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                  <input
                    type="checkbox"
                    checked={variable.isSecret}
                    onChange={(e) => updateVariable(idx, 'isSecret', e.target.checked)}
                    className="rounded bg-surface-900 border-slate-800 text-teal-500"
                  />
                  <span>Secret</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeVariable(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saveMutation.isPending}>
              {editingEnv ? 'Save Changes' : 'Create Environment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmModal
        isOpen={!!deletingEnv}
        onClose={() => setDeletingEnv(null)}
        onConfirm={() => deleteMutation.mutate(deletingEnv._id)}
        title={`Delete Environment "${deletingEnv?.name}"`}
        description="Are you sure you want to delete this environment? Any active execution target will default to another environment."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
