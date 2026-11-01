import * as React from 'react';
import {
  KanbanSquare,
  Plus,
  MoreHorizontal,
  Clock,
  MessageSquare,
  CheckCircle2,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { toast } from '../components/ui/toast';
import { INITIAL_TASKS, FixtureTask } from '../lib/fixtures';

const COLUMNS: Array<{ id: FixtureTask['status']; title: string; color: string }> = [
  { id: 'BACKLOG', title: 'Backlog', color: 'border-slate-500/40' },
  { id: 'TODO', title: 'To Do', color: 'border-blue-500/40' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-amber-500/40' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-purple-500/40' },
  { id: 'DONE', title: 'Completed', color: 'border-emerald-500/40' }
];

export function KanbanBoardPage() {
  const [tasks, setTasks] = React.useState<FixtureTask[]>(INITIAL_TASKS);
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedColumnForNewTask, setSelectedColumnForNewTask] = React.useState<FixtureTask['status']>('TODO');

  const filteredTasks = tasks.filter(
    (t) => priorityFilter === 'ALL' || t.priority === priorityFilter
  );

  const moveTask = (taskId: string, targetStatus: FixtureTask['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    toast('Task Moved', `Card moved to ${targetStatus.replace(/_/g, ' ')}.`);
  };

  const handleOpenNewTaskInCol = (colId: FixtureTask['status']) => {
    setSelectedColumnForNewTask(colId);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Kanban Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Kanban Board</h1>
            <Badge variant="cyan">{tasks.length} Total Cards</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time interactive task board. Click any card's quick-move arrow to advance workflow stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-accent/40 p-1 rounded-lg border border-border">
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  priorityFilter === p
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Columns Horizontal Scroll Area */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-xl bg-accent/20 border border-border/80 p-3 min-w-[240px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full border-2 ${col.color}`} />
                  <span className="text-xs font-semibold text-foreground">{col.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenNewTaskInCol(col.id)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent cursor-pointer"
                  title="Add task in this column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-2.5 min-h-[400px]">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-3 bg-card hover:border-primary/50 shadow-xs transition-all space-y-2.5 group cursor-default"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-primary">
                        {task.projectKey}
                      </span>
                      <Badge
                        variant={
                          task.priority === 'URGENT'
                            ? 'destructive'
                            : task.priority === 'HIGH'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[9px] px-1.5 py-0"
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-foreground leading-snug">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="truncate max-w-[70px]">{task.assignee.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" /> {task.commentsCount}
                        </span>

                        {/* Quick-move action dropdown / button */}
                        {col.id !== 'DONE' && (
                          <button
                            onClick={() => {
                              const nextMap: Record<FixtureTask['status'], FixtureTask['status']> = {
                                BACKLOG: 'TODO',
                                TODO: 'IN_PROGRESS',
                                IN_PROGRESS: 'IN_REVIEW',
                                IN_REVIEW: 'DONE',
                                DONE: 'DONE'
                              };
                              moveTask(task.id, nextMap[col.id]);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Move to next stage"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {colTasks.length === 0 && (
                  <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center text-[11px] text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={(newTask) => {
          setTasks([...tasks, { ...newTask, status: selectedColumnForNewTask }]);
        }}
      />
    </div>
  );
}
