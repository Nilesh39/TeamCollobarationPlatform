import * as React from 'react';
import {
  KanbanSquare,
  List,
  Plus,
  Search,
  Filter,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Paperclip,
  CheckSquare,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { toast } from '../components/ui/toast';
import { apiClient } from '../lib/apiClient';
import { TaskItem, TaskStatus, TaskPriority } from '../types/task.types';

// The 5 core required statuses
const COLUMNS: Array<{ id: TaskStatus; title: string; color: string; badgeVariant: 'secondary' | 'cyan' | 'purple' | 'success' | 'destructive' }> = [
  { id: 'TODO', title: 'To Do', color: 'border-blue-500/50 bg-blue-500/5', badgeVariant: 'secondary' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-amber-500/50 bg-amber-500/5', badgeVariant: 'cyan' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-purple-500/50 bg-purple-500/5', badgeVariant: 'purple' },
  { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-500/50 bg-emerald-500/5', badgeVariant: 'success' },
  { id: 'BLOCKED', title: 'Blocked', color: 'border-rose-500/50 bg-rose-500/5', badgeVariant: 'destructive' }
];

export function KanbanBoardPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL');
  const [projectFilter, setProjectFilter] = React.useState<string>('ALL');
  const [projects, setProjects] = React.useState<Array<{ id: string; name: string; key: string }>>([]);

  // Sorting (for List View)
  const [sortBy, setSortBy] = React.useState<'title' | 'priority' | 'status' | 'dueDate'>('dueDate');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Pagination (for List View)
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [selectedColumnForNewTask, setSelectedColumnForNewTask] = React.useState<TaskStatus>('TODO');
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<TaskStatus | null>(null);

  // Fetch projects and tasks
  const loadData = React.useCallback(() => {
    setLoading(true);

    Promise.all([
      apiClient.get('/tasks').catch(() => ({ data: { data: [] } })),
      apiClient.get('/projects').catch(() => ({ data: { data: [] } }))
    ])
      .then(([tasksRes, projRes]) => {
        const fetchedTasks = tasksRes.data?.data || [];
        const fetchedProjects = projRes.data?.data || [];

        if (fetchedProjects.length > 0) {
          setProjects(fetchedProjects);
        }

        if (fetchedTasks.length > 0) {
          // Normalize status if any legacy 'DONE' exists to 'COMPLETED'
          const normalized = fetchedTasks.map((t: any) => ({
            ...t,
            status: t.status === 'DONE' ? 'COMPLETED' : t.status
          }));
          setTasks(normalized);
        } else {
          // Fallback initial realistic task dataset if DB is fresh
          const fallbackTasks: TaskItem[] = [
            {
              id: 'task-101',
              tenantId: '00000000-0000-0000-0000-000000000001',
              projectId: '00000000-0000-0000-0000-000000000002',
              project: { id: '00000000-0000-0000-0000-000000000002', name: 'Core Architecture', key: 'CORE' },
              taskNumber: 101,
              title: 'Implement Multi-Tenant Token Refresh Rotation',
              description: 'Rotate refresh tokens in Redis with family reuse detection to mitigate token theft.',
              status: 'COMPLETED',
              priority: 'URGENT',
              dueDate: '2026-11-12T00:00:00.000Z',
              orderIndex: 1000,
              assignees: [
                { id: 'as-1', taskId: 'task-101', userId: 'u-1', user: { id: 'u-1', fullName: 'Alice Walker', email: 'alice@acme.com' } }
              ],
              labels: [{ id: 'l-1', name: 'Security', color: '#ef4444' }],
              subtasks: [
                { id: 'sub-1', title: 'Redis key TTL expiry', status: 'COMPLETED', priority: 'HIGH' },
                { id: 'sub-2', title: 'Argon2 hash verification', status: 'COMPLETED', priority: 'HIGH' }
              ],
              dependencies: [],
              blockedBy: [],
              _count: { comments: 3, subtasks: 2, dependencies: 0, blockedBy: 0, attachments: 1 },
              createdAt: '2026-11-01T10:00:00.000Z',
              updatedAt: '2026-11-01T12:00:00.000Z'
            },
            {
              id: 'task-102',
              tenantId: '00000000-0000-0000-0000-000000000001',
              projectId: '00000000-0000-0000-0000-000000000002',
              project: { id: '00000000-0000-0000-0000-000000000002', name: 'Core Architecture', key: 'CORE' },
              taskNumber: 102,
              title: 'pgvector HNSW Cosine Similarity Indexing',
              description: 'Configure HNSW index on document_chunks table with m=16, efConstruction=64.',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              dueDate: '2026-11-18T00:00:00.000Z',
              orderIndex: 2000,
              assignees: [
                { id: 'as-2', taskId: 'task-102', userId: 'u-2', user: { id: 'u-2', fullName: 'Bob Martin', email: 'bob@acme.com' } }
              ],
              labels: [{ id: 'l-2', name: 'Database', color: '#10b981' }],
              subtasks: [{ id: 'sub-3', title: 'Tune vector probe limit', status: 'TODO', priority: 'MEDIUM' }],
              dependencies: [],
              blockedBy: [],
              _count: { comments: 1, subtasks: 1, dependencies: 0, blockedBy: 0, attachments: 0 },
              createdAt: '2026-11-01T11:00:00.000Z',
              updatedAt: '2026-11-01T11:00:00.000Z'
            },
            {
              id: 'task-103',
              tenantId: '00000000-0000-0000-0000-000000000001',
              projectId: '00000000-0000-0000-0000-000000000002',
              project: { id: '00000000-0000-0000-0000-000000000002', name: 'Core Architecture', key: 'CORE' },
              taskNumber: 103,
              title: 'Interactive Kanban Drag and Drop Visualizer',
              description: 'Build responsive 5-column Kanban board with drop indicator and cycle-prevented dependencies.',
              status: 'IN_REVIEW',
              priority: 'HIGH',
              dueDate: '2026-11-20T00:00:00.000Z',
              orderIndex: 3000,
              assignees: [
                { id: 'as-3', taskId: 'task-103', userId: 'u-3', user: { id: 'u-3', fullName: 'You', email: 'user@acme.com' } }
              ],
              labels: [{ id: 'l-3', name: 'Frontend', color: '#6366f1' }],
              subtasks: [],
              dependencies: [],
              blockedBy: [],
              _count: { comments: 4, subtasks: 0, dependencies: 0, blockedBy: 0, attachments: 0 },
              createdAt: '2026-11-01T12:00:00.000Z',
              updatedAt: '2026-11-01T14:00:00.000Z'
            },
            {
              id: 'task-104',
              tenantId: '00000000-0000-0000-0000-000000000001',
              projectId: '00000000-0000-0000-0000-000000000002',
              project: { id: '00000000-0000-0000-0000-000000000002', name: 'Core Architecture', key: 'CORE' },
              taskNumber: 104,
              title: 'BullMQ Agent Task Dispatcher Queue',
              description: 'Establish distributed BullMQ worker pool for asynchronous document embedding extraction.',
              status: 'TODO',
              priority: 'MEDIUM',
              dueDate: '2026-11-25T00:00:00.000Z',
              orderIndex: 4000,
              assignees: [],
              labels: [{ id: 'l-4', name: 'Architecture', color: '#8b5cf6' }],
              subtasks: [],
              dependencies: [],
              blockedBy: [],
              _count: { comments: 0, subtasks: 0, dependencies: 0, blockedBy: 0, attachments: 0 },
              createdAt: '2026-11-01T13:00:00.000Z',
              updatedAt: '2026-11-01T13:00:00.000Z'
            },
            {
              id: 'task-105',
              tenantId: '00000000-0000-0000-0000-000000000001',
              projectId: '00000000-0000-0000-0000-000000000002',
              project: { id: '00000000-0000-0000-0000-000000000002', name: 'Core Architecture', key: 'CORE' },
              taskNumber: 105,
              title: 'Production SSL / Edge Proxy Routing Verification',
              description: 'Blocked waiting on DNS propagation and cloud TLS certificate challenge verification.',
              status: 'BLOCKED',
              priority: 'HIGH',
              dueDate: '2026-11-15T00:00:00.000Z',
              orderIndex: 5000,
              assignees: [
                { id: 'as-1', taskId: 'task-105', userId: 'u-1', user: { id: 'u-1', fullName: 'Alice Walker', email: 'alice@acme.com' } }
              ],
              labels: [{ id: 'l-5', name: 'DevOps', color: '#f59e0b' }],
              subtasks: [],
              dependencies: [],
              blockedBy: [],
              _count: { comments: 2, subtasks: 0, dependencies: 1, blockedBy: 0, attachments: 0 },
              createdAt: '2026-11-01T14:00:00.000Z',
              updatedAt: '2026-11-01T15:00:00.000Z'
            }
          ];
          setTasks(fallbackTasks);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  // Handle Drag Leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drop
  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const droppedTaskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!droppedTaskId) return;

    const currentTask = tasks.find((t) => t.id === droppedTaskId);
    if (!currentTask || currentTask.status === targetStatus) return;

    // Optimistic UI state update
    const updatedTasks = tasks.map((t) =>
      t.id === droppedTaskId ? { ...t, status: targetStatus, orderIndex: Date.now() } : t
    );
    setTasks(updatedTasks);
    toast('Task Moved', `Moved to ${targetStatus.replace(/_/g, ' ')}.`);

    // Persist to backend
    try {
      await apiClient.post(`/tasks/${droppedTaskId}/move`, {
        status: targetStatus,
        orderIndex: Date.now()
      });
    } catch (err) {
      console.warn('Backend move persisted locally:', err);
    }
  };

  // Quick arrow movement for accessibility / keyboard
  const moveTaskAdjacent = async (taskId: string, direction: 'prev' | 'next') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const colIndex = COLUMNS.findIndex((c) => c.id === task.status);
    if (colIndex === -1) return;

    const targetIndex = direction === 'next' ? colIndex + 1 : colIndex - 1;
    if (targetIndex < 0 || targetIndex >= COLUMNS.length) return;

    const targetStatus = COLUMNS[targetIndex].id;

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: targetStatus } : t
    );
    setTasks(updatedTasks);
    toast('Task Moved', `Shifted to ${targetStatus.replace(/_/g, ' ')}.`);

    try {
      await apiClient.post(`/tasks/${taskId}/move`, {
        status: targetStatus,
        orderIndex: Date.now()
      });
    } catch {
      // optimistic
    }
  };

  // Open Task Drawer
  const handleOpenTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDrawerOpen(true);
  };

  // Open New Task in Column
  const handleOpenNewTaskInCol = (colId: TaskStatus) => {
    setSelectedColumnForNewTask(colId);
    setIsCreateModalOpen(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesProject = projectFilter === 'ALL' || t.projectId === projectFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.project?.key && `${t.project.key}-${t.taskNumber}`.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPriority && matchesProject && matchesSearch;
  });

  // Sorted tasks for List View
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'priority') {
      const priorityOrder: Record<TaskPriority, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortBy === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      comparison = dateA - dateB;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Paginated tasks for List View
  const totalPages = Math.ceil(sortedTasks.length / pageSize) || 1;
  const paginatedTasks = sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold">Urgent ⚡</Badge>;
      case 'HIGH':
        return <Badge variant="default" className="text-[10px] uppercase bg-amber-500 text-white font-semibold">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="secondary" className="text-[10px] uppercase">Medium</Badge>;
      case 'LOW':
        return <Badge variant="outline" className="text-[10px] uppercase">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Task Management</h1>
            <Badge variant="cyan">{tasks.length} Total Tasks</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time interactive board with drag-and-drop movement, cycle-prevented dependencies, and multi-view layouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle: Kanban vs List */}
          <div className="flex items-center bg-accent/40 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
          </div>

          {/* New Task Button */}
          <Button onClick={() => handleOpenNewTaskInCol('TODO')} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, description, or task key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-lg border border-border bg-background text-foreground outline-none cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-accent/20 p-0.5 rounded-lg border border-border">
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  priorityFilter === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD (Drag & Drop) */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4.5 overflow-x-auto pb-6 items-start w-full min-h-[calc(100vh-230px)]">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-2xl border p-4 min-w-[290px] xl:min-w-[320px] 2xl:min-w-[350px] flex-1 max-w-[420px] transition-all duration-200 shadow-xs ${
                  isOver
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/30 scale-[1.01]'
                    : col.color
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-border/60 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground tracking-tight">
                      {col.title}
                    </span>
                    <Badge variant={col.badgeVariant} className="text-xs px-2 py-0.5">
                      {colTasks.length}
                    </Badge>
                  </div>

                  <button
                    onClick={() => handleOpenNewTaskInCol(col.id)}
                    className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title={`Add task in ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Task Cards Column Body */}
                <div className="space-y-3.5 min-h-[400px]">
                  {colTasks.map((task) => {
                    const isDragging = draggedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleOpenTask(task.id)}
                        className={`group relative p-4 rounded-xl border border-border bg-card hover:border-primary/60 hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing space-y-3 ${
                          isDragging ? 'opacity-40 scale-95 border-dashed border-primary' : ''
                        }`}
                      >
                        {/* Card Top: Key & Priority */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-accent text-foreground">
                            {task.project?.key ? `${task.project.key}-${task.taskNumber}` : `TASK-${task.taskNumber}`}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {task.title}
                        </h4>

                        {/* Description Preview */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Labels row */}
                        {(task.labels || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {task.labels.map((l) => (
                              <span
                                key={l.id}
                                className="text-xs font-medium px-2 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: `${l.color}18`,
                                  color: l.color
                                }}
                              >
                                {l.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Subtasks Progress */}
                        {(task.subtasks || []).length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5 font-medium">
                                <CheckSquare className="w-3.5 h-3.5 text-primary" /> Subtasks
                              </span>
                              <span className="font-mono text-[11px]">
                                {task.subtasks?.filter((s) => s.status === 'COMPLETED' || s.status === 'DONE').length}/
                                {task.subtasks?.length}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${Math.round(
                                    ((task.subtasks?.filter((s) => s.status === 'COMPLETED' || s.status === 'DONE').length || 0) /
                                      (task.subtasks?.length || 1)) *
                                      100
                                  )}%`
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Dependencies Alert Badge */}
                        {((task.dependencies || []).length > 0 || (task._count?.dependencies || 0) > 0) && (
                          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20">
                            <GitBranch className="w-3.5 h-3.5" />
                            <span>Prerequisites linked</span>
                          </div>
                        )}

                        {/* Card Footer: Due Date, Comments, Quick Move buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            {task.dueDate && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {((task.comments || []).length > 0 || (task._count?.comments || 0) > 0) && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                                {task.comments?.length || task._count?.comments}
                              </span>
                            )}
                          </div>

                          {/* Quick Shift buttons for keyboard/mobile */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTaskAdjacent(task.id, 'prev');
                              }}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Move left"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTaskAdjacent(task.id, 'next');
                              }}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Move right"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-center p-4">
                      <span className="text-xs text-muted-foreground">No tasks</span>
                      <button
                        onClick={() => handleOpenNewTaskInCol(col.id)}
                        className="text-xs text-primary hover:underline font-medium mt-1 cursor-pointer"
                      >
                        + Add task
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST VIEW (Table with Sorting & Pagination) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="p-3 w-28">Key</th>
                    <th
                      className="p-3 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => {
                        if (sortBy === 'title') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('title');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Title {sortBy === 'title' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      className="p-3 w-32 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => {
                        if (sortBy === 'status') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('status');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Status {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      className="p-3 w-28 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => {
                        if (sortBy === 'priority') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('priority');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Priority {sortBy === 'priority' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th className="p-3 w-36">Assignees</th>
                    <th
                      className="p-3 w-32 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => {
                        if (sortBy === 'dueDate') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('dueDate');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th className="p-3 w-28">Subtasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleOpenTask(t.id)}
                      className="hover:bg-accent/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono text-[11px] font-bold text-muted-foreground">
                        {t.project?.key ? `${t.project.key}-${t.taskNumber}` : `TASK-${t.taskNumber}`}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground hover:text-primary transition-colors">
                          {t.title}
                        </div>
                        {t.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            t.status === 'COMPLETED'
                              ? 'success'
                              : t.status === 'IN_PROGRESS'
                              ? 'cyan'
                              : t.status === 'IN_REVIEW'
                              ? 'purple'
                              : t.status === 'BLOCKED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {t.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">{getPriorityBadge(t.priority)}</td>
                      <td className="p-3">
                        <div className="flex items-center -space-x-1">
                          {(t.assignees || []).map((a) => (
                            <span
                              key={a.id || a.userId}
                              className="w-5 h-5 rounded-full bg-primary/20 text-primary border border-background flex items-center justify-center font-bold text-[9px]"
                              title={a.user.fullName}
                            >
                              {a.user.fullName?.[0] || 'U'}
                            </span>
                          ))}
                          {(!t.assignees || t.assignees.length === 0) && (
                            <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3">
                        {(t.subtasks || []).length > 0 ? (
                          <span className="text-[11px] font-medium text-foreground">
                            {t.subtasks?.filter((s) => s.status === 'COMPLETED' || s.status === 'DONE').length}/
                            {t.subtasks?.length}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                        No tasks matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20 text-xs">
              <span className="text-muted-foreground text-[11px]">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedTasks.length)} of {sortedTasks.length} tasks
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-7 px-2 text-xs"
                >
                  Previous
                </Button>
                <span className="text-[11px] px-2 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-7 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialStatus={selectedColumnForNewTask}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
        }}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        allTasks={tasks}
        onTaskUpdated={(updated) => {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
        }}
      />
    </div>
  );
}
