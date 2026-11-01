import * as React from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  Play,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/toast';
import { INITIAL_MEETINGS, FixtureMeeting } from '../lib/fixtures';

export function MeetingsPage() {
  const [meetings, setMeetings] = React.useState<FixtureMeeting[]>(INITIAL_MEETINGS);
  const [inRoom, setInRoom] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOn, setIsVideoOn] = React.useState(true);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);

  // New Meeting Form
  const [meetTitle, setMeetTitle] = React.useState('');
  const [meetTime, setMeetTime] = React.useState('11:30 AM');
  const [meetDuration, setMeetDuration] = React.useState('30 mins');

  const handleStartInstant = () => {
    setInRoom(true);
    toast('Room Joined', 'Connected to audio & video sync channel.');
  };

  const handleLeaveRoom = () => {
    setInRoom(false);
    toast('Meeting Ended', 'AI summary and action items are generating.');
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;

    const newMeet: FixtureMeeting = {
      id: `meet-${Date.now().toString(36)}`,
      title: meetTitle,
      time: `Today at ${meetTime}`,
      duration: meetDuration,
      status: 'UPCOMING',
      participants: [
        { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }
      ]
    };

    setMeetings([newMeet, ...meetings]);
    toast('Meeting Scheduled', `"${meetTitle}" has been scheduled.`);
    setMeetTitle('');
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Video Sync & Meetings</h1>
            <Badge variant="success">Socket.IO WebRTC</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time team sync with autonomous AI transcription, meeting summaries, and action item generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Sync
          </Button>
          {!inRoom && (
            <Button size="sm" onClick={handleStartInstant}>
              <Video className="w-3.5 h-3.5 mr-1" /> Start Instant Room
            </Button>
          )}
        </div>
      </div>

      {/* Active Video Room Simulator */}
      {inRoom && (
        <Card className="border-primary/60 bg-slate-950 p-4 text-white overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-white">LIVE: Architecture Sync Room #402</span>
              <Badge variant="cyan" className="text-[10px]">AI Transcribing</Badge>
            </div>
            <span className="font-mono text-slate-400">03:42</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            {/* Participant 1 */}
            <div className="h-56 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250"
                alt="Alice"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary mb-2"
              />
              <span className="text-xs font-semibold text-slate-200">Alice Walker (You)</span>
              <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[10px] text-slate-300">
                {isMuted ? 'Muted' : 'Speaking...'}
              </div>
            </div>

            {/* Participant 2 */}
            <div className="h-56 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250"
                alt="Bob"
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-700 mb-2"
              />
              <span className="text-xs font-semibold text-slate-200">Bob Smith</span>
              <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[10px] text-slate-300">
                Listening
              </div>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="icon"
              onClick={() => {
                setIsMuted(!isMuted);
                toast(isMuted ? 'Microphone On' : 'Microphone Muted');
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <Button
              variant={!isVideoOn ? 'destructive' : 'secondary'}
              size="icon"
              onClick={() => {
                setIsVideoOn(!isVideoOn);
                toast(isVideoOn ? 'Camera Disabled' : 'Camera Enabled');
              }}
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>

            <Button
              variant={isScreenSharing ? 'primary' : 'secondary'}
              size="icon"
              onClick={() => {
                setIsScreenSharing(!isScreenSharing);
                toast(isScreenSharing ? 'Screen Share Stopped' : 'Screen Sharing Started');
              }}
              title="Share Screen"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            <Button variant="destructive" size="sm" onClick={handleLeaveRoom}>
              <PhoneOff className="w-4 h-4 mr-1.5" /> Leave Call
            </Button>
          </div>
        </Card>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Scheduled & Recorded Meetings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((meet) => (
            <Card key={meet.id} className="p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant={meet.status === 'LIVE' ? 'destructive' : meet.status === 'RECORDED' ? 'purple' : 'outline'}>
                    {meet.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{meet.duration}</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground mt-2">{meet.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3.5 h-3.5" /> {meet.time}
                </div>
              </div>

              {/* AI Generated Meeting Summary if recorded */}
              {meet.aiSummary && (
                <div className="p-3 rounded-lg bg-accent/40 border border-border text-xs space-y-1.5">
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                    <Sparkles className="w-3 h-3" /> AI Summary & Action Items:
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{meet.aiSummary}</p>
                  {meet.actionItems && (
                    <ul className="text-[10px] space-y-1 text-foreground pt-1">
                      {meet.actionItems.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div className="flex items-center -space-x-1.5">
                  {meet.participants.map((p, idx) => (
                    <img
                      key={idx}
                      src={p.avatar}
                      alt={p.name}
                      className="w-6 h-6 rounded-full object-cover border-2 border-card"
                    />
                  ))}
                </div>

                {meet.status === 'LIVE' ? (
                  <Button size="sm" onClick={handleStartInstant} className="text-xs">
                    Join Live Call
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => toast('Recording Opened', 'Playing back audio sync.')}
                  >
                    View Notes
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal: Schedule Sync */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Sync Meeting"
        description="Schedule a team sync room with automated AI meeting notes."
      >
        <form onSubmit={handleSchedule} className="space-y-4 pt-2">
          <Input
            label="Meeting Title"
            value={meetTitle}
            onChange={(e) => setMeetTitle(e.target.value)}
            placeholder="e.g. Q4 Sprint Architecture Review"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Time"
              value={meetTime}
              onChange={(e) => setMeetTime(e.target.value)}
              placeholder="e.g. 03:00 PM"
              required
            />
            <Input
              label="Duration"
              value={meetDuration}
              onChange={(e) => setMeetDuration(e.target.value)}
              placeholder="e.g. 45 mins"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
