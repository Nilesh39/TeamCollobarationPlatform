import { TenantRole } from './auth.types';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate: boolean;
}

export interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: TenantRole;
  workspaces: Workspace[];
  _count?: {
    memberships: number;
    workspaces: number;
    projects: number;
  };
}
