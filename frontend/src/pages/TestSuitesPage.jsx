import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  FileCode2,
  Tag,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { suiteService } from '../services/suite.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { ConfirmModal } from '../components/ui/ConfirmModal.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const TestSuitesPage = () => {
  const { project } = useOutletContext();
  const projectId = project._id;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState(null);
  const [deletingSuite, setDeletingSuite] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formError, setFormError] = useState(null);

  const {
    data: suites = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['suites', projectId],
    queryFn: () => suiteService.getSuites(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingSuite) {
        return suiteService.updateSuite(editingSuite._id, data);
      }
      return suiteService.createSuite(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suites', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to save test suite');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (suiteId) => suiteService.deleteSuite(suiteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suites', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setDeletingSuite(null);
    },
    onError: (err) => {
      alert(err.message || 'Failed to delete suite');
      setDeletingSuite(null);
    },
  });

  const openCreateModal = () => {
    setEditingSuite(null);
    setName('');
    setDescription('');
    setTagsInput('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (suite) => {
    setEditingSuite(suite);
    setName(suite.name);
    setDescription(suite.description || '');
    setTagsInput((suite.tags || []).join(', '));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSuite(null);
    setFormError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Suite name is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    saveMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      tags,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Test Suites
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Group related test cases into logical execution suites (e.g. Authentication, Checkout, Billing).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Create Suite
          </Button>
        </div>
      </div>

      {isLoading && <LoadingState message="Loading test suites..." />}

      {!isLoading && suites.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No test suites created yet"
          description="Test suites organize your test cases by feature or flow. Create your first suite to begin."
          actionLabel="Create Test Suite"
          onAction={openCreateModal}
        />
      )}

      {!isLoading && suites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suites.map((suite) => (
            <Card
              key={suite._id}
              className="flex flex-col justify-between hover:border-slate-700 transition-colors group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-950 border border-slate-800 flex items-center justify-center text-sky-400 group-hover:border-sky-700/60 transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(suite)}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Edit suite"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingSuite(suite)}
                      className="p-1.5 rounded-md hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete suite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
                    {suite.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[2rem]">
                    {suite.description || 'No description provided.'}
                  </p>
                </div>

                {/* Tags */}
                {suite.tags && suite.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {suite.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-surface-950 text-[10px] font-mono text-slate-400 border border-slate-800 flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer with test count and link */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <FileCode2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{suite.testCount || 0} Test Cases</span>
                  </div>

                  <Link
                    to={`/projects/${projectId}/tests?suiteId=${suite._id}`}
                    className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>View Tests</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Suite Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSuite ? 'Edit Test Suite' : 'Create Test Suite'}
        description="Organize automated test cases under a cohesive feature category."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <p>{formError}</p>
            </div>
          )}

          <Input
            label="Suite Name"
            placeholder="e.g. Authentication & RBAC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm px-3.5 py-2 transition-colors focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
              placeholder="e.g. Sign in, sign up, password reset, and role verification flows."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Input
            label="Tags (Comma separated)"
            placeholder="smoke, auth, critical, payments"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            helperText="Tags allow filtering test runs during execution."
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saveMutation.isPending}>
              {editingSuite ? 'Save Changes' : 'Create Suite'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingSuite}
        onClose={() => setDeletingSuite(null)}
        onConfirm={() => deleteMutation.mutate(deletingSuite._id)}
        title={`Delete Test Suite "${deletingSuite?.name}"`}
        description="Are you sure you want to delete this test suite? The associated test cases will not be deleted, but will become unassigned."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
