import { Router } from 'express';
import { realtimeController } from './realtime.controller';

const router = Router();

// Stream SSE events
router.get('/stream', (req, res) => realtimeController.streamEvents(req, res));

// Trigger test notification
router.post('/trigger-test', (req, res) => realtimeController.triggerTestNotification(req, res));

export { router as realtimeRoutes };
