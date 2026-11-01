import { TenantRole } from '@prisma/client';

export { TenantRole };

export enum Permission {
  // Tenant Permissions
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',
  TENANT_BILLING = 'tenant:billing',

  // Member Management
  MEMBER_INVITE = 'member:invite',
  MEMBER_UPDATE_ROLE = 'member:update_role',
  MEMBER_REMOVE = 'member:remove',

  // Workspace Permissions
  WORKSPACE_CREATE = 'workspace:create',
  WORKSPACE_UPDATE = 'workspace:update',
  WORKSPACE_DELETE = 'workspace:delete',

  // Project & Task Permissions
  PROJECT_CREATE = 'project:create',
  PROJECT_DELETE = 'project:delete',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',

  // AI & RAG Permissions
  AI_AGENT_MANAGE = 'ai_agent:manage',
  RAG_DOCUMENT_UPLOAD = 'rag_document:upload',
  RAG_DOCUMENT_QUERY = 'rag_document:query'
}

export const ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  [TenantRole.OWNER]: Object.values(Permission),
  [TenantRole.ADMIN]: [
    Permission.MEMBER_INVITE,
    Permission.MEMBER_UPDATE_ROLE,
    Permission.MEMBER_REMOVE,
    Permission.WORKSPACE_CREATE,
    Permission.WORKSPACE_UPDATE,
    Permission.WORKSPACE_DELETE,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_DELETE,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.AI_AGENT_MANAGE,
    Permission.RAG_DOCUMENT_UPLOAD,
    Permission.RAG_DOCUMENT_QUERY
  ],
  [TenantRole.MEMBER]: [
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.RAG_DOCUMENT_UPLOAD,
    Permission.RAG_DOCUMENT_QUERY
  ],
  [TenantRole.GUEST]: [
    Permission.RAG_DOCUMENT_QUERY
  ]
};
