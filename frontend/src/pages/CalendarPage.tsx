import * as React from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { apiClient } from '../lib/apiClient';
import { TaskItem, TaskPriority } from '../types/task.types';

export function CalendarPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Current viewed month and year
  const [currentDate, setCurrentDate] = React.useState(new Date(2026, 10, 1)); // November 2026

  // Selected date for new task modal
  const [selectedDateForModal, setSelectedDateForModal] = React.useState('2026-11-20');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  // Drawer
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Priority filter
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL');

  // Load tasks from backend API
  React.useEffect(() => {
    setLoading(true);
    apiClient
      .get('/tasks')
      .then((res) => {
        const list = res.data?.data || [];
        if (list.length > 0) {
          setTasks(list);
        } else {
          // Fallback realistic tasks with due dates in Nov 2026
          setTasks([
            {
              id: 'task-101',
              tenantId: '00000000-0000-0000-0000-000000000001',
              projectId: '00000000-0000-0000-0000-000000000002',
              project: { id: '00000000-0000-0000-0000-000000000002', name: 'Core Architecture', key: 'CORE' },
              taskNumber: 101,
              title: 'Multi-Tenant Token Refresh Rotation',
              status: 'COMPLETED',
              priority: 'URGENT',
              dueDate: '2026-11-04T00:00:00.000Z',
              orderIndex: 1000,
              assignees: [],
              labels: [],
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
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              dueDate: '2026-11-12T00:00:00.000Z',
              orderIndex: 2000,
              assignees: [],
              labels: [],
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
              status: 'IN_REVIEW',
              priority: 'HIGH',
              dueDate: '2026-11-20T00:00:00.000Z',
              orderIndex: 3000,
              assignees: [],
              labels: [],
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
              status: 'TODO',
              priority: 'MEDIUM',
              dueDate: '2026-11-25T00:00:00.000Z',
              orderIndex: 4000,
              assignees: [],
              labels: [],
              createdAt: '2026-11-01T13:00:00.000Z',
              updatedAt: '2026-11-01T13:00:00.000Z'
            }
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute month layout
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  // Prev / Next month handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 1)); // default sprint date Nov 2026
  };

  // Open day to add task
  const handleDayClick = (dayNumber: number) => {
    const formattedDay = dayNumber < 10 ? `0${dayNumber}` : `${dayNumber}`;
    const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    setSelectedDateForModal(`${year}-${formattedMonth}-${formattedDay}`);
    setIsCreateModalOpen(true);
  };

  const filteredTasks = tasks.filter((t) => {
    return priorityFilter === 'ALL' || t.priority === priorityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Task Calendar</h1>
            <Badge variant="cyan">{monthName}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Visual deadline scheduler. Click any day to create a task scheduled for that date, or click a task chip to inspect details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1 bg-accent/40 p-1 rounded-xl border border-border">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 px-2.5 text-xs font-semibold">
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Add Task Button */}
          <Button
            onClick={() => {
              setSelectedDateForModal('2026-11-20');
              setIsCreateModalOpen(true);
            }}
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {/* Priority Filter Strip */}
      <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border text-xs">
        <span className="text-muted-foreground font-medium text-[11px]">
          Filter calendar tasks by priority:
        </span>
        <div className="flex items-center gap-1 bg-accent/20 p-0.5 rounded-lg border border-border">
          {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
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

      {/* Calendar Month Grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
          {/* Empty offset cells before 1st of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`offset-${i}`} className="min-h-[110px] bg-accent/5 p-2" />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
            const dayNum = i + 1;
            const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
            const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
            const cellDateStr = `${year}-${formattedMonth}-${formattedDay}`;

            // Find tasks due on this date
            const dayTasks = filteredTasks.filter((t) => {
              if (!t.dueDate) return false;
              return t.dueDate.startsWith(cellDateStr);
            });

            const isToday = dayNum === 2 && month === 10; // nov 2

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[110px] p-2 hover:bg-accent/20 transition-colors cursor-pointer flex flex-col group ${
                  isToday ? 'bg-primary/5' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground group-hover:text-primary transition-colors'
                    }`}
                  >
                    {dayNum}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    + add
                  </span>
                </div>

                {/* Day Tasks List */}
                <div className="space-y-1 mt-1 flex-1">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskId(t.id);
                        setIsDrawerOpen(true);
                      }}
                      className={`text-[10px] p-1 rounded font-medium truncate border transition-all hover:scale-[1.02] ${
                        t.priority === 'URGENT'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                          : t.priority === 'MEDIUM'
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-500'
                          : 'bg-muted/80 border-border text-foreground'
                      }`}
                      title={`${t.project?.key ? `${t.project.key}-${t.taskNumber}: ` : ''}${t.title}`}
                    >
                      {t.project?.key ? `${t.project.key}-${t.taskNumber} ` : ''}
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDueDate={selectedDateForModal}
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
