import { EventEmitter } from 'events';

export enum RealTimeEvents {
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_MOVED = 'task:moved',
  TASK_DELETED = 'task:deleted',
  TASK_COMMENT_ADDED = 'task:comment_added',
  TASK_DEPENDENCY_UPDATED = 'task:dependency_updated'
}

export interface RealTimePayload<T = any> {
  tenantId: string;
  projectId?: string;
  taskId?: string;
  actorId?: string;
  event: RealTimeEvents;
  data: T;
  timestamp: string;
}

class RealTimeBus extends EventEmitter {
  broadcast<T = any>(event: RealTimeEvents, payload: Omit<RealTimePayload<T>, 'event' | 'timestamp'>): void {
    const fullPayload: RealTimePayload<T> = {
      ...payload,
      event,
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[RealTime] Broadcast ${event} on tenant ${payload.tenantId}`, {
        taskId: payload.taskId,
        projectId: payload.projectId
      });
    }

    this.emit(event, fullPayload);
    this.emit(`tenant:${payload.tenantId}`, fullPayload);
    if (payload.projectId) {
      this.emit(`project:${payload.projectId}`, fullPayload);
    }
  }
}

export const realTimeBus = new RealTimeBus();
