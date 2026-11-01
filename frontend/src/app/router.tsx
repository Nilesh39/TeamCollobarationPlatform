import * as React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { MainDashboardPage } from '../pages/MainDashboardPage';
import { WorkspaceDashboardPage } from '../pages/WorkspaceDashboardPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectDetailsPage } from '../pages/ProjectDetailsPage';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';
import { CalendarPage } from '../pages/CalendarPage';
import { TeamMembersPage } from '../pages/TeamMembersPage';
import { AiAssistantPage } from '../pages/AiAssistantPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { MeetingsPage } from '../pages/MeetingsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UserProfilePage } from '../pages/UserProfilePage';

export const router = createBrowserRouter([
  // Public Landing & Marketing
  {
    path: '/',
    element: <LandingPage />
  },
  // Authentication Routes
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
  // Authenticated Application Shell
  {
    path: '/app',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <MainDashboardPage />
      },
      {
        path: 'workspace',
        element: <WorkspaceDashboardPage />
      },
      {
        path: 'projects',
        element: <ProjectsPage />
      },
      {
        path: 'projects/:id',
        element: <ProjectDetailsPage />
      },
      {
        path: 'kanban',
        element: <KanbanBoardPage />
      },
      {
        path: 'calendar',
        element: <CalendarPage />
      },
      {
        path: 'team',
        element: <TeamMembersPage />
      },
      {
        path: 'ai-assistant',
        element: <AiAssistantPage />
      },
      {
        path: 'documents',
        element: <DocumentsPage />
      },
      {
        path: 'meetings',
        element: <MeetingsPage />
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />
      },
      {
        path: 'notifications',
        element: <NotificationsPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'profile',
        element: <UserProfilePage />
      }
    ]
  },
  // Catch-all 404
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
