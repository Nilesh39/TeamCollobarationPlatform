import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  KanbanSquare,
  CalendarDays,
  Users,
  Bot,
  FileText,
  Video,
  BarChart3,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Command,
  Plus,
  Wand2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useNotificationStore } from '../../app/store/useNotificationStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenQuickTask?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'purple' | 'cyan';
}

const PRIMARY_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Workspace', href: '/app/workspace', icon: Layers },
  { name: 'Projects', href: '/app/projects', icon: FolderKanban, badge: '4' },
  { name: 'Kanban Board', href: '/app/kanban', icon: KanbanSquare },
  { name: 'Calendar', href: '/app/calendar', icon: CalendarDays },
  { name: 'Team Members', href: '/app/team', icon: Users, badge: '5' }
];

const INTELLIGENCE_NAV: NavItem[] = [
  { name: 'AI Project Planner', href: '/app/ai-planner', icon: Wand2, badge: 'Gemini', badgeVariant: 'purple' },
  { name: 'AI Assistant', href: '/app/ai-assistant', icon: Bot, badge: 'Pro', badgeVariant: 'purple' },
  { name: 'Documents RAG', href: '/app/documents', icon: FileText, badge: '768d', badgeVariant: 'cyan' },
  { name: 'Meetings & Sync', href: '/app/meetings', icon: Video, badge: 'LIVE', badgeVariant: 'success' },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 }
];

const SYSTEM_NAV: NavItem[] = [
  { name: 'Notifications', href: '/app/notifications', icon: Bell, badge: '2', badgeVariant: 'warning' },
  { name: 'Settings', href: '/app/settings', icon: Settings },
  { name: 'User Profile', href: '/app/profile', icon: User }
];

export function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenQuickTask
}: SidebarProps) {
  const location = useLocation();
  const { unreadCount } = useNotificationStore();

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-card border-r border-border/80 select-none">
      {/* Top Header Logo */}
      <div>
        <div className="h-14 px-4 flex items-center justify-between border-b border-border/60">
          <NavLink to="/app" className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                  AI WORK OS
                </span>
                <span className="text-[10px] font-mono text-primary font-semibold tracking-wider">
                  ENTERPRISE v1.0
                </span>
              </motion.div>
            )}
          </NavLink>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent items-center justify-center transition-colors"
            title={isCollapsed ? 'Expand Sidebar (Ctrl+\\)' : 'Collapse Sidebar (Ctrl+\\)'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Action Button */}
        {!isCollapsed && onOpenQuickTask && (
          <div className="p-3">
            <Button
              onClick={onOpenQuickTask}
              size="sm"
              className="w-full justify-between bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-xs shadow-md shadow-primary/20"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New Task
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">C</kbd>
            </Button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="px-2 py-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Main Workspace Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Workspace
              </div>
            )}
            {PRIMARY_NAV.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <Badge variant={item.badgeVariant || 'outline'} className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Intelligence & Automation Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Intelligence
              </div>
            )}
            {INTELLIGENCE_NAV.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <Badge variant={item.badgeVariant || 'outline'} className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* System & Account Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                System
              </div>
            )}
            {SYSTEM_NAV.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              const displayBadge =
                item.name === 'Notifications'
                  ? unreadCount > 0
                    ? String(unreadCount)
                    : undefined
                  : item.badge;
              const displayVariant =
                item.name === 'Notifications' && unreadCount > 0 ? 'destructive' : item.badgeVariant;

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!isCollapsed && displayBadge && (
                    <Badge variant={displayVariant || 'outline'} className="text-[10px] px-1.5 py-0">
                      {displayBadge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Command Hint */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 py-1.5 rounded-lg bg-accent/40">
            <span className="flex items-center gap-1.5">
              <Command className="w-3 h-3" /> Quick Search
            </span>
            <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px] font-mono">⌘K</kbd>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 68 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:block h-screen sticky top-0 z-40 shrink-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-64 h-full z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
