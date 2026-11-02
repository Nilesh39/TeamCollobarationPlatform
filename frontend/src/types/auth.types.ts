export type TenantRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'GUEST';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
  isSuperAdmin?: boolean;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
  plan?: string;
  settings?: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  tenantId?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  lastActiveAt: number;
  isCurrent?: boolean;
}

export interface AuthState {
  user: User | null;
  activeTenant: TenantSummary | null;
  availableTenants: TenantSummary[];
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (payload: {
    user: User;
    activeTenant?: TenantSummary | null;
    availableTenants?: TenantSummary[];
    accessToken: string;
  }) => void;
  setActiveTenant: (tenant: TenantSummary) => void;
  setAvailableTenants: (tenants: TenantSummary[]) => void;
  clearAuth: () => void;
}
