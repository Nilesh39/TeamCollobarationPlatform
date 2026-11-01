import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { INITIAL_PROJECTS, FixtureProject } from '../lib/fixtures';

export function ProjectsPage() {
  const [projects, setProjects] = React.useState<FixtureProject[]>(INITIAL_PROJECTS);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // New Project Form State
  const [name, setName] = React.useState('');
  const [key, setKey] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('Engineering');
  const [dueDate, setDueDate] = React.useState('2026-12-15');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const projectKey = key.trim() || name.substring(0, 3).toUpperCase();
    const newProj: FixtureProject = {
      id: `proj-${Date.now().toString(36)}`,
      name,
      key: projectKey,
      description: description || 'New software engineering project.',
      status: 'ACTIVE',
      progress: 0,
      taskCount: 0,
      completedTasks: 0,
      members: [
        { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'Owner' }
      ],
      dueDate,
      category
    };

    setProjects([newProj, ...projects]);
    toast('Project Created', `Project [${projectKey}] "${name}" initialized.`);
    setName('');
    setKey('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
            <Badge variant="cyan">{projects.length} Total</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track roadmaps, sprint keys, and deliverable milestones across all workspace teams.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Filter projects by title or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Link key={project.id} to={`/app/projects/${project.id}`} className="group">
            <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-all duration-200 group-hover:shadow-lg">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {project.key}
                    </span>
                    <Badge variant={project.status === 'ACTIVE' ? 'success' : project.status === 'COMPLETED' ? 'default' : 'warning'} className="text-[10px]">
                      {project.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{project.category}</span>
                </div>

                <CardTitle className="text-base group-hover:text-primary transition-colors mt-2">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono font-bold text-foreground">{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{project.completedTasks} / {project.taskCount} tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due {project.dueDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Modal: Create Project */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        description="Set up a project key, milestones, and target due date."
      >
        <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!key) {
                setKey(e.target.value.substring(0, 4).toUpperCase());
              }
            }}
            placeholder="e.g. Distributed Vector Ingestion"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Project Key Prefix"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="e.g. VEC"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Engineering">Engineering</option>
                <option value="Intelligence">Intelligence</option>
                <option value="Product">Product</option>
                <option value="Security">Security</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief summary of deliverables and scope..."
              className="w-full rounded-md border border-input bg-background/60 p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Input
            label="Target Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
