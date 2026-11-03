import * as React from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Bot,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/toast';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { FixtureNotification } from '../lib/fixtures';

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    triggerDemoNotification
  } = useNotificationStore();

  const [filter, setFilter] = React.useState<'ALL' | 'UNREAD' | 'MENTIONS' | 'AGENT'>('ALL');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'MENTIONS') return n.type === 'mention';
    if (filter === 'AGENT') return n.type === 'agent';
    return true;
  });

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast('Notifications Cleared', 'All alerts marked as read.', 'success');
  };

  const handleMarkOne = (id: string) => {
    markAsRead(id);
  };

  const getIcon = (type: FixtureNotification['type']) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'agent':
        return <Bot className="w-4 h-4 text-purple-500" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'system':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount} Unread</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time SSE event stream connected with audio chime and instant sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={triggerDemoNotification}
            className="text-xs cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Test Real-time Alert
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-xs cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Mark All as Read
          </Button>

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              title="Clear all notification history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'MENTIONS', label: 'Mentions' },
          { id: 'AGENT', label: 'AI Agent Events' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab.id
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'bg-accent/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Stack */}
      <div className="space-y-3">
        {filteredNotifications.map((notif) => (
          <Card
            key={notif.id}
            onClick={() => handleMarkOne(notif.id)}
            className={`p-4 transition-all cursor-pointer hover:border-primary/40 ${
              !notif.isRead ? 'border-primary/40 bg-accent/20' : 'bg-card'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>{notif.title}</span>
                    {!notif.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" /> {notif.timestamp}
              </span>
            </div>
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No notifications matching this filter.
          </div>
        )}
      </div>
    </div>
  );
}
