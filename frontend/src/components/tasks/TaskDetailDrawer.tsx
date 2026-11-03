import * as React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  Tag,
  CheckSquare,
  Paperclip,
  GitBranch,
  History,
  MessageSquare,
  Trash2,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from '../ui/toast';
import { apiClient } from '../../lib/apiClient';
import {
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskComment,
  TaskSubtask,
  TaskDependencyItem,
  TaskAttachment,
  TaskLabel,
  TaskActivityItem
} from '../../types/task.types';

interface TaskDetailDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: TaskItem) => void;
  onTaskDeleted?: (deletedTaskId: string) => void;
  allTasks?: TaskItem[]; // For dependency selection
}

export function TaskDetailDrawer({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  allTasks = []
}: TaskDetailDrawerProps) {
  const [task, setTask] = React.useState<TaskItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Tabs: details, activity, comments
  const [activeTab, setActiveTab] = React.useState<'overview' | 'activity' | 'comments'>('overview');

  // Inline edit state
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<TaskStatus>('TODO');
  const [priority, setPriority] = React.useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = React.useState('');
  const [startDate, setStartDate] = React.useState('');

  // Subtask creation
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  // Label creation
  const [newLabelName, setNewLabelName] = React.useState('');
  const [newLabelColor, setNewLabelColor] = React.useState('#6366f1');
  const [isAddingLabel, setIsAddingLabel] = React.useState(false);

  // Dependency creation
  const [selectedPrereqId, setSelectedPrereqId] = React.useState('');
  const [isAddingDependency, setIsAddingDependency] = React.useState(false);
  const [dependencyError, setDependencyError] = React.useState<string | null>(null);

  // Attachment creation
  const [isAddingAttachment, setIsAddingAttachment] = React.useState(false);
  const [attachmentName, setAttachmentName] = React.useState('');
  const [attachmentUrl, setAttachmentUrl] = React.useState('');

  // Comment input
  const [newComment, setNewComment] = React.useState('');
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);

  // Fetch task details on open
  React.useEffect(() => {
    if (!taskId || !isOpen) {
      setTask(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/tasks/${taskId}`)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data;
        if (data) {
          setTask(data);
          setTitle(data.title || '');
          setDescription(data.description || '');
          setStatus(data.status || 'TODO');
          setPriority(data.priority || 'MEDIUM');
          setDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
          setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load task details from API, using cached state:', err);
        // Fallback to item from allTasks if API is offline
        const matched = allTasks.find((t) => t.id === taskId);
        if (matched) {
          setTask(matched);
          setTitle(matched.title || '');
          setDescription(matched.description || '');
          setStatus(matched.status || 'TODO');
          setPriority(matched.priority || 'MEDIUM');
          setDueDate(matched.dueDate ? matched.dueDate.split('T')[0] : '');
          setStartDate(matched.startDate ? matched.startDate.split('T')[0] : '');
        } else {
          setError('Could not load task details.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [taskId, isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Save changes to backend
  const handleSaveField = async (field: string, value: any) => {
    if (!task) return;

    try {
      const payload: any = { [field]: value };
      const res = await apiClient.patch(`/tasks/${task.id}`, payload);
      const updated = res.data?.data || { ...task, ...payload };
      setTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
      toast('Updated', `Task ${field} updated.`);
    } catch (err: any) {
      console.error(`Failed to update ${field}:`, err);
      // Optimistic local update
      const updated = { ...task, [field]: value };
      setTask(updated as any);
      if (onTaskUpdated) onTaskUpdated(updated as any);
      toast('Saved Locally', `Task ${field} updated.`);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const res = await apiClient.post(`/tasks/${task.id}/comments`, {
        content: newComment.trim()
      });
      const createdComment: TaskComment = res.data?.data || {
        id: `cm-${Date.now()}`,
        taskId: task.id,
        userId: 'current-user',
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        user: { id: 'u-1', fullName: 'You', email: 'user@acme.com', avatarUrl: null }
      };

      const updatedTask = {
        ...task,
        comments: [...(task.comments || []), createdComment]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setNewComment('');
      toast('Comment Posted', 'Your comment was added to the task thread.');
    } catch (err) {
      // Optimistic fallback
      const createdComment: TaskComment = {
        id: `cm-${Date.now()}`,
        taskId: task.id,
        userId: 'current-user',
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        user: { id: 'u-1', fullName: 'You', email: 'user@acme.com', avatarUrl: null }
      };
      const updatedTask = {
        ...task,
        comments: [...(task.comments || []), createdComment]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setNewComment('');
      toast('Comment Added', 'Your comment has been added locally.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Add Subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim()) return;

    try {
      const res = await apiClient.post(`/tasks/${task.id}/subtasks`, {
        title: newSubtaskTitle.trim(),
        priority: 'MEDIUM'
      });
      const created = res.data?.data || {
        id: `sub-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        status: 'TODO' as TaskStatus,
        priority: 'MEDIUM' as TaskPriority
      };

      const updatedTask = {
        ...task,
        subtasks: [...(task.subtasks || []), created]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setNewSubtaskTitle('');
      toast('Subtask Added', `"${newSubtaskTitle}" created.`);
    } catch (err) {
      const created = {
        id: `sub-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        status: 'TODO' as TaskStatus,
        priority: 'MEDIUM' as TaskPriority
      };
      const updatedTask = {
        ...task,
        subtasks: [...(task.subtasks || []), created]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setNewSubtaskTitle('');
      toast('Subtask Added', `"${newSubtaskTitle}" created locally.`);
    }
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = async (subtaskId: string, currentStatus: TaskStatus) => {
    if (!task) return;
    const targetStatus = currentStatus === 'COMPLETED' || currentStatus === 'DONE' ? 'TODO' : 'COMPLETED';

    try {
      await apiClient.patch(`/tasks/${subtaskId}`, { status: targetStatus });
    } catch {
      // Ignore API error in offline mode
    }

    const updatedSubtasks = (task.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, status: targetStatus as TaskStatus } : s
    );
    const updatedTask = { ...task, subtasks: updatedSubtasks };
    setTask(updatedTask);
    if (onTaskUpdated) onTaskUpdated(updatedTask);
  };

  // Add Label
  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newLabelName.trim()) return;

    try {
      const res = await apiClient.post(`/tasks/${task.id}/labels`, {
        name: newLabelName.trim(),
        color: newLabelColor
      });
      const createdLabel: TaskLabel = res.data?.data || {
        id: `lbl-${Date.now()}`,
        name: newLabelName.trim(),
        color: newLabelColor
      };

      const updatedTask = {
        ...task,
        labels: [...(task.labels || []), createdLabel]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setNewLabelName('');
      setIsAddingLabel(false);
      toast('Label Attached', `"${createdLabel.name}" tag added.`);
    } catch (err) {
      const createdLabel: TaskLabel = {
        id: `lbl-${Date.now()}`,
        name: newLabelName.trim(),
        color: newLabelColor
      };
      const updatedTask = {
        ...task,
        labels: [...(task.labels || []), createdLabel]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setNewLabelName('');
      setIsAddingLabel(false);
    }
  };

  // Remove Label
  const handleRemoveLabel = async (labelId: string) => {
    if (!task) return;
    try {
      await apiClient.delete(`/tasks/${task.id}/labels/${labelId}`);
    } catch {
      // Continue optimistic
    }
    const updatedTask = {
      ...task,
      labels: (task.labels || []).filter((l) => l.id !== labelId)
    };
    setTask(updatedTask);
    if (onTaskUpdated) onTaskUpdated(updatedTask);
  };

  // Add Attachment
  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !attachmentName.trim() || !attachmentUrl.trim()) return;

    try {
      const res = await apiClient.post(`/tasks/${task.id}/attachments`, {
        name: attachmentName.trim(),
        fileUrl: attachmentUrl.trim(),
        fileSize: 1048576, // 1MB mock
        mimeType: 'application/pdf'
      });
      const created = res.data?.data || {
        id: `att-${Date.now()}`,
        name: attachmentName.trim(),
        fileUrl: attachmentUrl.trim(),
        fileSize: 1048576,
        mimeType: 'application/pdf',
        createdAt: new Date().toISOString()
      };

      const updatedTask = {
        ...task,
        attachments: [created, ...(task.attachments || [])]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setAttachmentName('');
      setAttachmentUrl('');
      setIsAddingAttachment(false);
      toast('Attachment Added', `File attached successfully.`);
    } catch (err) {
      const created = {
        id: `att-${Date.now()}`,
        name: attachmentName.trim(),
        fileUrl: attachmentUrl.trim(),
        fileSize: 1048576,
        mimeType: 'application/pdf',
        createdAt: new Date().toISOString()
      };
      const updatedTask = {
        ...task,
        attachments: [created, ...(task.attachments || [])]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setAttachmentName('');
      setAttachmentUrl('');
      setIsAddingAttachment(false);
    }
  };

  // Add Dependency (with Cycle Validation)
  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !selectedPrereqId) return;

    setDependencyError(null);

    // Client-side self dependency guard
    if (selectedPrereqId === task.id) {
      setDependencyError('A task cannot depend on itself.');
      return;
    }

    try {
      const res = await apiClient.post(`/tasks/${task.id}/dependencies`, {
        dependsOnTaskId: selectedPrereqId,
        type: 'BLOCKS'
      });

      const prerequisiteTask = allTasks.find((t) => t.id === selectedPrereqId);
      const createdDep: TaskDependencyItem = res.data?.data || {
        id: `dep-${Date.now()}`,
        taskId: task.id,
        dependsOnTaskId: selectedPrereqId,
        type: 'BLOCKS',
        dependsOnTask: {
          id: selectedPrereqId,
          taskNumber: prerequisiteTask?.taskNumber || 10,
          title: prerequisiteTask?.title || 'Prerequisite Task',
          status: prerequisiteTask?.status || 'TODO',
          priority: prerequisiteTask?.priority || 'MEDIUM'
        }
      };

      const updatedTask = {
        ...task,
        dependencies: [...(task.dependencies || []), createdDep]
      };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      setSelectedPrereqId('');
      setIsAddingDependency(false);
      toast('Dependency Linked', 'Task prerequisite saved.');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Circular dependency detected or failed to link prerequisite.';
      setDependencyError(errorMsg);
      toast('Dependency Conflict', errorMsg, 'error');
    }
  };

  // Remove Dependency
  const handleRemoveDependency = async (dependsOnTaskId: string) => {
    if (!task) return;
    try {
      await apiClient.delete(`/tasks/${task.id}/dependencies/${dependsOnTaskId}`);
    } catch {
      // optimistic
    }
    const updatedTask = {
      ...task,
      dependencies: (task.dependencies || []).filter((d) => d.dependsOnTaskId !== dependsOnTaskId)
    };
    setTask(updatedTask);
    if (onTaskUpdated) onTaskUpdated(updatedTask);
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!task) return;
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    try {
      await apiClient.delete(`/tasks/${task.id}`);
    } catch {
      // local fallback
    }

    toast('Task Deleted', `"${task.title}" was removed.`);
    if (onTaskDeleted) onTaskDeleted(task.id);
    onClose();
  };

  const completedSubtasksCount = (task?.subtasks || []).filter(
    (s) => s.status === 'COMPLETED' || s.status === 'DONE'
  ).length;
  const totalSubtasksCount = (task?.subtasks || []).length;
  const subtaskPercentage =
    totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Background click overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-3xl xl:max-w-4xl bg-card border-l border-border shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
              {task?.project?.key ? `${task.project.key}-${task.taskNumber}` : `TASK-${task?.taskNumber || '0'}`}
            </span>
            <span className="text-xs text-muted-foreground">
              in {task?.project?.name || 'Project'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
              className="h-8 px-2.5 text-xs"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-border bg-background">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Comments ({(task?.comments || []).length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Activity Timeline ({(task?.activities || []).length})
          </button>
        </div>

        {/* Drawer Body Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && !task ? (
            <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
              Loading task details...
            </div>
          ) : error && !task ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          ) : !task ? null : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Title Input */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => {
                        if (title.trim() && title !== task.title) {
                          handleSaveField('title', title.trim());
                        }
                      }}
                      className="w-full text-xl font-bold bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary text-foreground outline-none py-1 transition-colors"
                      placeholder="Task Title..."
                    />
                  </div>

                  {/* Metadata Row: Status, Priority, Due Date */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-accent/20 p-3 rounded-xl border border-border/80">
                    {/* Status */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </span>
                      <select
                        value={status}
                        onChange={(e) => {
                          const newStatus = e.target.value as TaskStatus;
                          setStatus(newStatus);
                          handleSaveField('status', newStatus);
                        }}
                        className="w-full text-xs font-semibold bg-background border border-border rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Priority
                      </span>
                      <select
                        value={priority}
                        onChange={(e) => {
                          const newPriority = e.target.value as TaskPriority;
                          setPriority(newPriority);
                          handleSaveField('priority', newPriority);
                        }}
                        className="w-full text-xs font-semibold bg-background border border-border rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Start Date
                      </span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          handleSaveField('startDate', e.target.value || null);
                        }}
                        className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none"
                      />
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Due Date
                      </span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value);
                          handleSaveField('dueDate', e.target.value || null);
                        }}
                        className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none"
                      />
                    </div>
                  </div>

                  {/* Assignees & Labels row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Assignees */}
                    <div className="space-y-2 p-3 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" /> Assignees
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(task.assignees || []).map((a) => (
                          <div
                            key={a.id || a.userId}
                            className="flex items-center gap-1.5 bg-accent/40 border border-border/80 px-2.5 py-1 rounded-full text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                              {a.user.fullName?.[0] || 'U'}
                            </span>
                            <span className="font-medium text-foreground">{a.user.fullName}</span>
                          </div>
                        ))}
                        {(!task.assignees || task.assignees.length === 0) && (
                          <span className="text-xs text-muted-foreground italic">No team members assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="space-y-2 p-3 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Labels & Tags
                        </span>
                        <button
                          onClick={() => setIsAddingLabel(!isAddingLabel)}
                          className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(task.labels || []).map((l) => (
                          <span
                            key={l.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                            style={{
                              backgroundColor: `${l.color}15`,
                              borderColor: `${l.color}40`,
                              color: l.color
                            }}
                          >
                            {l.name}
                            <button
                              onClick={() => handleRemoveLabel(l.id)}
                              className="hover:opacity-75 cursor-pointer ml-0.5"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                        {(!task.labels || task.labels.length === 0) && !isAddingLabel && (
                          <span className="text-xs text-muted-foreground italic">No labels</span>
                        )}
                      </div>

                      {/* Add Label Inline Form */}
                      {isAddingLabel && (
                        <form onSubmit={handleAddLabel} className="pt-2 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Tag name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="h-7 text-xs px-2 border border-border rounded bg-background text-foreground flex-1 outline-none"
                            autoFocus
                          />
                          <input
                            type="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="w-7 h-7 p-0 rounded border-0 cursor-pointer"
                          />
                          <Button size="sm" type="submit" className="h-7 px-2 text-xs">
                            Add
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Description</span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Markdown supported
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => {
                        if (description !== task.description) {
                          handleSaveField('description', description);
                        }
                      }}
                      placeholder="Add detailed context, implementation specifications, acceptance criteria..."
                      className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  {/* Subtasks Section */}
                  <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          Subtasks Checklist ({completedSubtasksCount}/{totalSubtasksCount})
                        </span>
                      </div>
                      {totalSubtasksCount > 0 && (
                        <span className="text-xs font-bold text-primary font-mono">
                          {subtaskPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {totalSubtasksCount > 0 && (
                      <div className="w-full h-1.5 rounded-full bg-accent/40 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${subtaskPercentage}%` }}
                        />
                      </div>
                    )}

                    {/* Subtask list */}
                    <div className="space-y-1.5 pt-1">
                      {(task.subtasks || []).map((sub) => {
                        const isDone = sub.status === 'COMPLETED' || sub.status === 'DONE';
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-accent/20 hover:bg-accent/40 border border-border/60 transition-colors"
                          >
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleSubtask(sub.id, sub.status)}
                                className="rounded text-primary focus:ring-0 cursor-pointer"
                              />
                              <span
                                className={`text-xs ${
                                  isDone ? 'line-through text-muted-foreground' : 'text-foreground font-medium'
                                }`}
                              >
                                {sub.title}
                              </span>
                            </label>
                            <Badge variant={isDone ? 'outline' : 'secondary'} className="text-[10px]">
                              {sub.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Add Subtask Input */}
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a step or subtask..."
                        className="flex-1 h-8 text-xs px-2.5 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-1 focus:ring-ring"
                      />
                      <Button type="submit" size="sm" className="h-8 px-3 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    </form>
                  </div>

                  {/* Task Dependencies Section (Prerequisites & Cycle Detection) */}
                  <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold text-foreground">
                          Task Dependencies & Prerequisites
                        </span>
                      </div>
                      <button
                        onClick={() => setIsAddingDependency(!isAddingDependency)}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Link Prerequisite
                      </button>
                    </div>

                    {dependencyError && (
                      <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{dependencyError}</span>
                      </div>
                    )}

                    {/* Linked Prerequisites */}
                    <div className="space-y-1.5">
                      {(task.dependencies || []).map((dep) => (
                        <div
                          key={dep.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">
                              Prerequisite
                            </span>
                            <span className="font-medium text-foreground">
                              {dep.dependsOnTask.title}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {dep.dependsOnTask.status}
                            </Badge>
                          </div>
                          <button
                            onClick={() => handleRemoveDependency(dep.dependsOnTaskId)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Unlink prerequisite"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Tasks that depend on this one (Blocked by this) */}
                      {(task.blockedBy || []).map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">
                              Blocks
                            </span>
                            <span className="font-medium text-foreground">{b.task.title}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {b.task.status}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground italic">Waiting on this</span>
                        </div>
                      ))}

                      {(!task.dependencies || task.dependencies.length === 0) &&
                        (!task.blockedBy || task.blockedBy.length === 0) &&
                        !isAddingDependency && (
                          <span className="text-xs text-muted-foreground italic block">
                            No active dependencies or blocking requirements.
                          </span>
                        )}
                    </div>

                    {/* Add Dependency Selector */}
                    {isAddingDependency && (
                      <form onSubmit={handleAddDependency} className="pt-2 flex items-center gap-2">
                        <select
                          value={selectedPrereqId}
                          onChange={(e) => setSelectedPrereqId(e.target.value)}
                          className="flex-1 h-8 text-xs px-2 rounded-lg border border-border bg-background text-foreground outline-none"
                        >
                          <option value="">Select prerequisite task...</option>
                          {allTasks
                            .filter((t) => t.id !== task.id)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.project?.key ? `${t.project.key}-${t.taskNumber}: ` : ''}
                                {t.title} ({t.status})
                              </option>
                            ))}
                        </select>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!selectedPrereqId}
                          className="h-8 px-3 text-xs"
                        >
                          Link
                        </Button>
                      </form>
                    )}
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-foreground">
                          Attachments & Artifacts ({(task.attachments || []).length})
                        </span>
                      </div>
                      <button
                        onClick={() => setIsAddingAttachment(!isAddingAttachment)}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Link/File
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(task.attachments || []).map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-accent/20 border border-border/80 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-primary hover:underline truncate"
                            >
                              {att.name}
                            </a>
                            <span className="text-[10px] text-muted-foreground">
                              {(att.fileSize / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(att.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {(!task.attachments || task.attachments.length === 0) && !isAddingAttachment && (
                        <span className="text-xs text-muted-foreground italic block">
                          No files or assets attached.
                        </span>
                      )}
                    </div>

                    {isAddingAttachment && (
                      <form onSubmit={handleAddAttachment} className="space-y-2 pt-2 border-t border-border">
                        <input
                          type="text"
                          placeholder="Attachment label / file name"
                          value={attachmentName}
                          onChange={(e) => setAttachmentName(e.target.value)}
                          className="w-full h-8 text-xs px-2 rounded-lg border border-border bg-background text-foreground outline-none"
                          required
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="File URL or repository link"
                            value={attachmentUrl}
                            onChange={(e) => setAttachmentUrl(e.target.value)}
                            className="flex-1 h-8 text-xs px-2 rounded-lg border border-border bg-background text-foreground outline-none"
                            required
                          />
                          <Button type="submit" size="sm" className="h-8 px-3 text-xs">
                            Attach
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Comments Thread */}
                  <div className="space-y-3">
                    {(task.comments || []).map((cm) => (
                      <div
                        key={cm.id}
                        className="p-3 rounded-xl border border-border bg-accent/20 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                              {cm.user.fullName?.[0] || 'U'}
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {cm.user.fullName}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(cm.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap pl-7">
                          {cm.content}
                        </p>
                      </div>
                    ))}

                    {(!task.comments || task.comments.length === 0) && (
                      <div className="py-12 text-center text-xs text-muted-foreground italic">
                        No comments yet. Start the conversation below.
                      </div>
                    )}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-border">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment or update (Ctrl+Enter to post)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleAddComment(e);
                        }
                      }}
                      className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newComment.trim() || commentSubmitting}
                        className="text-xs"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Post Comment
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {(task.activities || []).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-accent/10"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {act.actor.fullName?.[0] || 'A'}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">
                            {act.actor.fullName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {act.action.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {(!task.activities || task.activities.length === 0) && (
                    <div className="py-12 text-center text-xs text-muted-foreground italic">
                      No logged activity events yet.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
