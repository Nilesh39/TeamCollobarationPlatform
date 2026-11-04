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
import { AiProjectPlannerPage } from '../pages/AiProjectPlannerPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { MeetingsPage } from '../pages/MeetingsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ProtectedRoute } from '../components/navigation/ProtectedRoute';

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
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />
  },
  // Authenticated Application Shell
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
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
        path: 'ai-planner',
        element: <AiProjectPlannerPage />
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
