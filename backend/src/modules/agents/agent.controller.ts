import { Request, Response, NextFunction } from 'express';
import { agentService } from './agent.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

export class AgentController {
  async getAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const agents = await agentService.getAgents(tenantId);
      sendSuccess(res, agents, 'AI Agents retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getAgentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const agent = await agentService.getAgentById(tenantId, id);
      sendSuccess(res, agent, 'AI Agent details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const agent = await agentService.createAgent(tenantId, req.body);
      sendCreated(res, agent, 'AI Agent provisioned successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const updated = await agentService.updateAgent(tenantId, id, req.body);
      sendSuccess(res, updated, 'AI Agent updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { id } = req.params;
      const result = await agentService.deleteAgent(tenantId, id);
      sendSuccess(res, result, 'AI Agent deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const agentController = new AgentController();
