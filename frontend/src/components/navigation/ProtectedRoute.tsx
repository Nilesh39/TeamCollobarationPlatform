import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import { TenantRole } from '../../types/auth.types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: TenantRole[];
  requireEmailVerified?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireEmailVerified = false
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user, activeTenant } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireEmailVerified && user.isEmailVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = activeTenant?.role;
    const isSuperAdmin = user.isSuperAdmin || userRole === 'SUPER_ADMIN';

    if (!isSuperAdmin && (!userRole || !allowedRoles.includes(userRole))) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Access Restricted</h3>
            <p className="text-sm text-muted-foreground">
              Your role <span className="font-semibold text-foreground">({userRole || 'Member'})</span> does not have permission to access this area.
              Required roles: {allowedRoles.join(', ')}.
            </p>
            <div className="pt-2">
              <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
