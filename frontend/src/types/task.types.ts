export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'BACKLOG'
  | 'DONE'
  | 'CANCELED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface TaskAssigneeUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: TaskAssigneeUser;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: TaskAssigneeUser;
}

export interface TaskAttachment {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface TaskSubtask {
  id: string;
  taskNumber?: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  orderIndex?: number;
}

export interface TaskDependencyItem {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: string;
  dependsOnTask: {
    id: string;
    taskNumber: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
}

export interface TaskBlockedByItem {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: string;
  task: {
    id: string;
    taskNumber: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
}

export interface TaskActivityItem {
  id: string;
  action: string;
  changes: any;
  createdAt: string;
  actor: TaskAssigneeUser;
}

export interface TaskItem {
  id: string;
  tenantId: string;
  projectId: string;
  parentTaskId?: string | null;
  taskNumber: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  orderIndex: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    key: string;
  };
  assignees: TaskAssignee[];
  labels: TaskLabel[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  subtasks?: TaskSubtask[];
  dependencies?: TaskDependencyItem[];
  blockedBy?: TaskBlockedByItem[];
  activities?: TaskActivityItem[];
  _count?: {
    comments: number;
    subtasks: number;
    dependencies: number;
    blockedBy: number;
    attachments: number;
  };
}
