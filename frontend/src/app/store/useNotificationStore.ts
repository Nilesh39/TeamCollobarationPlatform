import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_NOTIFICATIONS, FixtureNotification } from '../../lib/fixtures';

/**
 * Plays a pleasant web audio notification chime using the browser's native AudioContext.
 * Works without external media files or network assets.
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Chime Tone 1 (High bell harmonic - D5 ~ 587Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Chime Tone 2 (Sparkle harmonic - A5 ~ 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch {
    // AudioContext blocked before first user gesture
  }
}

interface NotificationStoreState {
  notifications: FixtureNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<FixtureNotification, 'id' | 'timestamp' | 'isRead'> & { id?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  triggerDemoNotification: () => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.isRead).length,

      addNotification: (item) => {
        const newNotif: FixtureNotification = {
          id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: item.title,
          description: item.description,
          timestamp: 'Just now',
          type: item.type || 'system',
          isRead: false
        };

        playNotificationChime();

        set((state) => {
          const updated = [newNotif, ...state.notifications];
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length
          };
        });
      },

      markAsRead: (id: string) => {
        set((state) => {
          const updated = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0
        }));
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0
        });
      },

      triggerDemoNotification: () => {
        const demoEvents = [
          {
            title: 'Gemini Copilot Analyzed Sprint Velocity',
            description: 'AI model suggests reassigning 2 blocked tasks to balance team workload.',
            type: 'agent' as const
          },
          {
            title: 'Project Milestone Reached',
            description: 'Engineering Core completed Milestone 2: Multi-tenant RBAC & JWT.',
            type: 'task' as const
          },
          {
            title: 'Security Access Synchronized',
            description: 'Real-time WebSocket connection active with zero latency spikes.',
            type: 'system' as const
          }
        ];
        const selected = demoEvents[Math.floor(Math.random() * demoEvents.length)];
        get().addNotification(selected);
      }
    }),
    {
      name: 'ai_work_os_notifications'
    }
  )
);
