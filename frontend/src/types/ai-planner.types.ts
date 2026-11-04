export interface SubtaskPlanItem {
  id: string;
  title: string;
  estimatedHours: number;
}

export interface TaskPlanItem {
  id: string;
  phaseId: string;
  milestoneId?: string;
  title: string;
  description: string;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours: number;
  assignedRole: string;
  labels: string[];
  dependencies: string[];
  subtasks: SubtaskPlanItem[];
}

export interface PhasePlanItem {
  id: string;
  name: string;
  orderIndex: number;
  durationDays: number;
  goals: string[];
}

export interface MilestonePlanItem {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  targetDay: number;
  deliverables: string[];
}

export interface DependencyRelation {
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'FINISH_TO_START' | 'START_TO_START';
}

export interface TeamRoleItem {
  role: string;
  count: number;
  responsibilities: string[];
}

export interface RiskItem {
  category: 'TECHNICAL' | 'TIMELINE' | 'SECURITY' | 'RESOURCE';
  risk: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation: string;
}

export interface ProjectOverviewPlan {
  name: string;
  key: string;
  description: string;
  targetAudience: string;
  techStack: string[];
  estimatedTotalDays: number;
  suggestedBudgetTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE';
}

export interface StructuredProjectPlan {
  projectOverview: ProjectOverviewPlan;
  phases: PhasePlanItem[];
  milestones: MilestonePlanItem[];
  tasks: TaskPlanItem[];
  dependencies: DependencyRelation[];
  teamRoles: TeamRoleItem[];
  risks: RiskItem[];
}

export interface TokenUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  latencyMs: number;
  isSimulated: boolean;
}

export interface GenerationJobResponse {
  jobId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  result?: {
    plan: StructuredProjectPlan;
    tokenUsage: TokenUsageInfo;
  };
  error?: string;
}
