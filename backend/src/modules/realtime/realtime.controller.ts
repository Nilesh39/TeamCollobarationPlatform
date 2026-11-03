import { Request, Response } from 'express';
import { realTimeBus, RealTimeEvents } from '../../infrastructure/realtime/realtime.emitter';
import { sendSuccess } from '../../utils/response.util';

export class RealtimeController {
  /**
   * Server-Sent Events (SSE) stream endpoint for live real-time notifications
   * Accessible by frontend EventSource or HTTP streaming client
   */
  streamEvents(req: Request, res: Response): void {
    const tenantId = (req.query.tenantId as string) || req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000001';

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    // Send initial connection packet
    const welcomeData = JSON.stringify({
      type: 'connected',
      message: 'AI WORK OS Real-Time Event Stream connected successfully.',
      tenantId,
      timestamp: new Date().toISOString()
    });
    res.write(`event: connected\ndata: ${welcomeData}\n\n`);

    // Broadcast listener for tenant-scoped events
    const tenantEventListener = (payload: any) => {
      try {
        const eventName = payload.event || 'notification';
        res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
      } catch {
        // Stream may have closed
      }
    };

    // Global listener for system notifications
    const globalNotificationListener = (payload: any) => {
      try {
        res.write(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`);
      } catch {
        // Stream may have closed
      }
    };

    realTimeBus.on(`tenant:${tenantId}`, tenantEventListener);
    realTimeBus.on(RealTimeEvents.NOTIFICATION, globalNotificationListener);

    // Keep-alive heartbeat every 20 seconds
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`: ping ${new Date().toISOString()}\n\n`);
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 20000);

    // Cleanup listeners when client disconnects
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      realTimeBus.off(`tenant:${tenantId}`, tenantEventListener);
      realTimeBus.off(RealTimeEvents.NOTIFICATION, globalNotificationListener);
    });
  }

  /**
   * Triggers a test real-time notification across active sessions
   */
  triggerTestNotification(req: Request, res: Response): void {
    const tenantId = (req.query.tenantId as string) || req.body.tenantId || '00000000-0000-0000-0000-000000000001';
    const title = req.body.title || 'AI Task Optimization Finished';
    const message = req.body.message || 'Task priority adjusted automatically based on dependency graph analysis.';
    const type = req.body.type || 'SYSTEM';

    const payload = {
      tenantId,
      actorId: 'system',
      event: RealTimeEvents.NOTIFICATION,
      data: {
        id: `notif-${Date.now()}`,
        title,
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false
      },
      timestamp: new Date().toISOString()
    };

    realTimeBus.broadcast(RealTimeEvents.NOTIFICATION, {
      tenantId,
      actorId: 'system',
      data: payload.data
    });

    sendSuccess(res, payload.data, 'Real-time test notification broadcasted successfully.');
  }
}

export const realtimeController = new RealtimeController();
