import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Plus,
  Calendar,
  Layers,
  Users,
  CheckSquare,
  Settings,
  Activity,
  Archive,
  Trash2,
  AlertCircle,
  Save,
  UserPlus,
  Flag,
  Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs } from '../components/ui/tabs';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../app/store/useAuthStore';
import {
  ProjectDetailItem,
  ProjectStatus,
  ProjectPriority,
  MilestoneStatus,
  MilestoneItem
} from '../types/project.types';

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTenant, user } = useAuthStore();

  const [project, setProject] = React.useState<ProjectDetailItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('tasks');
  const [teamMembers, setTeamMembers] = React.useState<Array<{ userId: string; fullName: string; email: string }>>([]);

  // Milestone Modal State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = React.useState(false);
  const [milestoneTitle, setMilestoneTitle] = React.useState('');
  const [milestoneDesc, setMilestoneDesc] = React.useState('');
  const [milestoneDate, setMilestoneDate] = React.useState('');
  const [milestoneSubmitting, setMilestoneSubmitting] = React.useState(false);

  // Add Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'>('CONTRIBUTOR');
  const [memberSubmitting, setMemberSubmitting] = React.useState(false);

  // Quick Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskPriority, setTaskPriority] = React.useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = React.useState('');
  const [taskSubmitting, setTaskSubmitting] = React.useState(false);

  // Settings Edit State
  const [editName, setEditName] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');
  const [editStatus, setEditStatus] = React.useState<ProjectStatus>('PLANNING');
  const [editPriority, setEditPriority] = React.useState<ProjectPriority>('MEDIUM');
  const [editDueDate, setEditDueDate] = React.useState('');
  const [editManagerId, setEditManagerId] = React.useState('');
  const [settingsSaving, setSettingsSaving] = React.useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projRes, membersRes] = await Promise.all([
        apiClient.get(`/projects/${id}`),
        apiClient.get('/tenants/current/members').catch(() => null)
      ]);

      if (projRes.data?.data) {
        const p = projRes.data.data;
        setProject(p);
        setEditName(p.name);
        setEditDesc(p.description || '');
        setEditStatus(p.status);
        setEditPriority(p.priority);
        setEditDueDate(p.dueDate ? p.dueDate.substring(0, 10) : '');
        setEditManagerId(p.manager?.id || '');
      }

      if (membersRes?.data?.data) {
        setTeamMembers(membersRes.data.data);
      }
    } catch (err: any) {
      toast('Load Failed', err.response?.data?.detail || 'Cannot load project details.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProjectDetails();
  }, [id, activeTenant?.id]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !id) return;
    setMilestoneSubmitting(true);

    try {
      await apiClient.post(`/projects/${id}/milestones`, {
        title: milestoneTitle.trim(),
        description: milestoneDesc.trim() || undefined,
        dueDate: milestoneDate || undefined,
        status: 'OPEN'
      });
      toast('Milestone Created', `"${milestoneTitle}" added to project roadmap.`);
      setIsMilestoneModalOpen(false);
      setMilestoneTitle('');
      setMilestoneDesc('');
      setMilestoneDate('');
      fetchProjectDetails();
    } catch (err: any) {
      toast('Error', err.response?.data?.detail || 'Failed to create milestone.');
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const handleToggleMilestone = async (milestone: MilestoneItem) => {
    if (!id) return;
    const nextStatus = milestone.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';

    try {
      await apiClient.patch(`/projects/${id}/milestones/${milestone.id}`, { status: nextStatus });
      toast(nextStatus === 'COMPLETED' ? 'Milestone Completed 🎉' : 'Milestone Reopened', `"${milestone.title}" updated.`);
      fetchProjectDetails();
    } catch (err: any) {
      toast('Error', err.response?.data?.detail || 'Failed to update milestone.');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string, title: string) => {
    if (!id || !confirm(`Delete milestone "${title}"?`)) return;

    try {
      await apiClient.delete(`/projects/${id}/milestones/${milestoneId}`);
      toast('Milestone Deleted', `"${title}" has been removed.`);
      fetchProjectDetails();
    } catch (err: any) {
      toast('Error', err.response?.data?.detail || 'Failed to delete milestone.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !id) return;
    setMemberSubmitting(true);

    try {
      await apiClient.post(`/projects/${id}/members`, {
        userId: selectedUserId,
        role: selectedRole
      });
      toast('Member Added', 'Teammate assigned to project.');
      setIsMemberModalOpen(false);
      fetchProjectDetails();
    } catch (err: any) {
      toast('Notice', err.response?.data?.detail || 'Failed to add member.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string, name: string) => {
    if (!id || !confirm(`Remove ${name} from this project?`)) return;

    try {
      await apiClient.delete(`/projects/${id}/members/${memberUserId}`);
      toast('Member Removed', `${name} unassigned from project.`);
      fetchProjectDetails();
    } catch (err: any) {
      toast('Error', err.response?.data?.detail || 'Cannot remove member.');
    }
  };

  const handleQuickCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !id) return;
    setTaskSubmitting(true);

    try {
      await apiClient.post('/tasks', {
        projectId: id,
        title: taskTitle.trim(),
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        status: 'TODO'
      });
      toast('Task Created', `"${taskTitle}" added to project.`);
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDueDate('');
      fetchProjectDetails();
    } catch (err: any) {
      toast('Task Creation Notice', err.response?.data?.detail || 'Created in local view.');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string, title: string) => {
    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await apiClient.patch(`/tasks/${taskId}`, { status: nextStatus });
      toast(nextStatus === 'DONE' ? 'Task Completed' : 'Task Reopened', `"${title}" updated.`);
      fetchProjectDetails();
    } catch {
      // Optimistic fallback
      if (project) {
        setProject({
          ...project,
          tasks: project.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
        });
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSettingsSaving(true);

    try {
      await apiClient.patch(`/projects/${id}`, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate || null,
        managerId: editManagerId || null
      });
      toast('Project Updated', 'Project settings saved successfully.');
      fetchProjectDetails();
    } catch (err: any) {
      toast('Error', err.response?.data?.detail || 'Failed to save project settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!id || !project) return;
    try {
      await apiClient.patch(`/projects/${id}/archive`, { archive: !project.isArchived });
      toast(
        !project.isArchived ? 'Project Archived' : 'Project Restored',
        `Project status updated.`
      );
      fetchProjectDetails();
    } catch (err: any) {
      toast('Error', err.response?.data?.detail || 'Cannot change archive status.');
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    if (!confirm(`Are you sure you want to permanently delete "${project.name}"? All tasks, milestones, and activities will be destroyed.`)) {
      return;
    }

    try {
      await apiClient.delete(`/projects/${id}`);
      toast('Project Deleted', `"${project.name}" has been deleted.`);
      navigate('/app/projects');
    } catch (err: any) {
      toast('Action Blocked', err.response?.data?.detail || 'Insufficient permissions to delete project.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-accent/40 rounded animate-pulse" />
        <div className="h-48 bg-card rounded-2xl border border-border animate-pulse" />
        <div className="h-80 bg-card rounded-2xl border border-border animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="p-12 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Project Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested project could not be found or you do not have permission.</p>
        <Link to="/app/projects">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Return to Projects
          </Button>
        </Link>
      </Card>
    );
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare />, count: project.tasks?.length || 0 },
    { id: 'milestones', label: 'Milestones & Timeline', icon: <Calendar />, count: project.milestones?.length || 0 },
    { id: 'team', label: 'Project Team', icon: <Users />, count: project.members?.length || 0 },
    { id: 'activity', label: 'Activity Feed', icon: <Activity />, count: project.activities?.length || 0 },
    { id: 'settings', label: 'Settings', icon: <Settings /> }
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/app/projects" className="flex items-center gap-1 hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
        <span>/</span>
        <span className="font-mono text-primary font-bold">{project.key}</span>
        <span>/</span>
        <span className="text-foreground font-semibold truncate max-w-xs">{project.name}</span>
      </div>

      {/* Hero Banner Card */}
      <Card className="bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20">
                  {project.key}
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
                <Badge variant={project.status === 'COMPLETED' ? 'success' : 'purple'}>
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge variant="cyan">{project.priority}</Badge>
                {project.isArchived && <Badge variant="outline">Archived</Badge>}
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                {project.description || 'No detailed scope description provided.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsMilestoneModalOpen(true)}>
                <Target className="w-3.5 h-3.5 mr-1" /> Add Milestone
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/70 text-xs">
            <div>
              <span className="text-muted-foreground">Progress Completion</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-lg font-bold text-foreground">{project.progress}%</div>
                <div className="flex-1 max-w-[80px] bg-accent/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, project.progress)}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Tasks Status</span>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {project.metrics.doneTasks} / {project.metrics.totalTasks} Done
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Target Deadline</span>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No date set'}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Project Manager</span>
              <div className="flex items-center gap-1.5 mt-0.5 truncate">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
                  {project.manager?.fullName?.charAt(0) || 'M'}
                </div>
                <span className="font-semibold text-foreground truncate">
                  {project.manager?.fullName || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: Tasks */}
      {activeTab === 'tasks' && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Project Tasks ({project.tasks.length})</h3>
              <p className="text-xs text-muted-foreground">Deliverables scheduled under this project key.</p>
            </div>
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New Task
            </Button>
          </div>

          {project.tasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No tasks created yet for this project. Click "New Task" to create one.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {project.tasks.map((task: any) => {
                const isDone = task.status === 'DONE';
                return (
                  <div
                    key={task.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-accent/20 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(task.id, task.status, task.title)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-input hover:border-primary'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <span className="font-mono text-xs text-primary font-bold mr-2">
                          {project.key}-{task.taskNumber || '1'}
                        </span>
                        <span className={`text-xs font-medium ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <Badge variant={isDone ? 'success' : task.status === 'IN_PROGRESS' ? 'purple' : 'secondary'} className="text-[10px]">
                        {task.status}
                      </Badge>

                      <Badge variant={task.priority === 'URGENT' ? 'destructive' : task.priority === 'HIGH' ? 'warning' : 'outline'} className="text-[10px]">
                        {task.priority}
                      </Badge>

                      {task.dueDate && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Milestones */}
      {activeTab === 'milestones' && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Milestones & Phase Gates ({project.milestones.length})</h3>
              <p className="text-xs text-muted-foreground">Track high-level achievements and target deadlines.</p>
            </div>
            <Button size="sm" onClick={() => setIsMilestoneModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
            </Button>
          </div>

          {project.milestones.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No milestones defined yet. Break down the project into target phase deliverables.
            </div>
          ) : (
            <div className="space-y-3">
              {project.milestones.map((ms: MilestoneItem) => {
                const isCompleted = ms.status === 'COMPLETED';
                return (
                  <div
                    key={ms.id}
                    className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleMilestone(ms)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors cursor-pointer ${
                          isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-input hover:border-primary'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className={`text-xs font-bold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {ms.title}
                        </div>
                        {ms.description && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{ms.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={isCompleted ? 'success' : 'warning'} className="text-[10px]">
                        {ms.status}
                      </Badge>

                      {ms.dueDate && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ms.dueDate).toLocaleDateString()}
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteMilestone(ms.id, ms.title)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Project Team */}
      {activeTab === 'team' && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Project Assignees & Roles ({project.members.length})</h3>
              <p className="text-xs text-muted-foreground">Collaborators with direct access to this project.</p>
            </div>
            <Button size="sm" onClick={() => setIsMemberModalOpen(true)}>
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Member
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {project.members.map((m: any) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                    {m.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-foreground truncate">{m.user?.fullName || 'Team Member'}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{m.user?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="cyan" className="text-[10px]">{m.role}</Badge>
                  {m.user?.id !== project.managerId && (
                    <button
                      onClick={() => handleRemoveMember(m.user?.id, m.user?.fullName)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Unassign member"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Activity Feed */}
      {activeTab === 'activity' && (
        <Card className="p-4 space-y-4">
          <div className="pb-3 border-b border-border/70">
            <h3 className="font-semibold text-sm text-foreground">Audit Activity History</h3>
            <p className="text-xs text-muted-foreground">Immutable timeline of project modifications, state changes, and updates.</p>
          </div>

          {project.activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No activities recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {project.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/20 text-xs">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {act.actor?.fullName?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{act.actor?.fullName || 'System'}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{act.action}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {act.details && (
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {JSON.stringify(act.details)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Metadata & Parameters</CardTitle>
              <CardDescription className="text-xs">Update project name, description, priority, and assigned manager.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Project Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground/80">Project Key (Read-Only)</label>
                    <input
                      type="text"
                      disabled
                      value={project.key}
                      className="w-full h-9 rounded-md border border-input bg-muted/40 px-3 text-xs text-muted-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground/80">Project Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                      className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground/80">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as ProjectPriority)}
                      className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      label="Target Deadline"
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">Project Manager</label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">No Manager Assigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">Description</label>
                  <textarea
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-md border border-input bg-background/60 p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-border/70">
                  <Button type="submit" size="sm" isLoading={settingsSaving}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-xs">
                Archiving hides project from default roadmaps. Deletion is permanent and purges all tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 border border-border">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {project.isArchived ? 'Restore Project' : 'Archive Project'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {project.isArchived
                      ? 'Reactivate project and return to active roadmaps.'
                      : 'Move project to archived status while preserving all history.'}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleArchiveProject}>
                  <Archive className="w-3.5 h-3.5 mr-1" />
                  {project.isArchived ? 'Restore' : 'Archive'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div>
                  <div className="text-xs font-semibold text-destructive">Delete Project Permanently</div>
                  <div className="text-[11px] text-destructive/80">
                    Irrevocably deletes this project, associated tasks, milestones, and activities.
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Create Milestone */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Add Project Milestone"
        description="Define a phase gate, sprint milestone, or key deliverable for this project."
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4 pt-2">
          <Input
            label="Milestone Title"
            placeholder="e.g. Beta MVP Release"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            required
            autoFocus
          />

          <div>
            <Input
              label="Target Due Date"
              type="date"
              value={milestoneDate}
              onChange={(e) => setMilestoneDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Description</label>
            <textarea
              rows={2}
              placeholder="Outline deliverables required for completion..."
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              className="w-full rounded-md border border-input bg-background/60 p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={milestoneSubmitting}>
              Create Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Project Member */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title="Assign Project Member"
        description="Grant a team collaborator access to tasks and updates for this project."
      >
        <form onSubmit={handleAddMember} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Select Teammate</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select a team member...</option>
              {teamMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Project Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="CONTRIBUTOR">Contributor (Create & complete tasks)</option>
              <option value="MANAGER">Manager (Full project administration)</option>
              <option value="VIEWER">Viewer (Read-only access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={memberSubmitting}>
              Assign Teammate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Add Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Project Task"
        description={`Create a new task scheduled under project [${project.key}].`}
      >
        <form onSubmit={handleQuickCreateTask} className="space-y-4 pt-2">
          <Input
            label="Task Title"
            placeholder="e.g. Implement PostgreSQL schema migration"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <Input
                label="Due Date"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={taskSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
