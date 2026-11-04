import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { tenantRoutes } from '../modules/tenants/tenant.routes';
import { workspaceRoutes } from '../modules/workspaces/workspace.routes';
import { projectRoutes } from '../modules/projects/project.routes';
import { taskRoutes } from '../modules/tasks/task.routes';
import { documentRoutes } from '../modules/documents/document.routes';
import { agentRoutes } from '../modules/agents/agent.routes';
import { realtimeRoutes } from '../modules/realtime/realtime.routes';
import { aiPlannerRoutes } from '../modules/ai-planner/ai-planner.routes';

const v1Router = Router();

// Service Health & Telemetry
v1Router.use('/health', healthRoutes);

// Identity & Session Authentication
v1Router.use('/auth', authRoutes);

// Multi-Tenant Organizations
v1Router.use('/tenants', tenantRoutes);

// Workspaces Partitioning
v1Router.use('/workspaces', workspaceRoutes);

// Projects & Keys
v1Router.use('/projects', projectRoutes);

// Tasks & Collaboration
v1Router.use('/tasks', taskRoutes);

// Knowledge Base & RAG Documents
v1Router.use('/documents', documentRoutes);

// AI Agents & Autonomous Tooling
v1Router.use('/agents', agentRoutes);

// Real-Time Notification Stream & Broadcast
v1Router.use('/realtime', realtimeRoutes);

// AI Project Planner (Google Gemini API & Structured Decomposition)
v1Router.use('/ai-planner', aiPlannerRoutes);

export { v1Router };
