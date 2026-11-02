export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MilestoneStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProjectManagerSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProjectMemberItem {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface MilestoneItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: MilestoneStatus;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectActivityItem {
  id: string;
  action: string;
  details: Record<string, any>;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface ProjectListItem {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string | null;
  dueDate?: string | null;
  isArchived: boolean;
  progress: number;
  managerId?: string | null;
  workspace: WorkspaceSummary;
  manager?: ProjectManagerSummary | null;
  membersCount: number;
  members: Array<{
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  }>;
  metrics: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    milestonesCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailItem extends ProjectListItem {
  members: any[];
  milestones: MilestoneItem[];
  tasks: any[];
  activities: ProjectActivityItem[];
}
