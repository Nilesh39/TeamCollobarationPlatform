import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../navigation/AppSidebar';
import { AppHeader } from '../navigation/AppHeader';
import { CommandPalette } from '../navigation/CommandPalette';
import { CreateTaskModal } from '../modals/CreateTaskModal';
import { ToastContainer } from '../ui/toast';

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenQuickTask={() => setIsNewTaskOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet context={{ onOpenNewTask: () => setIsNewTaskOpen(true) }} />
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
      />

      <CreateTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
