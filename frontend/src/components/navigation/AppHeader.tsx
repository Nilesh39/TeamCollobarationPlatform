import * as React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useThemeStore } from '../../app/store/useThemeStore';
import { useNotificationStore } from '../../app/store/useNotificationStore';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from '../ui/toast';
import { apiClient } from '../../lib/apiClient';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export function AppHeader({ onOpenMobileMenu, onOpenSearch }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeTenant, availableTenants, setActiveTenant, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, triggerDemoNotification } = useNotificationStore();

  const [tenantDropdown, setTenantDropdown] = React.useState(false);
  const [userDropdown, setUserDropdown] = React.useState(false);
  const [notifDropdown, setNotifDropdown] = React.useState(false);

  // Derive breadcrumb path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 1 ? pathParts[pathParts.length - 1].replace(/-/g, ' ') : 'Dashboard';

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors
    } finally {
      clearAuth();
      toast('Signed Out', 'You have been safely logged out.');
      navigate('/login');
    }
  };

  const handleSwitchTenant = async (t: any) => {
    try {
      const res = await apiClient.post('/auth/switch-tenant', { tenantId: t.id });
      const { activeTenant: newActiveTenant, accessToken } = res.data.data;
      useAuthStore.getState().setAuth({
        user: user!,
        activeTenant: newActiveTenant,
        availableTenants,
        accessToken
      });
      toast('Organization Switched', `Active organization changed to ${newActiveTenant.name}.`);
    } catch {
      setActiveTenant(t);
      toast('Organization Switched', `Active organization changed to ${t.name}.`);
    } finally {
      setTenantDropdown(false);
    }
  };

  return (
    <header className="h-14 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden h-8 w-8 text-muted-foreground"
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 text-xs">
          <Link to="/app" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
            AI WORK OS
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="capitalize font-semibold text-foreground">{breadcrumb}</span>
        </div>
      </div>

      {/* Center: Global Search Bar trigger */}
      <div className="hidden sm:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border/80 bg-accent/30 hover:bg-accent/60 text-xs text-muted-foreground transition-all cursor-pointer shadow-xs"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground/80" />
            <span>Search tasks, projects, docs or prompt AI...</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Theme, Tenant, User */}
      <div className="flex items-center gap-2.5">
        {/* Search icon for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSearch}
          className="sm:hidden h-8 w-8 text-muted-foreground"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Theme Switcher Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            toggleTheme();
            toast('Theme Updated', `Switched to ${theme === 'dark' ? 'Light' : 'Dark'} mode.`);
          }}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
        </Button>

        {/* Notifications Icon Button & Live Real-Time Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setNotifDropdown(!notifDropdown);
              setTenantDropdown(false);
              setUserDropdown(false);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {notifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Real-Time Alerts</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerDemoNotification()}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                    title="Simulate incoming real-time alert"
                  >
                    Test Alert
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 divide-y divide-border/40">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      setNotifDropdown(false);
                      navigate('/app/notifications');
                    }}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer hover:bg-accent/60 transition-colors ${
                      !n.isRead ? 'bg-accent/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-foreground text-xs line-clamp-1">{n.title}</div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No active notifications
                  </div>
                )}
              </div>

              <div className="pt-1.5 border-t border-border/60 text-center">
                <Link
                  to="/app/notifications"
                  onClick={() => setNotifDropdown(false)}
                  className="text-xs text-primary font-medium hover:underline inline-block py-1"
                >
                  View all notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Tenant Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setTenantDropdown(!tenantDropdown);
              setUserDropdown(false);
            }}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/80 bg-accent/30 hover:bg-accent/70 text-xs text-foreground transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium max-w-[110px] truncate">{activeTenant?.name || 'Acme Corp'}</span>
            <Badge variant="purple" className="text-[10px] px-1.5 py-0">
              {activeTenant?.role || 'OWNER'}
            </Badge>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {tenantDropdown && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                Organizations & Workspaces
              </div>
              {availableTenants.map((t) => {
                const isSelected = t.id === activeTenant?.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSwitchTenant(t)}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="truncate">
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{t.slug}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Avatar Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdown(!userDropdown);
              setTenantDropdown(false);
            }}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center font-bold text-xs text-primary-foreground shadow-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </button>

          {userDropdown && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border/80">
                <div className="font-semibold text-xs text-foreground truncate">{user?.fullName || 'Alice Walker'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user?.email || 'owner@acme.com'}</div>
              </div>

              <div className="py-1">
                <Link
                  to="/app/profile"
                  onClick={() => setUserDropdown(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Profile & Account
                </Link>
                <Link
                  to="/app/settings"
                  onClick={() => setUserDropdown(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-muted-foreground" /> Organization Settings
                </Link>
              </div>

              <div className="pt-1 border-t border-border/80">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
