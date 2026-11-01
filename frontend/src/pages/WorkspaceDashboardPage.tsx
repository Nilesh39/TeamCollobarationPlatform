import * as React from 'react';
import {
  Layers,
  Building2,
  FolderPlus,
  Users,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus,
  Lock,
  Globe
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/toast';
import { useAuthStore } from '../app/store/useAuthStore';

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  isPrivate: boolean;
  projectCount: number;
  memberCount: number;
}

const INITIAL_WORKSPACES: WorkspaceItem[] = [
  {
    id: 'ws-1',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Primary software engineering and R&D workspace',
    isPrivate: false,
    projectCount: 3,
    memberCount: 8
  },
  {
    id: 'ws-2',
    name: 'Security & Compliance',
    slug: 'security-compliance',
    description: 'SOC2 audit, tenant isolation policies, and pen-testing reports',
    isPrivate: true,
    projectCount: 2,
    memberCount: 4
  },
  {
    id: 'ws-3',
    name: 'AI Intelligence Lab',
    slug: 'ai-lab',
    description: 'Autonomous agent prompt tuning, LangChain tools, and pgvector embeddings',
    isPrivate: false,
    projectCount: 4,
    memberCount: 6
  }
];

export function WorkspaceDashboardPage() {
  const { activeTenant } = useAuthStore();
  const [workspaces, setWorkspaces] = React.useState<WorkspaceItem[]>(INITIAL_WORKSPACES);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newWsName, setNewWsName] = React.useState('');
  const [newWsDesc, setNewWsDesc] = React.useState('');
  const [isPrivate, setIsPrivate] = React.useState(false);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const newWs: WorkspaceItem = {
      id: `ws-${Date.now().toString(36)}`,
      name: newWsName,
      slug: newWsName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: newWsDesc || 'Newly created organization workspace.',
      isPrivate,
      projectCount: 0,
      memberCount: 1
    };

    setWorkspaces((prev) => [...prev, newWs]);
    toast('Workspace Created', `"${newWsName}" has been provisioned.`);
    setNewWsName('');
    setNewWsDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Workspaces Management
            </h1>
            <Badge variant="cyan">{workspaces.length} Workspaces</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Organize departments, isolate permissions, and manage project containers for{' '}
            <span className="font-semibold text-foreground">{activeTenant?.name || 'Acme Corporation'}</span>.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> Create Workspace
        </Button>
      </div>

      {/* Quota & Capacity Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document Storage</span>
              <HardDrive className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">4.8 MB / 10 GB</div>
            <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '5%' }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">99.5% capacity available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Multi-Tenant Isolation</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-500">Row-Level Active</div>
            <p className="text-xs text-muted-foreground mt-1">Prisma Client auto-scopes `tenantId`</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization Plan</span>
              <Building2 className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">Enterprise</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Full API, Webhooks & pgvector access</p>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workspaces.map((ws) => (
          <Card key={ws.id} className="flex flex-col justify-between hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between pb-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <Badge variant={ws.isPrivate ? 'secondary' : 'outline'} className="text-[10px]">
                  {ws.isPrivate ? (
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
                  ) : (
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Shared</span>
                  )}
                </Badge>
              </div>
              <CardTitle className="text-base">{ws.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">{ws.description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-2 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>{ws.projectCount} Projects</span>
                <span>·</span>
                <span>{ws.memberCount} Members</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary"
                onClick={() => toast('Workspace Selected', `Switched view to ${ws.name}.`)}
              >
                Open <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal: Create Workspace */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workspace"
        description="Workspaces partition projects, documents, and agent tools within your organization."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-2">
          <Input
            label="Workspace Name"
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            placeholder="e.g. Mobile Engineering or Growth"
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Description</label>
            <textarea
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
              rows={3}
              placeholder="Workspace purpose and team scope..."
              className="w-full rounded-md border border-input bg-background/60 p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20">
            <div>
              <div className="text-xs font-semibold text-foreground">Private Workspace</div>
              <div className="text-[11px] text-muted-foreground">Only invited team members can see this workspace</div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
