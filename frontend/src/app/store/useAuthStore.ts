import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, TenantSummary, User } from '../../types/auth.types';

const DEFAULT_USER: User = {
  id: '00000000-0000-0000-0000-000000000003',
  email: 'owner@acme.com',
  fullName: 'Alice Walker (Owner)',
  avatarUrl: null,
  isEmailVerified: true,
  isSuperAdmin: true
};

const DEFAULT_TENANT: TenantSummary = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Acme Corporation',
  slug: 'acme-corp',
  role: 'OWNER'
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DEFAULT_USER,
      activeTenant: DEFAULT_TENANT,
      availableTenants: [
        DEFAULT_TENANT,
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'AI Research Lab',
          slug: 'ai-lab',
          role: 'ADMIN'
        }
      ],
      accessToken: 'demo-jwt-token-xyz',
      isAuthenticated: true,
      isLoading: false,

      setAuth: ({ user, activeTenant, availableTenants, accessToken }) =>
        set({
          user,
          activeTenant: activeTenant || (availableTenants && availableTenants[0]) || null,
          availableTenants: availableTenants || [],
          accessToken,
          isAuthenticated: true,
          isLoading: false
        }),

      setActiveTenant: (tenant: TenantSummary) =>
        set({
          activeTenant: tenant
        }),

      setAvailableTenants: (tenants: TenantSummary[]) =>
        set({
          availableTenants: tenants
        }),

      clearAuth: () =>
        set({
          user: null,
          activeTenant: null,
          availableTenants: [],
          accessToken: null,
          isAuthenticated: false,
          isLoading: false
        })
    }),
    {
      name: 'ai_work_os_auth_session'
    }
  )
);
