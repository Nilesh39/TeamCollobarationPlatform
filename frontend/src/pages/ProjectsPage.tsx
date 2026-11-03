import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  MoreVertical,
  Archive,
  Trash2,
  AlertCircle,
  Building2,
  User,
  Shield,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../app/store/useAuthStore';
import { ProjectListItem, ProjectStatus, ProjectPriority } from '../types/project.types';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { activeTenant, user } = useAuthStore();

  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [workspaces, setWorkspaces] = React.useState<Array<{ id: string; name: string }>>([]);
  const [teamMembers, setTeamMembers] = React.useState<Array<{ userId: string; fullName: string; email: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL');
  const [includeArchived, setIncludeArchived] = React.useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState('');
  const [key, setKey] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [workspaceId, setWorkspaceId] = React.useState('');
  const [managerId, setManagerId] = React.useState('');
  const [status, setStatus] = React.useState<ProjectStatus>('PLANNING');
  const [priority, setPriority] = React.useState<ProjectPriority>('MEDIUM');
  const [dueDate, setDueDate] = React.useState('');

  const fetchDependencies = async () => {
    try {
      const [wsRes, membersRes] = await Promise.all([
        apiClient.get('/workspaces').catch(() => null),
        apiClient.get('/tenants/current/members').catch(() => null)
      ]);

      if (wsRes?.data?.data && wsRes.data.data.length > 0) {
        setWorkspaces(wsRes.data.data);
        if (!workspaceId) setWorkspaceId(wsRes.data.data[0].id);
      }

      if (membersRes?.data?.data && membersRes.data.data.length > 0) {
        setTeamMembers(membersRes.data.data);
        if (!managerId) setManagerId(user?.id || membersRes.data.data[0].userId);
      }
    } catch {
      // ignore
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();
      if (includeArchived || statusFilter === 'ARCHIVED') params.includeArchived = 'true';

      const res = await apiClient.get('/projects', { params });
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err: any) {
      toast('Sync Notice', 'Operating with cached project view.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDependencies();
  }, [activeTenant?.id]);

  React.useEffect(() => {
    fetchProjects();
  }, [activeTenant?.id, statusFilter, priorityFilter, includeArchived]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length < 2) {
      const generated = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase();
      if (generated) setKey(generated);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    setSubmitting(true);
    setModalError(null);

    try {
      const targetWorkspaceId = workspaceId || workspaces[0]?.id;
      if (!targetWorkspaceId) {
        setModalError('No active workspace available in this organization.');
        setSubmitting(false);
        return;
      }

      const res = await apiClient.post('/projects', {
        workspaceId: targetWorkspaceId,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        status,
        priority,
        managerId: managerId || undefined,
        dueDate: dueDate || undefined
      });

      toast('Project Created', `Project [${res.data?.data?.key || key}] created successfully.`);
      setIsModalOpen(false);
      setName('');
      setKey('');
      setDescription('');
      setDueDate('');
      fetchProjects();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async (projectId: string, currentArchived: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/projects/${projectId}/archive`, { archive: !currentArchived });
      toast(
        !currentArchived ? 'Project Archived' : 'Project Restored',
        `Project status updated successfully.`
      );
      fetchProjects();
    } catch (err: any) {
      toast('Action Failed', err.response?.data?.detail || 'Cannot update project archive status.');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete project "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast('Project Deleted', `"${projectName}" has been permanently removed.`);
      fetchProjects();
    } catch (err: any) {
      toast('Deletion Blocked', err.response?.data?.detail || 'Permission denied to delete project.');
    }
  };

  const getPriorityBadgeVariant = (p: ProjectPriority) => {
    switch (p) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'cyan';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (s: ProjectStatus) => {
    switch (s) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'purple';
      case 'ON_HOLD':
        return 'warning';
      case 'ARCHIVED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.key.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
            <Badge variant="cyan">{projects.length} Total</Badge>
            {includeArchived && <Badge variant="outline">Including Archived</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Organize roadmaps, sprint keys, and deliverables with multi-tenant PostgreSQL isolation.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="w-full lg:w-80">
          <Input
            placeholder="Search projects by title, key, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Priority filter dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <Button
            variant={includeArchived ? 'primary' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setIncludeArchived(!includeArchived)}
          >
            <Archive className="w-3.5 h-3.5" />
            {includeArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl border border-border bg-card/50 animate-pulse p-5" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No projects found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filter criteria.'
                : 'Get started by creating your team’s first project.'}
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((proj) => (
            <Card
              key={proj.id}
              onClick={() => navigate(`/app/projects/${proj.id}`)}
              className="group hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {proj.key}
                    </span>
                    <Badge variant={getPriorityBadgeVariant(proj.priority)} className="text-[10px]">
                      {proj.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge variant={getStatusBadgeVariant(proj.status)} className="text-[10px]">
                      {proj.status.replace('_', ' ')}
                    </Badge>

                    <button
                      onClick={(e) => handleArchiveToggle(proj.id, proj.isArchived, e)}
                      title={proj.isArchived ? 'Unarchive' : 'Archive'}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteProject(proj.id, proj.name, e)}
                      title="Delete project"
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors mt-2">
                  {proj.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {proj.description || 'No detailed project description specified.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-accent/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, proj.progress)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Badges */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/70">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{proj.metrics.doneTasks}/{proj.metrics.totalTasks} Tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>{proj.metrics.milestonesCount} Milestones</span>
                  </div>
                </div>

                {/* Footer with Manager and Deadline */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/60 text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate max-w-[140px]" title={proj.manager?.fullName || 'Unassigned'}>
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
                      {proj.manager?.fullName?.charAt(0) || 'M'}
                    </div>
                    <span className="truncate">{proj.manager?.fullName || 'No Manager'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span>{proj.dueDate ? new Date(proj.dueDate).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Project */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        description="Initialize a collaborative project tracked across roadmaps and task boards."
      >
        <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
          {modalError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Project Name"
                placeholder="e.g. Next-Gen Mobile Client"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Input
                label="Project Key"
                placeholder="e.g. MOB"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Workspace</label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Project Manager</label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                {teamMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
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
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Project Description</label>
            <textarea
              rows={3}
              placeholder="Outline project scope, architecture objectives, and success criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background/60 p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
