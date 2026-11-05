import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wand2,
  BrainCircuit,
  Bot,
  Layers,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  ShieldAlert,
  Send,
  RotateCcw,
  Zap,
  Check,
  Eye,
  KeyRound,
  FileCheck2,
  GitBranch,
  Activity,
  Layers2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../app/store/useAuthStore';
import { playNotificationChime } from '../app/store/useNotificationStore';
import {
  StructuredProjectPlan,
  TaskPlanItem,
  MilestonePlanItem,
  TokenUsageInfo
} from '../types/ai-planner.types';

const SAMPLE_PROMPTS = [
  {
    title: 'E-Commerce Platform',
    prompt: 'Create an e-commerce website using React, Node.js and PostgreSQL within 30 days.',
    days: 30
  },
  {
    title: 'Healthcare Patient Portal',
    prompt: 'Build a Healthcare Patient Portal with HIPAA compliance, WebRTC tele-consultations, and electronic prescriptions in 60 days.',
    days: 60
  },
  {
    title: 'Collaborative Code Editor',
    prompt: 'Develop a real-time collaborative code editor with WebSockets, syntax highlighting, and Docker sandboxes in 45 days.',
    days: 45
  }
];

export function AiProjectPlannerPage() {
  const navigate = useNavigate();
  const { activeTenant, user } = useAuthStore();

  // Inputs State
  const [prompt, setPrompt] = React.useState(SAMPLE_PROMPTS[0].prompt);
  const [targetDays, setTargetDays] = React.useState(30);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState('00000000-0000-0000-0000-000000000010');
  const [workspaces, setWorkspaces] = React.useState<Array<{ id: string; name: string }>>([
    { id: '00000000-0000-0000-0000-000000000010', name: 'General Workspace' },
    { id: '00000000-0000-0000-0000-000000000011', name: 'Engineering Core' },
    { id: '00000000-0000-0000-0000-000000000012', name: 'Product & Design' }
  ]);
  const [selectedModel, setSelectedModel] = React.useState('gemini-2.5-flash');
  const [apiKey, setApiKey] = React.useState('');
  const [showKeyField, setShowKeyField] = React.useState(false);

  // Generation & Status State
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationStep, setGenerationStep] = React.useState('');
  const [plan, setPlan] = React.useState<StructuredProjectPlan | null>(null);
  const [tokenUsage, setTokenUsage] = React.useState<TokenUsageInfo | null>(null);

  // Editing State
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'phases' | 'roles_risks'>('tasks');
  const [expandedTasks, setExpandedTasks] = React.useState<Record<string, boolean>>({});
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = React.useState('');
  const [editTaskDesc, setEditTaskDesc] = React.useState('');
  const [editTaskHours, setEditTaskHours] = React.useState(4);
  const [editTaskPriority, setEditTaskPriority] = React.useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // Approval Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);
  const [isApproving, setIsApproving] = React.useState(false);

  // Fetch workspaces
  React.useEffect(() => {
    apiClient
      .get('/workspaces')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setWorkspaces(res.data.data);
          setSelectedWorkspaceId(res.data.data[0].id);
        }
      })
      .catch(() => {});
  }, [activeTenant?.id]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationStep('Analyzing natural language requirements...');

    try {
      setTimeout(() => setGenerationStep('Decomposing tech stack & architectural phases...'), 600);
      setTimeout(() => setGenerationStep('Synthesizing tasks, dependency graph & risk mitigations...'), 1200);

      const res = await apiClient.post('/ai-planner/generate?sync=true', {
        prompt: prompt.trim(),
        workspaceId: selectedWorkspaceId,
        targetDays,
        model: selectedModel,
        ...(apiKey.trim() && { apiKey: apiKey.trim() })
      });

      const data = res.data?.data;
      if (data?.result?.plan) {
        setPlan(data.result.plan);
        setTokenUsage(data.result.tokenUsage);
        playNotificationChime();
        toast('AI Plan Synthesized', `Generated plan for "${data.result.plan.projectOverview.name}".`, 'success');
      } else {
        toast('Notice', 'Plan generation returned no structured result.', 'error');
      }
    } catch (err: any) {
      toast('Generation Error', err.response?.data?.detail || 'Failed to generate plan with Gemini API.', 'error');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleApplySample = (sample: typeof SAMPLE_PROMPTS[0]) => {
    setPrompt(sample.prompt);
    setTargetDays(sample.days);
  };

  const toggleTaskExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditTask = (task: TaskPlanItem) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description);
    setEditTaskHours(task.estimatedHours);
    setEditTaskPriority(task.suggestedPriority);
  };

  const saveEditTask = () => {
    if (!plan || !editingTaskId) return;
    setPlan({
      ...plan,
      tasks: plan.tasks.map((t) =>
        t.id === editingTaskId
          ? {
              ...t,
              title: editTaskTitle.trim() || t.title,
              description: editTaskDesc.trim(),
              estimatedHours: Number(editTaskHours) || t.estimatedHours,
              suggestedPriority: editTaskPriority
            }
          : t
      )
    });
    setEditingTaskId(null);
    toast('Task Updated', 'Changes saved to interactive plan draft.', 'info');
  };

  const removeTask = (taskId: string) => {
    if (!plan) return;
    // Remove task and clean up any dependencies pointing to it
    setPlan({
      ...plan,
      tasks: plan.tasks
        .filter((t) => t.id !== taskId)
        .map((t) => ({
          ...t,
          dependencies: (t.dependencies || []).filter((dId) => dId !== taskId)
        })),
      dependencies: (plan.dependencies || []).filter(
        (d) => d.taskId !== taskId && d.dependsOnTaskId !== taskId
      )
    });
    toast('Task Removed', 'Task removed from plan draft.', 'info');
  };

  const addCustomTask = () => {
    if (!plan) return;
    const newId = `task-custom-${Date.now().toString(36)}`;
    const newTask: TaskPlanItem = {
      id: newId,
      phaseId: plan.phases[0]?.id || 'phase-1',
      milestoneId: plan.milestones[0]?.id || 'ms-1',
      title: 'Custom User Requirement Task',
      description: 'Defined during interactive plan review.',
      suggestedPriority: 'MEDIUM',
      estimatedHours: 4,
      assignedRole: 'Engineer',
      labels: ['Custom'],
      dependencies: [],
      subtasks: [{ id: `sub-${Date.now()}`, title: 'Implement specifications', estimatedHours: 4 }]
    };

    setPlan({
      ...plan,
      tasks: [...plan.tasks, newTask]
    });
    startEditTask(newTask);
  };

  const handleApprovePlan = async () => {
    if (!plan) return;
    setIsApproving(true);

    try {
      const payload = {
        workspaceId: selectedWorkspaceId,
        approvedPlan: {
          project: {
            name: plan.projectOverview.name,
            key: plan.projectOverview.key,
            description: plan.projectOverview.description,
            priority: 'HIGH' as const,
            startDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + plan.projectOverview.estimatedTotalDays * 86400000).toISOString()
          },
          milestones: plan.milestones.map((m, idx) => ({
            tempId: m.id,
            title: m.title,
            description: m.description,
            dueDate: new Date(Date.now() + m.targetDay * 86400000).toISOString()
          })),
          tasks: plan.tasks.map((t) => ({
            tempId: t.id,
            milestoneTempId: t.milestoneId,
            title: t.title,
            description: t.description,
            priority: t.suggestedPriority,
            estimatedHours: t.estimatedHours,
            labels: t.labels,
            dependencies: t.dependencies,
            subtasks: t.subtasks?.map((s) => ({ title: s.title }))
          }))
        }
      };

      const res = await apiClient.post('/ai-planner/approve', payload);
      playNotificationChime();
      toast('Plan Approved & Instantiated', `Project "${plan.projectOverview.name}" successfully created in PostgreSQL!`, 'success');
      setIsApproveModalOpen(false);

      const createdProjId = res.data?.data?.project?.id;
      if (createdProjId) {
        navigate(`/app/projects/${createdProjId}`);
      } else {
        navigate('/app/projects');
      }
    } catch (err: any) {
      toast('Approval Error', err.response?.data?.detail || 'Failed to instantiate project in database.', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const totalCalculatedHours = plan?.tasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0) || 0;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Project Planner
            </h1>
            <Badge variant="purple" className="text-xs font-semibold px-2">
              Gemini API
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
            Convert natural-language project descriptions into structured roadmaps, milestones, tasks, dependencies, and risk models. Review and edit before committing to production.
          </p>
        </div>

        {plan && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Re-generate
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsApproveModalOpen(true)}
              className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 cursor-pointer shadow-md shadow-purple-500/20"
            >
              <FileCheck2 className="w-3.5 h-3.5 mr-1.5" /> Approve & Save Plan
            </Button>
          </div>
        )}
      </div>

      {/* Input Form Card */}
      <Card className="border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Quick Prompts */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Quick Templates:
            </span>
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => handleApplySample(sample)}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-accent/30 hover:bg-accent hover:border-primary/40 text-foreground transition-colors cursor-pointer"
              >
                {sample.title}
              </button>
            ))}
          </div>

          {/* Textarea Input */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Describe Your Project Requirements
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create an e-commerce website using React, Node.js and PostgreSQL within 30 days."
                className="w-full rounded-xl border border-input bg-background/80 p-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-purple-500/50 resize-y"
                required
              />
            </div>

            {/* Config Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground">Target Workspace</label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id} className="bg-card text-foreground">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground">Target Timeline (Days)</label>
                <Input
                  type="number"
                  min={7}
                  max={365}
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value) || 30)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground">Gemini Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultrafast)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Architecture)</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full h-9 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold cursor-pointer shadow-md shadow-purple-500/20"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" /> Synthesizing Plan...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" /> Generate Project Plan
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Optional Custom API Key Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowKeyField(!showKeyField)}
                className="text-[11px] text-muted-foreground hover:text-purple-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>{showKeyField ? 'Hide custom Gemini API Key' : 'Configure custom Gemini API Key (Optional)'}</span>
              </button>

              {showKeyField && (
                <div className="mt-2 p-3 rounded-lg border border-border/70 bg-accent/20 space-y-1.5 max-w-md">
                  <label className="block text-[11px] font-medium text-foreground">
                    Google Gemini API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    If left blank, the server uses GEMINI_API_KEY from backend/.env or smart semantic synthesis.
                  </p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading Progress Feedback */}
      {isGenerating && (
        <Card className="border-purple-500/30 bg-purple-500/5 animate-in fade-in">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
              <BrainCircuit className="w-5 h-5 text-purple-400 absolute inset-0 m-auto" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">AI Architect is Reasoning</div>
              <div className="text-xs text-purple-400 font-mono mt-1">{generationStep}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Plan Preview Section */}
      {plan && !isGenerating && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Plan Overview Hero Card */}
          <Card className="border-border bg-gradient-to-br from-card via-card to-purple-950/20 shadow-md">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold text-foreground">
                      {plan.projectOverview.name}
                    </CardTitle>
                    <Badge variant="purple" className="font-mono text-xs font-bold">
                      {plan.projectOverview.key}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1 max-w-3xl">
                    {plan.projectOverview.description}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 self-start shrink-0">
                  <Badge variant="outline" className="text-xs">
                    Target: {plan.projectOverview.estimatedTotalDays} Days
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    Budget Tier: {plan.projectOverview.suggestedBudgetTier}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Tech Stack Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Tech Stack:</span>
                {plan.projectOverview.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-[11px] font-mono">
                    {tech}
                  </Badge>
                ))}
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg border border-border bg-accent/30">
                  <div className="text-[11px] text-muted-foreground">Total Phases</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">{plan.phases.length}</div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-accent/30">
                  <div className="text-[11px] text-muted-foreground">Milestones</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">{plan.milestones.length}</div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-accent/30">
                  <div className="text-[11px] text-muted-foreground">Tasks Planned</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">{plan.tasks.length}</div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-accent/30">
                  <div className="text-[11px] text-muted-foreground">Estimated Work Hours</div>
                  <div className="text-lg font-bold text-purple-400 mt-0.5">{totalCalculatedHours}h</div>
                </div>
              </div>

              {/* Telemetry Footer */}
              {tokenUsage && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50 font-mono">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Model: <strong className="text-foreground">{tokenUsage.model}</strong>
                  </span>
                  <span>Latency: <strong className="text-foreground">{tokenUsage.latencyMs}ms</strong></span>
                  <span>Prompt: {tokenUsage.promptTokens} | Completion: {tokenUsage.completionTokens} | Total: <strong className="text-foreground">{tokenUsage.totalTokens} tokens</strong></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Generated Tasks & Subtasks ({plan.tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('phases')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'phases'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Phases & Milestones Roadmap ({plan.milestones.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roles_risks')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'roles_risks'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Team Roles ({plan.teamRoles.length}) & Risks ({plan.risks.length})
              </button>
            </div>

            {activeTab === 'tasks' && (
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomTask}
                className="text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Task
              </Button>
            )}
          </div>

          {/* TAB 1: Tasks Review & Interactive Editor */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {plan.tasks.map((task, idx) => {
                const isExpanded = !!expandedTasks[task.id];
                const isEditing = editingTaskId === task.id;
                const assignedMilestone = plan.milestones.find((m) => m.id === task.milestoneId);

                return (
                  <Card
                    key={task.id}
                    className="border-border hover:border-border/90 transition-all bg-card/70"
                  >
                    <div className="p-4 flex flex-col gap-3">
                      {/* Top Task Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center font-mono text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">
                            {idx + 1}
                          </span>

                          <div className="space-y-1 flex-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input
                                  value={editTaskTitle}
                                  onChange={(e) => setEditTaskTitle(e.target.value)}
                                  className="text-sm font-semibold h-9"
                                  placeholder="Task title"
                                  autoFocus
                                />
                                <textarea
                                  rows={2}
                                  value={editTaskDesc}
                                  onChange={(e) => setEditTaskDesc(e.target.value)}
                                  className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                                  placeholder="Task description"
                                />
                                <div className="grid grid-cols-2 gap-2 pt-1 max-w-sm">
                                  <div>
                                    <label className="text-[10px] text-muted-foreground">Priority</label>
                                    <select
                                      value={editTaskPriority}
                                      onChange={(e) => setEditTaskPriority(e.target.value as any)}
                                      className="w-full h-8 text-xs rounded-md border border-input bg-card px-2 text-foreground"
                                    >
                                      <option value="LOW">Low</option>
                                      <option value="MEDIUM">Medium</option>
                                      <option value="HIGH">High</option>
                                      <option value="URGENT">Urgent</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-muted-foreground">Estimated Hours</label>
                                    <Input
                                      type="number"
                                      value={editTaskHours}
                                      onChange={(e) => setEditTaskHours(Number(e.target.value))}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Button size="sm" onClick={saveEditTask} className="text-xs h-7">
                                    <Check className="w-3 h-3 mr-1" /> Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingTaskId(null)}
                                    className="text-xs h-7"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-semibold text-foreground">
                                    {task.title}
                                  </h3>
                                  <Badge
                                    variant={
                                      task.suggestedPriority === 'URGENT'
                                        ? 'destructive'
                                        : task.suggestedPriority === 'HIGH'
                                        ? 'warning'
                                        : 'outline'
                                    }
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {task.suggestedPriority}
                                  </Badge>
                                  {assignedMilestone && (
                                    <Badge variant="cyan" className="text-[10px] px-1.5 py-0">
                                      {assignedMilestone.title}
                                    </Badge>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-mono font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                              {task.estimatedHours}h
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditTask(task)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTask(task.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Remove Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            {task.subtasks && task.subtasks.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleTaskExpand(task.id)}
                                className="h-7 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-md hover:bg-accent"
                              >
                                <span>{task.subtasks.length} Subtasks</span>
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dependencies and Labels Bar */}
                      {!isEditing && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-muted-foreground">Role: <strong className="text-foreground">{task.assignedRole}</strong></span>
                            {task.labels && task.labels.length > 0 && (
                              <span className="flex items-center gap-1 ml-2">
                                {task.labels.map((l) => (
                                  <span key={l} className="px-1.5 py-0.5 rounded bg-accent/60 text-[10px]">
                                    #{l}
                                  </span>
                                ))}
                              </span>
                            )}
                          </div>

                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <GitBranch className="w-3 h-3" />
                              <span>Depends on {task.dependencies.length} prerequisite task(s)</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expanded Subtasks */}
                      {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 pl-9 pr-2 py-2 rounded-lg bg-accent/20 border border-border/50 space-y-1.5 animate-in fade-in">
                          <div className="text-[11px] font-semibold text-muted-foreground">Subtask Checklist:</div>
                          {task.subtasks.map((sub, sIdx) => (
                            <div key={sub.id || sIdx} className="flex items-center justify-between text-xs text-foreground py-0.5">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                <span>{sub.title}</span>
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">{sub.estimatedHours}h</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* TAB 2: Phases & Milestones Roadmap */}
          {activeTab === 'phases' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.phases.map((phase, pIdx) => (
                  <Card key={phase.id} className="border-border bg-card/70">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-purple-400">Phase {pIdx + 1}</span>
                        <Badge variant="outline" className="text-xs">{phase.durationDays} Days</Badge>
                      </div>
                      <CardTitle className="text-base text-foreground mt-1">{phase.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="font-semibold text-muted-foreground">Phase Objectives:</div>
                      <ul className="space-y-1 text-muted-foreground pl-4 list-disc">
                        {phase.goals.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Planned Milestones Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.milestones.map((ms) => (
                    <Card key={ms.id} className="border-border/80 bg-accent/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{ms.title}</span>
                          <Badge variant="cyan" className="text-[10px]">Day {ms.targetDay}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{ms.description}</p>
                        {ms.deliverables && ms.deliverables.length > 0 && (
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                            {ms.deliverables.map((deliv, dIdx) => (
                              <span key={dIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-accent border border-border text-foreground">
                                ✓ {deliv}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Team Roles & Risks */}
          {activeTab === 'roles_risks' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Roles */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Recommended Team Roles
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Target headcount & specialization based on prompt tech stack.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.teamRoles.map((role, rIdx) => (
                    <div key={rIdx} className="p-3 rounded-lg border border-border bg-accent/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{role.role}</span>
                        <Badge variant="outline" className="text-[11px]">{role.count} Person(s)</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {role.responsibilities.join(' • ')}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risks */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Potential Project Risks & Mitigations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Identified bottlenecks and suggested risk-prevention strategies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.risks.map((risk, rIdx) => (
                    <div key={rIdx} className="p-3 rounded-lg border border-border bg-accent/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{risk.category} Risk</span>
                        <Badge
                          variant={risk.severity === 'CRITICAL' || risk.severity === 'HIGH' ? 'destructive' : 'warning'}
                          className="text-[10px]"
                        >
                          {risk.severity} Severity
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/90">{risk.risk}</p>
                      <div className="p-2 rounded bg-background/60 border border-border/50 text-[11px] text-emerald-400">
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bottom Approval Callout */}
          <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                Human-in-the-Loop Safeguard Active
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI outputs remain in preview draft mode until you approve. Clicking approve will create the production project and all {plan.tasks.length} tasks in PostgreSQL.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsApproveModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold cursor-pointer shrink-0"
            >
              <FileCheck2 className="w-4 h-4 mr-1.5" /> Approve & Save Plan
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Plan Approval */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve & Instantiate AI Project Plan"
        description="Verify project settings before committing tasks and milestones into PostgreSQL database."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-accent/30 border border-border space-y-1 text-xs">
            <div><strong>Project Name:</strong> {plan?.projectOverview.name}</div>
            <div><strong>Project Key:</strong> <span className="font-mono text-purple-400">{plan?.projectOverview.key}</span></div>
            <div><strong>Target Workspace:</strong> {workspaces.find((w) => w.id === selectedWorkspaceId)?.name}</div>
            <div><strong>Tasks to Instantiate:</strong> {plan?.tasks.length} tasks with subtasks & dependency graph</div>
            <div><strong>Milestones:</strong> {plan?.milestones.length} milestones</div>
          </div>

          <p className="text-xs text-muted-foreground">
            Once approved, all tasks will be provisioned in the production project and visible immediately in the Kanban Board, List View, and Calendar.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveModalOpen(false)}
              disabled={isApproving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprovePlan}
              disabled={isApproving}
              className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 cursor-pointer"
            >
              {isApproving ? 'Saving to Database...' : 'Confirm & Create Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
