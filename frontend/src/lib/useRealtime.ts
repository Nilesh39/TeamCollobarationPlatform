import * as React from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { toast } from '../components/ui/toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export function useRealtime() {
  const { activeTenant, accessToken } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const tenantId = activeTenant?.id || '00000000-0000-0000-0000-000000000001';
    const streamUrl = `${API_BASE}/realtime/stream?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(
      accessToken || 'demo'
    )}`;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        // Listen for system connected handshake
        eventSource.addEventListener('connected', () => {
          setIsConnected(true);
        });

        // Listen for notifications
        eventSource.addEventListener('notification', (e) => {
          try {
            const parsed = JSON.parse(e.data);
            const payload = parsed.data || parsed;
            addNotification({
              title: payload.title || 'Team Notification',
              description: payload.message || payload.description || 'New collaborative activity',
              type: (payload.type?.toLowerCase() as any) || 'system'
            });
            toast(payload.title || 'Notification', payload.message || payload.description || '', 'info');
          } catch {
            // ignore JSON parse error
          }
        });

        // Listen for project creation events
        eventSource.addEventListener('project:created', (e) => {
          try {
            const parsed = JSON.parse(e.data);
            const payload = parsed.data || parsed;
            addNotification({
              title: payload.title || 'Project Created',
              description: payload.message || 'A new project was provisioned in your workspace.',
              type: 'task'
            });
            toast(payload.title || 'Project Created', payload.message || '', 'success');
          } catch {
            // ignore
          }
        });

        // Listen for task events
        eventSource.addEventListener('task:created', (e) => {
          try {
            const parsed = JSON.parse(e.data);
            const payload = parsed.data || parsed;
            addNotification({
              title: payload.title || 'Task Created',
              description: payload.message || 'A new task was created in your project.',
              type: 'task'
            });
            toast(payload.title || 'Task Created', payload.message || '', 'info');
          } catch {
            // ignore
          }
        });

        eventSource.addEventListener('task:moved', (e) => {
          try {
            const parsed = JSON.parse(e.data);
            const payload = parsed.data || parsed;
            addNotification({
              title: 'Task Status Updated',
              description: payload.message || 'A task was moved to a new column on the Kanban board.',
              type: 'task'
            });
            toast('Kanban Synchronized', payload.message || 'Task status updated in real-time.', 'info');
          } catch {
            // ignore
          }
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Attempt graceful reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [activeTenant?.id, accessToken, addNotification]);

  return { isConnected };
}
