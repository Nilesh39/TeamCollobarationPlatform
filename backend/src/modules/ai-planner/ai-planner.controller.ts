import { Request, Response, NextFunction } from 'express';
import { aiPlannerService } from './ai-planner.service';
import { sendSuccess } from '../../utils/response.util';
import { GeneratePlanInput, ApprovePlanInput } from './ai-planner.validation';

export class AiPlannerController {
  /**
   * Initiates AI project plan generation
   * Supports background processing (202 Accepted) and sync mode (?sync=true)
   */
  async generatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;
      const isSync = req.query.sync === 'true';

      const job = await aiPlannerService.startGeneration(
        tenantId,
        actorId,
        req.body as GeneratePlanInput,
        isSync
      );

      if (isSync || job.status === 'COMPLETED') {
        sendSuccess(res, job, 'AI Project plan synthesized successfully.', 200);
      } else {
        res.status(202).json({
          success: true,
          statusCode: 202,
          message: 'AI Project plan generation enqueued in background.',
          data: {
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            createdAt: job.createdAt
          },
          meta: { timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves status and structured output of a background plan generation job
   */
  async getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const { jobId } = req.params;

      const job = aiPlannerService.getJobStatus(tenantId, jobId);
      sendSuccess(res, job, 'Job status retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approves and commits an edited AI plan into PostgreSQL
   */
  async approvePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const actorId = req.user!.userId;

      const result = await aiPlannerService.approveAndPersistPlan(
        tenantId,
        actorId,
        req.body as ApprovePlanInput
      );

      sendSuccess(res, result, 'Approved AI plan instantiated as production project.', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const aiPlannerController = new AiPlannerController();
