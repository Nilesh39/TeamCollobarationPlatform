export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
}

export type TenantRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
  plan?: string;
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
  clearAuth: () => void;
}
