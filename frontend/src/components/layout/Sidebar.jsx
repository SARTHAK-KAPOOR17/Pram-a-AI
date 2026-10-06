import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlaySquare,
  FileCheck2,
  Sparkles,
  Layers,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Test Runs', path: '#test-runs', icon: PlaySquare, badge: 'Phase 2' },
  { name: 'Test Suites', path: '#suites', icon: Layers, badge: 'Phase 2' },
  { name: 'Self-Healing', path: '#healing', icon: Sparkles, badge: 'Phase 4' },
  { name: 'Verification Specs', path: '#specs', icon: FileCheck2 },
  { name: 'Settings', path: '#settings', icon: Settings },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-surface-950 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Platform Workspaces
          </p>
          <div className="px-3 py-2 rounded-lg bg-surface-900 border border-slate-800 text-xs flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-200">Default Workspace</p>
              <p className="text-[10px] text-slate-500 font-mono">pramana-core-staging</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-teal-400" />
          </div>
        </div>

        <nav className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExternalOrAnchor = item.path.startsWith('#');
            return isExternalOrAnchor ? (
              <a
                key={item.name}
                href={item.path}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-900 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                    {item.badge}
                  </span>
                )}
              </a>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
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
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/60">
        <div className="p-3 rounded-lg bg-surface-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
            <span>Phase 1 Environment</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            API foundation active with Playwright runner ready.
          </p>
        </div>
      </div>
    </aside>
  );
};
