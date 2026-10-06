import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Activity, Terminal, ExternalLink, LogIn } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth.js';
import { Badge } from '../ui/Badge.jsx';

export const Navbar = () => {
  const location = useLocation();
  const { data: healthData, isError, isLoading } = useHealth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-surface-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-teal-950/80 border border-teal-700/60 flex items-center justify-center text-teal-400 group-hover:border-teal-500 transition-colors shadow-sm shadow-teal-500/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-sm sm:text-base text-slate-100 font-mono">
                  PRAMĀṆA <span className="text-teal-400">AI</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  v0.1
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-tight font-sans">
                Intelligent Verification. Self-Healing Tests.
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                location.pathname.startsWith('/projects')
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Projects
            </Link>
            <a
              href="#architecture"
              className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              Architecture
            </a>
          </nav>
        </div>

        {/* Right Actions & Health Telemetry */}
        <div className="flex items-center gap-3">
          {/* Live System Health Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-surface-900/60 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">API:</span>
            {isLoading ? (
              <span className="text-slate-500">Checking...</span>
            ) : isError ? (
              <Badge variant="error" dot>Offline</Badge>
            ) : (
              <Badge variant="teal" dot>Live (Port 5000)</Badge>
            )}
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
};
