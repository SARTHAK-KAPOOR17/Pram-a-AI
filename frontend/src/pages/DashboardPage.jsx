import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  Terminal,
  Filter,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useHealth } from '../hooks/useHealth.js';

export const DashboardPage = () => {
  const { data: health, isLoading, refetch } = useHealth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specUrl, setSpecUrl] = useState('https://example.com');
  const [browserType, setBrowserType] = useState('chromium');

  // Foundation mock runs to demonstrate UI states without premature backend mock AI
  const testRuns = [
    {
      id: 'RUN-1042',
      suite: 'Auth & Onboarding Flow',
      browser: 'Chromium (Playwright)',
      status: 'passed',
      healingApplied: false,
      duration: '4.2s',
      timestamp: '2 mins ago',
    },
    {
      id: 'RUN-1041',
      suite: 'Billing & Checkout E2E',
      browser: 'Firefox (Playwright)',
      status: 'healed',
      healingApplied: true,
      duration: '7.8s',
      timestamp: '14 mins ago',
    },
    {
      id: 'RUN-1040',
      suite: 'Navigation Bar Regression',
      browser: 'WebKit (Playwright)',
      status: 'passed',
      healingApplied: false,
      duration: '2.1s',
      timestamp: '1 hour ago',
    },
    {
      id: 'RUN-1039',
      suite: 'API Telemetry Probe',
      browser: 'Headless Chromium',
      status: 'failed',
      healingApplied: false,
      duration: '1.4s',
      timestamp: '3 hours ago',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              QA Test Automation Console
            </h1>
            <Badge variant="teal">Phase 1 Foundation</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Orchestration, health telemetry, and self-healing test execution metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            Launch Test Run
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Test Cases
              </span>
              <Terminal className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono mt-2">128</p>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-400 mt-2 font-mono">
              <span>&uarr; 12 new specs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Pass Rate
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono mt-2">97.4%</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
              <span>Across 4 browsers</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Self-Healed Selectors
              </span>
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-teal-400 font-mono mt-2">14</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
              <span>Healed with confidence &ge; 0.90</span>
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
              {isLoading ? 'Checking...' : health?.success ? 'Healthy (200)' : 'Degraded'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
              <span>DB: {health?.database || 'Standby'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Runs Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Recent Test Execution Queue</CardTitle>
            <CardDescription>
              Playwright browser runs with verification status and self-healing telemetry.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Filter: All Runs</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-950/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Test Suite</th>
                  <th className="py-3 px-4">Execution Target</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Self-Healing</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {testRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {run.id}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-300 font-medium">
                      {run.suite}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {run.browser}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {run.duration}
                    </td>
                    <td className="py-3.5 px-4">
                      {run.status === 'passed' && (
                        <Badge variant="success" dot>Passed</Badge>
                      )}
                      {run.status === 'healed' && (
                        <Badge variant="teal" dot>Self-Healed</Badge>
                      )}
                      {run.status === 'failed' && (
                        <Badge variant="error" dot>Failed</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {run.healingApplied ? (
                        <span className="inline-flex items-center gap-1 text-teal-400 text-[11px]">
                          <Sparkles className="w-3 h-3" /> Auto-Healed (0.94)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-sans">
                      {run.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Launch Test Run */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Execute Automated Test Run"
        description="Launch an isolated Playwright browser session against your target web application."
      >
        <div className="space-y-4">
          <Input
            label="Target Application URL"
            value={specUrl}
            onChange={(e) => setSpecUrl(e.target.value)}
            placeholder="https://example.com"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Browser Target
            </label>
            <select
              value={browserType}
              onChange={(e) => setBrowserType(e.target.value)}
              className="w-full rounded-lg bg-surface-900 border border-slate-800 text-slate-100 text-sm px-3.5 py-2 focus:outline-none focus:border-teal-500"
            >
              <option value="chromium">Chromium (Google Chrome)</option>
              <option value="firefox">Firefox (Gecko)</option>
              <option value="webkit">WebKit (Apple Safari)</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-surface-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Self-Healing Enabled</span>
            </div>
            <p>
              When elements fail to match, the engine will inspect DOM delta trees and propose candidate locators.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                alert(`Test job queued for ${specUrl} on ${browserType}. Use 'npm test' in test-engine to run locally.`);
                setIsModalOpen(false);
              }}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Start Execution
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
