import * as React from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/toast';

interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  time: string;
  category: 'sprint' | 'meeting' | 'review' | 'release';
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 'ev-1', day: 2, title: 'pgvector HNSW Index Freeze', time: '10:00 AM', category: 'sprint' },
  { id: 'ev-2', day: 4, title: 'Auth Token Rotation Signoff', time: '02:00 PM', category: 'review' },
  { id: 'ev-3', day: 10, title: 'Daily Architecture Standup', time: '11:00 AM', category: 'meeting' },
  { id: 'ev-4', day: 15, title: 'Gemini 1.5 Pro Tooling Review', time: '03:30 PM', category: 'review' },
  { id: 'ev-5', day: 20, title: 'Phase 2 Frontend Release', time: '05:00 PM', category: 'release' }
];

export function CalendarPage() {
  const [events, setEvents] = React.useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // New Event Form State
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDay, setEventDay] = React.useState(12);
  const [eventTime, setEventTime] = React.useState('11:00 AM');
  const [eventCategory, setEventCategory] = React.useState<CalendarEvent['category']>('meeting');

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `ev-${Date.now().toString(36)}`,
      day: Number(eventDay),
      title: eventTitle,
      time: eventTime,
      category: eventCategory
    };

    setEvents([...events, newEv]);
    toast('Event Scheduled', `"${eventTitle}" added on Nov ${eventDay}.`);
    setEventTitle('');
    setIsModalOpen(false);
  };

  const getCategoryBadge = (cat: CalendarEvent['category']) => {
    switch (cat) {
      case 'sprint':
        return 'bg-blue-500/10 text-primary border-primary/20';
      case 'meeting':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'review':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'release':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sprint Calendar</h1>
            <Badge variant="cyan">November 2026</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Coordinate release dates, sprint deliverables, and AI agent reasoning loops.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold px-2">November 2026</span>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Event
          </Button>
        </div>
      </div>

      {/* Calendar Days Grid */}
      <Card className="p-4 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 pb-3 text-center border-b border-border/70 text-xs font-semibold text-muted-foreground">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Month Day Slots */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {daysInMonth.map((day) => {
            const dayEvents = events.filter((e) => e.day === day);
            const isToday = day === 1;

            return (
              <div
                key={day}
                className={`min-h-[96px] p-2 rounded-lg border transition-all ${
                  isToday
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border/60 hover:border-border hover:bg-accent/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className={isToday ? 'text-primary font-bold' : 'text-muted-foreground'}>{day}</span>
                  {dayEvents.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`w-full text-left p-1 rounded text-[10px] font-medium truncate block border cursor-pointer ${getCategoryBadge(
                        ev.category
                      )}`}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal: Schedule Event */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Milestone or Meeting"
        description="Add a milestone, standup or release target to the shared workspace calendar."
      >
        <form onSubmit={handleAddEvent} className="space-y-4 pt-2">
          <Input
            label="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Gemini Function Calling Review"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Day of Month (1-30)"
              type="number"
              min={1}
              max={30}
              value={eventDay}
              onChange={(e) => setEventDay(Number(e.target.value))}
              required
            />
            <Input
              label="Time"
              type="text"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              placeholder="e.g. 02:00 PM"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Category</label>
            <select
              value={eventCategory}
              onChange={(e) => setEventCategory(e.target.value as any)}
              className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="sprint">Sprint Task</option>
              <option value="meeting">Team Meeting</option>
              <option value="review">Architecture Review</option>
              <option value="release">Production Release</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Schedule Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Event Detail Inspector */}
      {selectedEvent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          description={`Scheduled for November ${selectedEvent.day}, 2026 at ${selectedEvent.time}`}
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Type:</span>
              <Badge variant="cyan" className="uppercase text-[10px]">
                {selectedEvent.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated reminder linked to active sprint projects. Notifications will be dispatched to project members via Socket.IO.
            </p>
            <div className="flex justify-end pt-3 border-t border-border/80">
              <Button size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
