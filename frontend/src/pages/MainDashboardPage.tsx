import * as React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Sparkles,
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  Bot,
  Layers,
  ArrowRight,
  Plus,
  Play,
  FileText,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { InteractiveLineChart, InteractiveBarChart } from '../components/ui/charts';
import { useAuthStore } from '../app/store/useAuthStore';
import { INITIAL_PROJECTS, INITIAL_TASKS } from '../lib/fixtures';
import { toast } from '../components/ui/toast';

export function MainDashboardPage() {
  const { onOpenNewTask } = useOutletContext<{ onOpenNewTask: () => void }>() || { onOpenNewTask: () => {} };
  const { user, activeTenant } = useAuthStore();
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);

  const velocityData = [
    { label: 'Oct 18', value: 12 },
    { label: 'Oct 20', value: 18 },
    { label: 'Oct 22', value: 15 },
    { label: 'Oct 24', value: 24 },
    { label: 'Oct 26', value: 22 },
    { label: 'Oct 28', value: 31 },
    { label: 'Oct 30', value: 28 },
    { label: 'Nov 01', value: 36 }
  ];

  const agentActivityData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 68 },
    { label: 'Wed', value: 52 },
    { label: 'Thu', value: 89 },
    { label: 'Fri', value: 95 },
    { label: 'Sat', value: 30 },
    { label: 'Sun', value: 42 }
  ];

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'DONE' ? 'TODO' : 'DONE';
          toast(
            nextStatus === 'DONE' ? 'Task Completed' : 'Task Reopened',
            `"${t.title}" moved to ${nextStatus}.`
          );
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Workspace Overview
            </h1>
            <Badge variant="purple" className="text-[10px]">
              {activeTenant?.name || 'Acme Corp'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-foreground">{user?.fullName || 'Alice Walker'}</span>. All multi-tenant services and AI reasoning loops are operational.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/app/ai-assistant">
            <Button variant="subtle" size="sm" className="text-xs">
              <Bot className="w-3.5 h-3.5 mr-1.5" /> Prompt AI Agent
            </Button>
          </Link>
          <Button onClick={onOpenNewTask} size="sm" className="text-xs shadow-sm">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Task
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Projects</span>
              <FolderKanban className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">4 Projects</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> 78% on-schedule completion
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sprint Velocity</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">36 Story Pts</div>
            <p className="text-xs text-muted-foreground mt-1">+24% velocity vs previous sprint</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Agent Actions</span>
              <Bot className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">421 Invocations</div>
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Gemini 1.5 Pro reasoning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Knowledge Chunks</span>
              <Layers className="w-4 h-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">330 Chunks</div>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">pgvector HNSW Cosine Index</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sprint Velocity Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Sprint Velocity & Throughput</CardTitle>
              <CardDescription className="text-xs">Interactive daily story points delivered by team and agents</CardDescription>
            </div>
            <Badge variant="success">+18% Output</Badge>
          </CardHeader>
          <CardContent>
            <InteractiveLineChart data={velocityData} height={190} />
          </CardContent>
        </Card>

        {/* Right Col: AI Agent Activity Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Agent Invocations / Day</CardTitle>
            <CardDescription className="text-xs">Autonomous tool execution volume</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveBarChart data={agentActivityData} height={190} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Priority Sprint Tasks & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Sprint Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Sprint Priority Tasks</CardTitle>
              <CardDescription className="text-xs">Click checkbox to complete or reopen task</CardDescription>
            </div>
            <Link to="/app/kanban" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              Kanban Board <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {tasks.slice(0, 5).map((task) => {
              const isDone = task.status === 'DONE';
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-accent/20 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                        isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-primary'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className={`text-xs font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{task.projectKey}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      task.priority === 'URGENT'
                        ? 'destructive'
                        : task.priority === 'HIGH'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {task.priority}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Active Projects Tracker */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Active Project Milestones</CardTitle>
              <CardDescription className="text-xs">Delivery progress across workspace repositories</CardDescription>
            </div>
            <Link to="/app/projects" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              All Projects <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {INITIAL_PROJECTS.slice(0, 4).map((project) => (
              <div key={project.id} className="p-3 rounded-lg border border-border/80 bg-accent/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{project.key}</span>
                    <span className="text-xs font-semibold text-foreground">{project.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground">{project.progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{project.completedTasks} / {project.taskCount} tasks resolved</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {project.dueDate}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
