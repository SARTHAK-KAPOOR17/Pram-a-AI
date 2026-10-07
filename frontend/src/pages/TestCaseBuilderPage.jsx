import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Save,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';
import { testCaseService } from '../services/test-case.service.js';
import { suiteService } from '../services/suite.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { RunTestModal } from '../components/runs/RunTestModal.jsx';

const DEFAULT_STEP = {
  action: 'navigate',
  value: '/',
  locator: {
    strategy: 'css',
    value: '',
    elementText: null,
    elementRole: null,
    domFingerprint: null,
  },
  assertion: {
    type: 'visible',
    locator: {
      strategy: 'css',
      value: '',
    },
    expectedValue: '',
  },
  description: '',
  showMetadata: false,
};

const KEYBOARD_KEYS = [
  'Enter',
  'Tab',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Backspace',
  'Delete',
  'Space',
];

export const TestCaseBuilderPage = () => {
  const { projectId, testId } = useParams();
  const { project } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(testId);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('draft');
  const [tagsInput, setTagsInput] = useState('');
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [steps, setSteps] = useState([
    {
      ...DEFAULT_STEP,
      order: 1,
      action: 'navigate',
      value: '/login',
    },
    {
      ...DEFAULT_STEP,
      order: 2,
      action: 'fill',
      locator: { strategy: 'css', value: '#email', elementText: 'Email' },
      value: '{{EMAIL}}',
    },
    {
      ...DEFAULT_STEP,
      order: 3,
      action: 'click',
      locator: { strategy: 'testid', value: 'submit-login-button' },
      value: null,
    },
    {
      ...DEFAULT_STEP,
      order: 4,
      action: 'assert',
      assertion: {
        type: 'visible',
        locator: { strategy: 'css', value: '#dashboard' },
        expectedValue: '',
      },
    },
  ]);
  const [error, setError] = useState(null);

  // Load project test suites
  const { data: suites = [] } = useQuery({
    queryKey: ['suites', projectId],
    queryFn: () => suiteService.getSuites(projectId),
  });

  // Load existing test case if editing
  const { data: existingTest, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['test-case', testId],
    queryFn: () => testCaseService.getTestCaseById(testId),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingTest) {
      setName(existingTest.name || '');
      setDescription(existingTest.description || '');
      setSuiteId(existingTest.suiteId?._id || existingTest.suiteId || '');
      setPriority(existingTest.priority || 'medium');
      setStatus(existingTest.status || 'draft');
      setTagsInput((existingTest.tags || []).join(', '));
      if (existingTest.steps && existingTest.steps.length > 0) {
        setSteps(
          existingTest.steps.map((s, idx) => ({
            ...DEFAULT_STEP,
            ...s,
            order: idx + 1,
            locator: { ...DEFAULT_STEP.locator, ...(s.locator || {}) },
            assertion: {
              ...DEFAULT_STEP.assertion,
              ...(s.assertion || {}),
              locator: {
                ...DEFAULT_STEP.assertion.locator,
                ...(s.assertion?.locator || {}),
              },
            },
            showMetadata: false,
          }))
        );
      }
    }
  }, [existingTest]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (isEditing) {
        return testCaseService.updateTestCase(testId, payload);
      }
      return testCaseService.createTestCase(projectId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      navigate(`/projects/${projectId}/tests`);
    },
    onError: (err) => {
      setError(err.message || 'Failed to save test case');
    },
  });

  // Step Operations
  const addStep = () => {
    setSteps([
      ...steps,
      {
        ...DEFAULT_STEP,
        order: steps.length + 1,
        action: 'click',
        locator: { strategy: 'css', value: '' },
      },
    ]);
  };

  const removeStep = (index) => {
    if (steps.length <= 1) {
      alert('A test case must contain at least one step');
      return;
    }
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updated);
  };

  const duplicateStep = (index) => {
    const toDuplicate = steps[index];
    const newStep = {
      ...JSON.parse(JSON.stringify(toDuplicate)),
      order: index + 2,
    };
    const updated = [...steps];
    updated.splice(index + 1, 0, newStep);
    setSteps(updated.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const moveStep = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSteps(updated.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const updateStepField = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    if (field === 'action' && value === 'press' && !updated[index].value) {
      updated[index].value = 'Enter';
    }
    setSteps(updated);
  };

  const updateStepLocator = (index, field, value) => {
    const updated = [...steps];
    updated[index].locator = {
      ...(updated[index].locator || {}),
      [field]: value,
    };
    setSteps(updated);
  };

  const updateStepAssertion = (index, field, value) => {
    const updated = [...steps];
    updated[index].assertion = {
      ...(updated[index].assertion || {}),
      [field]: value,
    };
    setSteps(updated);
  };

  const updateAssertionLocator = (index, field, value) => {
    const updated = [...steps];
    const currentAssertion = updated[index].assertion || {};
    const currentLocator = currentAssertion.locator || { strategy: 'css', value: '' };
    updated[index].assertion = {
      ...currentAssertion,
      locator: {
        ...currentLocator,
        [field]: value,
      },
    };
    setSteps(updated);
  };

  const toggleStepMetadata = (index) => {
    const updated = [...steps];
    updated[index].showMetadata = !updated[index].showMetadata;
    setSteps(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Test case name is required');
      return;
    }

    if (steps.length === 0) {
      setError('At least one test step is required');
      return;
    }

    // Validate and sanitize steps
    const cleanSteps = steps.map((s, idx) => {
      const stepObj = {
        order: idx + 1,
        action: s.action,
        description: s.description || null,
        value: s.value ? s.value.trim() : null,
        locator: null,
        assertion: null,
      };

      // Actions requiring locators
      if (
        ['click', 'fill', 'select', 'check', 'uncheck', 'hover', 'press'].includes(
          s.action
        )
      ) {
        stepObj.locator = {
          strategy: s.locator?.strategy || 'css',
          value: s.locator?.value?.trim() || '',
          domFingerprint: s.locator?.domFingerprint || null,
          elementText: s.locator?.elementText || null,
          elementRole: s.locator?.elementRole || null,
          elementAttributes: s.locator?.elementAttributes || null,
        };
      }

      // Assert actions
      if (s.action === 'assert') {
        const assertionType = s.assertion?.type || 'visible';
        stepObj.assertion = {
          type: assertionType,
          expectedValue: s.assertion?.expectedValue || null,
          locator: null,
        };

        if (
          ['visible', 'hidden', 'text_contains', 'text_equals', 'enabled', 'disabled'].includes(
            assertionType
          )
        ) {
          stepObj.assertion.locator = {
            strategy: s.assertion?.locator?.strategy || 'css',
            value: s.assertion?.locator?.value?.trim() || '',
          };
        }
      }

      return stepObj;
    });

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    saveMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      suiteId: suiteId || null,
      priority,
      status,
      tags,
      steps: cleanSteps,
    });
  };

  if (isEditing && isLoadingExisting) {
    return <LoadingState message="Loading test case details..." fullPage />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Link
            to={`/projects/${projectId}/tests`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-mono transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Test Cases</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            {isEditing ? 'Edit Test Case' : 'Visual Test Builder'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author sequential browser test actions, selector strategies, and self-healing telemetry hooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}/tests`}>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
          {isEditing && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsRunModalOpen(true)}
              leftIcon={<Play className="w-3.5 h-3.5 text-teal-400" />}
            >
              Run Test
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {isEditing ? 'Update Test' : 'Save Test'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <p>{error}</p>
        </div>
      )}

      {/* Test Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Test Case Metadata</CardTitle>
          <CardDescription>
            Core parameters, associated suite, and execution priority.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Test Case Name"
              placeholder="e.g. Verify checkout completion with coupon code"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Test Suite
              </label>
              <select
                value={suiteId}
                onChange={(e) => setSuiteId(e.target.value)}
                className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 text-sm px-3.5 py-2 focus:outline-none focus:border-teal-500 font-sans"
              >
                <option value="">(Unassigned / Standalone)</option>
                {suites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 text-sm px-3.5 py-2 focus:outline-none focus:border-teal-500 font-sans"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 text-sm px-3.5 py-2 focus:outline-none focus:border-teal-500 font-sans"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="flaky">Flaky</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>

            <Input
              label="Tags (Comma separated)"
              placeholder="smoke, checkout, e2e"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm px-3.5 py-2 transition-colors focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none font-sans"
              placeholder="Explain the functional acceptance criteria or edge cases for this test."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visual Step Builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-mono">
              Test Steps Sequence ({steps.length})
            </h2>
            <p className="text-xs text-slate-400">
              Steps will execute sequentially inside Playwright.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={addStep}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Step
          </Button>
        </div>

        {/* Step Cards List */}
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === steps.length - 1;
            const needsLocator = [
              'click',
              'fill',
              'select',
              'check',
              'uncheck',
              'hover',
              'press',
            ].includes(step.action);

            return (
              <Card
                key={idx}
                className="border-slate-800 bg-surface-900/90 shadow-sm transition-all hover:border-slate-700"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Step Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-surface-950 border border-slate-800 text-teal-400 font-mono text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-300">
                        Step #{idx + 1}
                      </span>
                    </div>

                    {/* Step Actions Toolbar */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveStep(idx, -1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveStep(idx, 1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateStep(idx)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        title="Duplicate Step"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="p-1 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 ml-1"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Action Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {/* Action Selector */}
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        ACTION
                      </label>
                      <select
                        value={step.action}
                        onChange={(e) => updateStepField(idx, 'action', e.target.value)}
                        className="w-full rounded-lg bg-surface-950 border border-slate-800 text-teal-400 text-xs px-3 py-2 font-mono font-semibold focus:outline-none focus:border-teal-500 uppercase"
                      >
                        <option value="navigate">Navigate</option>
                        <option value="click">Click</option>
                        <option value="fill">Fill</option>
                        <option value="select">Select</option>
                        <option value="check">Check</option>
                        <option value="uncheck">Uncheck</option>
                        <option value="hover">Hover</option>
                        <option value="press">Press Key</option>
                        <option value="wait">Wait</option>
                        <option value="assert">Assert</option>
                      </select>
                    </div>

                    {/* Dynamic Fields Based on Action */}
                    {step.action === 'navigate' && (
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          TARGET PATH OR URL
                        </label>
                        <input
                          type="text"
                          placeholder="/login or https://example.com"
                          value={step.value || ''}
                          onChange={(e) => updateStepField(idx, 'value', e.target.value)}
                          className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    {needsLocator && (
                      <>
                        <div>
                          <label className="block text-[11px] font-mono text-slate-400 mb-1">
                            LOCATOR STRATEGY
                          </label>
                          <select
                            value={step.locator?.strategy || 'css'}
                            onChange={(e) => updateStepLocator(idx, 'strategy', e.target.value)}
                            className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                          >
                            <option value="css">CSS Selector</option>
                            <option value="xpath">XPath</option>
                            <option value="id">ID</option>
                            <option value="text">Visible Text</option>
                            <option value="role">ARIA Role</option>
                            <option value="testid">Data Test ID</option>
                          </select>
                        </div>

                        <div className={['fill', 'press', 'select'].includes(step.action) ? 'md:col-span-1' : 'md:col-span-2'}>
                          <label className="block text-[11px] font-mono text-slate-400 mb-1">
                            LOCATOR VALUE
                          </label>
                          <input
                            type="text"
                            placeholder="#submit-button, [data-testid='...']"
                            value={step.locator?.value || ''}
                            onChange={(e) => updateStepLocator(idx, 'value', e.target.value)}
                            className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        {step.action === 'fill' && (
                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              INPUT VALUE
                            </label>
                            <input
                              type="text"
                              placeholder="Text or {{VARIABLE}}"
                              value={step.value || ''}
                              onChange={(e) => updateStepField(idx, 'value', e.target.value)}
                              className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        )}

                        {step.action === 'select' && (
                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              Option to select
                            </label>
                            <input
                              type="text"
                              placeholder="Option value or label"
                              value={step.value || ''}
                              onChange={(e) => updateStepField(idx, 'value', e.target.value)}
                              className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        )}

                        {step.action === 'press' && (
                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              Keyboard Key
                            </label>
                            <select
                              value={step.value || 'Enter'}
                              onChange={(e) => updateStepField(idx, 'value', e.target.value)}
                              className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                            >
                              {KEYBOARD_KEYS.map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                              {step.value && !KEYBOARD_KEYS.includes(step.value) && (
                                <option value={step.value}>{step.value} (Custom)</option>
                              )}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {step.action === 'wait' && (
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          WAIT MILLISECONDS (OR SELECTOR)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1500 or #modal-container"
                          value={step.value || ''}
                          onChange={(e) => updateStepField(idx, 'value', e.target.value)}
                          className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    {step.action === 'assert' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-mono text-slate-400 mb-1">
                            ASSERTION
                          </label>
                          <select
                            value={step.assertion?.type || 'visible'}
                            onChange={(e) => updateStepAssertion(idx, 'type', e.target.value)}
                            className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                          >
                            <option value="visible">Element Visible</option>
                            <option value="hidden">Element Hidden</option>
                            <option value="text_contains">Text Contains</option>
                            <option value="text_equals">Text Equals</option>
                            <option value="url_contains">URL Contains</option>
                            <option value="url_equals">URL Equals</option>
                            <option value="enabled">Element Enabled</option>
                            <option value="disabled">Element Disabled</option>
                          </select>
                        </div>

                        {/* Assertion Target Locator Strategy & Value */}
                        {['visible', 'hidden', 'text_contains', 'text_equals', 'enabled', 'disabled'].includes(
                          step.assertion?.type || 'visible'
                        ) && (
                          <>
                            <div>
                              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                                LOCATOR STRATEGY
                              </label>
                              <select
                                value={step.assertion?.locator?.strategy || 'css'}
                                onChange={(e) => updateAssertionLocator(idx, 'strategy', e.target.value)}
                                className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                              >
                                <option value="css">CSS</option>
                                <option value="xpath">XPath</option>
                                <option value="id">ID</option>
                                <option value="testid">Data Test ID</option>
                                <option value="text">Visible Text</option>
                                <option value="role">ARIA Role</option>
                              </select>
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                                LOCATOR
                              </label>
                              <input
                                type="text"
                                placeholder="#dashboard, [data-testid='...']"
                                value={step.assertion?.locator?.value || ''}
                                onChange={(e) => updateAssertionLocator(idx, 'value', e.target.value)}
                                className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </>
                        )}

                        {/* Expected Value for text or url */}
                        {['text_contains', 'text_equals', 'url_contains', 'url_equals'].includes(
                          step.assertion?.type
                        ) && (
                          <div className={['url_contains', 'url_equals'].includes(step.assertion?.type) ? 'md:col-span-2' : 'md:col-span-4'}>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              EXPECTED VALUE
                            </label>
                            <input
                              type="text"
                              placeholder="Expected string"
                              value={step.assertion?.expectedValue || ''}
                              onChange={(e) => updateStepAssertion(idx, 'expectedValue', e.target.value)}
                              className="w-full rounded-lg bg-surface-950 border border-slate-800 text-xs px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Future Self-Healing Preparation Accordion */}
                  {needsLocator && (
                    <div className="pt-2 border-t border-slate-800/40">
                      <button
                        type="button"
                        onClick={() => toggleStepMetadata(idx)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-teal-400 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-teal-400" />
                        <span>Self-Healing Preparation Metadata</span>
                        {step.showMetadata ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {step.showMetadata && (
                        <div className="mt-3 p-3.5 rounded-lg bg-surface-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 mb-1">
                              ELEMENT VISIBLE TEXT
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Sign In"
                              value={step.locator?.elementText || ''}
                              onChange={(e) => updateStepLocator(idx, 'elementText', e.target.value)}
                              className="w-full rounded bg-surface-900 border border-slate-800 px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 mb-1">
                              ARIA / ACCESSIBLE ROLE
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. button, link, textbox"
                              value={step.locator?.elementRole || ''}
                              onChange={(e) => updateStepLocator(idx, 'elementRole', e.target.value)}
                              className="w-full rounded bg-surface-900 border border-slate-800 px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 mb-1">
                              DOM FINGERPRINT HASH
                            </label>
                            <input
                              type="text"
                              placeholder="Optional DOM hash"
                              value={step.locator?.domFingerprint || ''}
                              onChange={(e) => updateStepLocator(idx, 'domFingerprint', e.target.value)}
                              className="w-full rounded bg-surface-900 border border-slate-800 px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add Step Bottom Button */}
        <div className="pt-2 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addStep}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Add Step
          </Button>

          <Button
            type="button"
            size="md"
            onClick={handleSubmit}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Update Test Case' : 'Save Test Case'}
          </Button>
        </div>
      </div>

      {isEditing && (
        <RunTestModal
          isOpen={isRunModalOpen}
          onClose={() => setIsRunModalOpen(false)}
          testCase={existingTest || { _id: testId, name, steps }}
          projectId={projectId}
        />
      )}
    </div>
  );
};
