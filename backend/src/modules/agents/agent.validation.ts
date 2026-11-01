import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(2, 'Agent name is required').max(100),
  description: z.string().max(500).optional(),
  modelName: z.enum(['gemini-1.5-pro', 'gemini-1.5-flash']).default('gemini-1.5-pro'),
  systemPrompt: z.string().min(10, 'System prompt must be at least 10 characters'),
  temperature: z.number().min(0.0).max(1.0).default(0.2),
  allowedTools: z.array(z.string()).default([])
});

export const updateAgentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  modelName: z.enum(['gemini-1.5-pro', 'gemini-1.5-flash']).optional(),
  systemPrompt: z.string().min(10).optional(),
  temperature: z.number().min(0.0).max(1.0).optional(),
  allowedTools: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
