import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Plus,
  Calendar,
  Layers,
  Users,
  FileText,
  CheckSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs } from '../components/ui/tabs';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { toast } from '../components/ui/toast';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_DOCUMENTS } from '../lib/fixtures';

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const project = INITIAL_PROJECTS.find((p) => p.id === id) || INITIAL_PROJECTS[0];

  const [activeTab, setActiveTab] = React.useState('tasks');
  const [tasks, setTasks] = React.useState(INITIAL_TASKS.filter((t) => t.projectId === project.id || t.projectId === 'proj-1'));
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);

  const tabs = [
    { id: 'tasks', label: 'Tasks & Sprints', icon: <CheckSquare />, count: tasks.length },
    { id: 'milestones', label: 'Milestones & Timeline', icon: <Calendar /> },
    { id: 'docs', label: 'RAG Knowledge Docs', icon: <FileText />, count: 2 },
    { id: 'team', label: 'Team', icon: <Users />, count: project.members.length }
  ];

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const next = t.status === 'DONE' ? 'TODO' : 'DONE';
          toast(next === 'DONE' ? 'Task Completed' : 'Task Reopened', `"${t.title}" updated.`);
          return { ...t, status: next };
        }
        return t;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/app/projects" className="flex items-center gap-1 hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
        <span>/</span>
        <span className="font-mono text-primary font-bold">{project.key}</span>
      </div>

      {/* Project Banner Card */}
      <Card className="bg-gradient-to-r from-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20">
                  {project.key}
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
                <Badge variant={project.status === 'ACTIVE' ? 'success' : 'default'}>{project.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">{project.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/70 text-xs">
            <div>
              <span className="text-muted-foreground">Completion Rate</span>
              <div className="text-lg font-bold text-foreground mt-0.5">{project.progress}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Tasks</span>
              <div className="text-lg font-bold text-foreground mt-0.5">{tasks.length} Items</div>
            </div>
            <div>
              <span className="text-muted-foreground">Target Deadline</span>
              <div className="text-lg font-bold text-foreground mt-0.5">{project.dueDate}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Workspace</span>
              <div className="text-lg font-bold text-primary mt-0.5">{project.category}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content 1: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Sprint Deliverables</h3>
            <span className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.status === 'DONE').length} of {tasks.length} completed
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => {
              const isDone = task.status === 'DONE';
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/60 hover:border-primary/40 transition-all"
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
                      <p className="text-[11px] text-muted-foreground mt-0.5">{task.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-muted-foreground">{task.projectKey}</span>
                    <Badge variant={task.priority === 'URGENT' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 2: Milestones */}
      {activeTab === 'milestones' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Milestone Timeline</CardTitle>
            <CardDescription className="text-xs">Key delivery dates and sign-off criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'M1: Database Schema & pgvector Configuration', date: 'Oct 30, 2026', done: true },
              { title: 'M2: LangChain Gemini Tooling & RAG Ingestion Pipeline', date: 'Nov 15, 2026', done: false },
              { title: 'M3: Real-Time Socket.IO Synchronization & Kanban Release', date: 'Nov 30, 2026', done: false },
              { title: 'M4: Production Hardening, Rate Limiting & SOC2 Audit', date: 'Dec 15, 2026', done: false }
            ].map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20">
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${m.done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {m.done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${m.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {m.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{m.date}</div>
                  </div>
                </div>
                <Badge variant={m.done ? 'success' : 'outline'} className="text-[10px]">
                  {m.done ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tab Content 3: Docs */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INITIAL_DOCUMENTS.slice(0, 2).map((doc) => (
            <Card key={doc.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{doc.title}</div>
                  <div className="text-[10px] text-muted-foreground">{doc.size} · {doc.chunksCount} chunks indexed</div>
                </div>
              </div>
              <Badge variant="cyan" className="text-[10px]">{doc.ragStatus}</Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Content 4: Team */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {project.members.map((m, idx) => (
            <Card key={idx} className="p-4 flex items-center gap-3">
              <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-border" />
              <div>
                <div className="text-xs font-semibold text-foreground">{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{m.role}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={(t) => setTasks([...tasks, t])}
      />
    </div>
  );
}
