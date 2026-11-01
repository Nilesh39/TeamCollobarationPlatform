import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  Bot,
  FileText,
  Users,
  CalendarDays,
  Settings,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { toast } from '../ui/toast';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTask: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenNewTask }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const commands = [
    { name: 'Dashboard & Metrics', path: '/app', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Workspace Management', path: '/app/workspace', icon: FolderKanban, category: 'Navigation' },
    { name: 'Projects Overview', path: '/app/projects', icon: FolderKanban, category: 'Navigation' },
    { name: 'Kanban Board', path: '/app/kanban', icon: KanbanSquare, category: 'Navigation' },
    { name: 'AI Assistant', path: '/app/ai-assistant', icon: Bot, category: 'Navigation' },
    { name: 'Documents RAG', path: '/app/documents', icon: FileText, category: 'Navigation' },
    { name: 'Calendar Schedule', path: '/app/calendar', icon: CalendarDays, category: 'Navigation' },
    { name: 'Team Members Directory', path: '/app/team', icon: Users, category: 'Navigation' },
    { name: 'Settings & Security', path: '/app/settings', icon: Settings, category: 'Navigation' }
  ];

  const filteredCommands = query
    ? commands.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="relative w-full max-w-xl rounded-xl border border-border bg-card p-3 shadow-2xl z-10 overflow-hidden"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-3 py-2 border-b border-border/80">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search workspace..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
                autoFocus
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                ESC
              </span>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-2 border-b border-border/60 flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenNewTask();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Quick Create Task
              </button>
              <button
                onClick={() => {
                  navigate('/app/ai-assistant');
                  onClose();
                  toast('AI Sentinel Ready', 'Prompt sent to autonomous agent.');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask AI Agent
              </button>
            </div>

            {/* Filtered Results */}
            <div className="max-h-80 overflow-y-auto p-1 space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Jump to
              </div>
              {filteredCommands.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No matching workspace commands found.
                </div>
              ) : (
                filteredCommands.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>{item.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
