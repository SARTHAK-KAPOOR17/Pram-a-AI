import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  RefreshCw,
  GitBranch,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Play,
  Layers,
  Database,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useHealth } from '../hooks/useHealth.js';

export const HomePage = () => {
  const { data: health, isLoading } = useHealth();

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-800/60 bg-teal-950/40 text-teal-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>Phase 0 & 1 Architecture Live</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
          Intelligent Verification. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400">
            Self-Healing Tests.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Pramāṇa AI transforms flaky browser automation into resilient, self-healing quality assurance.
          Built on Node.js, Express, Playwright, and an extensible architecture designed for AI inference.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link to="/dashboard">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open QA Dashboard
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign In to Platform
            </Button>
          </Link>
        </div>
      </section>

      {/* Live System Health Telemetry Card */}
      <section className="max-w-4xl mx-auto">
        <Card className="border-slate-800 bg-surface-900/60 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-100 font-mono">
                  SYSTEM STATUS TELEMETRY
                </h3>
              </div>
              <Badge variant="teal" dot>
                {isLoading ? 'Polling API...' : health?.message || 'API Connected'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-surface-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">BACKEND STATUS</span>
                <span className="text-teal-400 font-semibold">
                  {health?.success ? 'ONLINE (200)' : 'STANDBY'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ENVIRONMENT</span>
                <span className="text-slate-300 font-semibold capitalize">
                  {health?.environment || 'development'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TEST RUNNER</span>
                <span className="text-teal-400 font-semibold">Playwright v1.49</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MONGODB</span>
                <span className="text-slate-300 font-semibold">
                  {health?.database || 'Standby'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Core Architectural Pillars */}
      <section id="architecture" className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Architecture & Foundation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered with strict separation of concerns, zero mock AI facades, and modular JavaScript.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-950/80 border border-teal-800/80 flex items-center justify-center text-teal-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">REST API & Auth Core</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Node.js and Express backend with centralized error handling, Zod schema validation, JWT auth foundation, and graceful database shutdown.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/80 flex items-center justify-center text-sky-400">
                <Play className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Isolated Test Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Decoupled Playwright runner with headless browser automation, smoke tests, and an asynchronous worker architecture blueprint.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">AI Reasoning Blueprint</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict data contracts for Failure Analysis, DOM diff selector generation, and confidence-gated self-healing without premature mock dependencies.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};
