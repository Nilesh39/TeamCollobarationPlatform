import { create } from 'zustand';
import type { AuthState, TenantSummary } from '../../types/auth.types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeTenant: null,
  availableTenants: [],
  accessToken: null,
  isAuthenticated: false,
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
}));
