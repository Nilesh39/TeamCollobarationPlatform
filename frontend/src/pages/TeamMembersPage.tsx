import * as React from 'react';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Mail,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Shield
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { INITIAL_MEMBERS, FixtureMember } from '../lib/fixtures';

export function TeamMembersPage() {
  const [members, setMembers] = React.useState<FixtureMember[]>(INITIAL_MEMBERS);
  const [search, setSearch] = React.useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteName, setInviteName] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<FixtureMember['role']>('MEMBER');
  const [inviteDept, setInviteDept] = React.useState('Engineering');

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: FixtureMember = {
      id: `mem-${Date.now().toString(36)}`,
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'INVITED',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      department: inviteDept,
      joinedDate: 'Just now'
    };

    setMembers([...members, newMember]);
    toast('Invitation Dispatched', `Invited ${inviteEmail} as ${inviteRole}.`);
    setInviteEmail('');
    setInviteName('');
    setIsInviteModalOpen(false);
  };

  const handleRemoveMember = (id: string, name: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast('Member Removed', `${name} has been removed from organization.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Team & Access Control</h1>
            <Badge variant="cyan">{members.length} Members</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage organization members, assign RBAC permissions, and review active seats.
          </p>
        </div>

        <Button onClick={() => setIsInviteModalOpen(true)} size="sm">
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Invite Member
        </Button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, email or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Active Seats: <strong className="text-foreground">{members.filter(m => m.status === 'ACTIVE').length}</strong></span>
          <span>·</span>
          <span>Pending Invites: <strong className="text-foreground">{members.filter(m => m.status === 'INVITED').length}</strong></span>
        </div>
      </div>

      {/* Members Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/40 border-b border-border/70 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5 pl-4">Member</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-accent/20 transition-colors">
                  <td className="p-3.5 pl-4 flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-border"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{member.name}</div>
                      <div className="text-[11px] text-muted-foreground">{member.email}</div>
                    </div>
                  </td>
                  <td className="p-3.5 text-foreground">{member.department}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        member.role === 'OWNER'
                          ? 'purple'
                          : member.role === 'ADMIN'
                          ? 'cyan'
                          : member.role === 'GUEST'
                          ? 'outline'
                          : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {member.role}
                    </Badge>
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant={member.status === 'ACTIVE' ? 'success' : 'warning'}
                      className="text-[10px]"
                    >
                      {member.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{member.joinedDate}</td>
                  <td className="p-3.5 text-right pr-4">
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Invite Member */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description="Invite a collaborator to your organization with specific role privileges."
      >
        <form onSubmit={handleInvite} className="space-y-4 pt-2">
          <Input
            label="Full Name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="John Wick"
            autoFocus
          />

          <Input
            label="Work Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="john@acme.com"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">RBAC Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="MEMBER">Member (Create & Edit)</option>
                <option value="ADMIN">Admin (Full Control)</option>
                <option value="GUEST">Guest (Read Only)</option>
              </select>
            </div>

            <Input
              label="Department"
              value={inviteDept}
              onChange={(e) => setInviteDept(e.target.value)}
              placeholder="e.g. AI Research"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
