import * as React from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from '../ui/toast';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
}

export function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [projectId, setProjectId] = React.useState('proj-1');
  const [dueDate, setDueDate] = React.useState('2026-11-20');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const newTask = {
        id: `task-${Date.now().toString(36)}`,
        projectId,
        projectKey: projectId === 'proj-1' ? 'CORE' : 'AI',
        title,
        description,
        status: 'TODO',
        priority,
        assignee: {
          name: 'Alice Walker',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          email: 'owner@acme.com'
        },
        dueDate,
        tags: ['Feature', priority],
        commentsCount: 0
      };

      if (onTaskCreated) {
        onTaskCreated(newTask);
      }

      toast('Task Created', `"${title}" has been assigned to sprint board.`);
      setLoading(false);
      setTitle('');
      setDescription('');
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Create a task with priority, project scope, and deadlines."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement LangChain tool execution"
          required
          autoFocus
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/80">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add context, acceptance criteria or technical notes..."
            className="w-full rounded-md border border-input bg-background/60 p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="proj-1">CORE - Core Architecture</option>
              <option value="proj-2">AI - Gemini Reasoning</option>
              <option value="proj-3">MOB - Mobile Client</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent ⚡</option>
            </select>
          </div>
        </div>

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={loading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
