import { createTenantPrismaClient } from '../../infrastructure/database/tenant-prisma';
import { NotFoundError } from '../../core/errors/AppError';
import { CreateAgentInput, UpdateAgentInput } from './agent.validation';

export class AgentService {
  async getAgents(tenantId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    return tenantPrisma.aiAgent.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAgentById(tenantId: string, agentId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    const agent = await tenantPrisma.aiAgent.findFirst({
      where: { id: agentId }
    });

    if (!agent) {
      throw new NotFoundError('AI Agent not found or unauthorized.');
    }

    return agent;
  }

  async createAgent(tenantId: string, input: CreateAgentInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);

    return tenantPrisma.aiAgent.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        modelName: input.modelName,
        systemPrompt: input.systemPrompt,
        temperature: input.temperature,
        allowedTools: input.allowedTools,
        isActive: true
      }
    });
  }

  async updateAgent(tenantId: string, agentId: string, input: UpdateAgentInput) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getAgentById(tenantId, agentId);

    return tenantPrisma.aiAgent.update({
      where: { id: agentId },
      data: input
    });
  }

  async deleteAgent(tenantId: string, agentId: string) {
    const tenantPrisma = createTenantPrismaClient(tenantId);
    await this.getAgentById(tenantId, agentId);

    await tenantPrisma.aiAgent.delete({
      where: { id: agentId }
    });

    return { id: agentId, deleted: true };
  }
}

export const agentService = new AgentService();
