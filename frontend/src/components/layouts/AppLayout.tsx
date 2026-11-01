import * as React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Sparkles,
  LayoutDashboard,
  FolderKanban,
  Bot,
  Database,
  Cpu,
  LogOut,
  Building2,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, activeTenant, availableTenants, setActiveTenant, clearAuth } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuth();
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        {/* Left Logo & Tenant Switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">AI WORK OS</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Active Tenant Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-xs text-slate-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium max-w-[140px] truncate">{activeTenant?.name || 'Select Organization'}</span>
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                {activeTenant?.role || 'MEMBER'}
              </Badge>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400">
                  Organizations ({availableTenants.length})
                </div>
                {availableTenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTenant(t);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      t.id === activeTenant?.id
                        ? 'bg-blue-600/20 text-blue-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <Badge variant="outline" className="text-[10px] scale-90">
                      {t.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            PostgreSQL 16 + Redis 7 Connected
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-white">{user?.fullName}</div>
              <div className="text-[11px] text-slate-400">{user?.email}</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white p-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex">
        {/* Left Workspace Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950/40 p-4 hidden md:flex flex-col justify-between">
          <nav className="space-y-1">
            <a
              href="#dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-500/20"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard & Metrics
            </a>
            <a
              href="#projects"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
            >
              <FolderKanban className="w-4 h-4" /> Projects & Tasks
              <Badge variant="outline" className="ml-auto text-[10px]">
                Phase 2
              </Badge>
            </a>
            <a
              href="#agents"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
            >
              <Bot className="w-4 h-4" /> AI Agents
              <Badge variant="outline" className="ml-auto text-[10px]">
                Phase 4
              </Badge>
            </a>
            <a
              href="#kb"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
            >
              <Database className="w-4 h-4" /> Knowledge Base RAG
              <Badge variant="outline" className="ml-auto text-[10px]">
                Phase 3
              </Badge>
            </a>
            <a
              href="#automations"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
            >
              <Cpu className="w-4 h-4" /> Automations
              <Badge variant="outline" className="ml-auto text-[10px]">
                Phase 4
              </Badge>
            </a>
          </nav>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ShieldAlert className="w-4 h-4 text-blue-400" /> Multi-Tenant Active
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prisma client is automatically scoped to tenant{' '}
              <span className="font-mono text-slate-200">{activeTenant?.slug}</span>.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
