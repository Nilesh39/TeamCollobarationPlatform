import * as React from 'react';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Mail,
  Trash2,
  Shield,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../app/store/useAuthStore';
import { TenantRole } from '../types/auth.types';

interface MemberItem {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: TenantRole;
  status: 'ACTIVE' | 'INVITED';
  joinedDate: string;
  avatar?: string;
}

interface InvitationItem {
  id: string;
  email: string;
  role: TenantRole;
  token: string;
  status: string;
  createdAt: string;
}

export function TeamMembersPage() {
  const { activeTenant, user } = useAuthStore();
  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [invitations, setInvitations] = React.useState<InvitationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<TenantRole>('MEMBER');
  const [submitting, setSubmitting] = React.useState(false);
  const [lastInvitedToken, setLastInvitedToken] = React.useState<string | null>(null);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.all([
        apiClient.get('/tenants/current/members').catch(() => null),
        apiClient.get('/tenants/current/invitations').catch(() => null)
      ]);

      if (membersRes?.data?.data) {
        const mapped = membersRes.data.data.map((m: any) => ({
          membershipId: m.membershipId,
          userId: m.userId,
          name: m.fullName || m.email.split('@')[0],
          email: m.email,
          role: m.role,
          status: 'ACTIVE',
          joinedDate: new Date(m.joinedAt).toLocaleDateString(),
          avatar: m.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.fullName || m.email)}`
        }));
        setMembers(mapped);
      } else {
        // Fallback demo fixtures
        setMembers([
          {
            membershipId: 'mem-1',
            userId: user?.id || 'usr-1',
            name: user?.fullName || 'Alice Walker (You)',
            email: user?.email || 'owner@acme.com',
            role: activeTenant?.role || 'OWNER',
            status: 'ACTIVE',
            joinedDate: 'Nov 2026',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          },
          {
            membershipId: 'mem-2',
            userId: 'usr-2',
            name: 'Bob Smith',
            email: 'developer@acme.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            joinedDate: 'Nov 2026',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
          }
        ]);
      }

      if (invitesRes?.data?.data) {
        setInvitations(invitesRes.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTeamData();
  }, [activeTenant?.id]);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSubmitting(true);

    try {
      const res = await apiClient.post('/tenants/current/invitations', {
        email: inviteEmail.trim(),
        role: inviteRole
      });

      const token = res.data?.data?.invitationToken || res.data?.data?.invitation?.token;
      setLastInvitedToken(token);
      toast('Invitation Created', `Invitation issued for ${inviteEmail} as ${inviteRole}.`);
      fetchTeamData();
      setInviteEmail('');
    } catch (err: any) {
      toast('Invitation Notice', err.response?.data?.detail || 'Failed to dispatch invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: TenantRole) => {
    try {
      await apiClient.patch(`/tenants/current/members/${memberId}/role`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.membershipId === memberId ? { ...m, role: newRole } : m))
      );
      toast('Role Updated', `Member role changed to ${newRole}.`);
    } catch (err: any) {
      toast('Update Failed', err.response?.data?.detail || 'Cannot change member role.');
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from ${activeTenant?.name || 'this organization'}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/tenants/current/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.membershipId !== memberId));
      toast('Member Removed', `${name} has been removed from organization.`);
    } catch (err: any) {
      toast('Action Failed', err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  const getRoleBadgeVariant = (role: TenantRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'OWNER':
        return 'purple';
      case 'ADMIN':
        return 'cyan';
      case 'PROJECT_MANAGER':
        return 'success';
      default:
        return 'secondary';
    }
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
            Manage organization members, assign RBAC permissions, and review active seats for <strong className="text-foreground">{activeTenant?.name || 'Organization'}</strong>.
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
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Active Seats: <strong className="text-foreground">{members.length}</strong></span>
          <span>·</span>
          <span>Pending Invitations: <strong className="text-foreground">{invitations.length}</strong></span>
        </div>
      </div>

      {/* Members Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/40 border-b border-border/70 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5 pl-4">Member</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredMembers.map((member) => (
                <tr key={member.membershipId} className="hover:bg-accent/20 transition-colors">
                  <td className="p-3.5 pl-4 flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-border"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{member.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{member.email}</div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    {activeTenant?.role === 'OWNER' || activeTenant?.role === 'SUPER_ADMIN' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.membershipId, e.target.value as TenantRole)}
                        className="h-7 rounded-md border border-input bg-background/80 px-2 text-[11px] font-semibold text-foreground outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                        <option value="MEMBER">Member</option>
                        <option value="GUEST">Guest</option>
                      </select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)} className="text-[10px]">
                        {member.role}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3.5">
                    <Badge variant="success" className="text-[10px]">
                      ACTIVE
                    </Badge>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{member.joinedDate}</td>
                  <td className="p-3.5 text-right pr-4">
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.membershipId, member.name)}
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

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Clock className="w-4 h-4 text-amber-500" /> Pending Organization Invitations ({invitations.length})
          </div>
          <div className="divide-y divide-border/60">
            {invitations.map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-foreground">{inv.email}</div>
                  <div className="text-[11px] text-muted-foreground">Role: <span className="font-semibold">{inv.role}</span> · Invited {new Date(inv.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="text-[10px]">{inv.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(inv.token);
                      toast('Token Copied', 'Invitation token copied to clipboard.');
                    }}
                  >
                    <Copy className="w-3 h-3" /> Copy Token
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal: Invite Member */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setLastInvitedToken(null);
        }}
        title="Invite Organization Member"
        description="Invite a teammate to collaborate in your multi-tenant workspace with granular RBAC privileges."
      >
        <form onSubmit={handleInvite} className="space-y-4 pt-2">
          {lastInvitedToken && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs space-y-1.5">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Invitation Token Generated:
              </div>
              <code className="block p-2 rounded bg-background/60 font-mono text-[11px] break-all select-all">
                {lastInvitedToken}
              </code>
              <p className="text-muted-foreground text-[10px]">
                Teammate can accept this invitation directly or via accept invitation API.
              </p>
            </div>
          )}

          <Input
            label="Work Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">RBAC Role Privilege</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TenantRole)}
              className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="MEMBER">Team Member (Create & update tasks, view docs)</option>
              <option value="PROJECT_MANAGER">Project Manager (Manage projects, assign tasks)</option>
              <option value="ADMIN">Organization Admin (Manage workspaces, invite teammates)</option>
              <option value="OWNER">Organization Owner (Full control & billing)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsInviteModalOpen(false);
                setLastInvitedToken(null);
              }}
            >
              Close
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
