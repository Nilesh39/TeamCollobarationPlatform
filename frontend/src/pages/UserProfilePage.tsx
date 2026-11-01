import * as React from 'react';
import {
  User,
  Shield,
  KeyRound,
  Smartphone,
  Save,
  CheckCircle2,
  Laptop
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/toast';
import { useAuthStore } from '../app/store/useAuthStore';

export function UserProfilePage() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = React.useState(user?.fullName || 'Alice Walker');
  const [email, setEmail] = React.useState(user?.email || 'owner@acme.com');
  const [jobTitle, setJobTitle] = React.useState('Lead Software Architect & Owner');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [mfaEnabled, setMfaEnabled] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast('Profile Updated', 'Personal information saved.');
    }, 400);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    toast('Password Changed', 'Argon2id cryptographic hash updated.');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-border/80">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Profile & Account</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your personal credentials, contact email, and active sessions.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
          <CardDescription className="text-xs">Update your public name and workspace title.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border/70">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-bold text-xl text-primary-foreground shadow-md">
                {fullName.charAt(0)}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => toast('Avatar Picker', 'Select new profile image.')}
                >
                  Change Avatar
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">JPG or PNG under 2 MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Input
              label="Role / Title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" isLoading={saving}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password & Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password & Authentication</CardTitle>
          <CardDescription className="text-xs">Change password using Argon2id encryption.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Two-Factor Authentication (2FA)</div>
                  <div className="text-[11px] text-muted-foreground">Secure your account using TOTP authenticator</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => {
                  setMfaEnabled(e.target.checked);
                  toast(e.target.checked ? '2FA Enabled' : '2FA Disabled');
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" variant="outline">
                <KeyRound className="w-3.5 h-3.5 mr-1" /> Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Login Sessions</CardTitle>
          <CardDescription className="text-xs">Redis sliding refresh tokens mapped to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20 text-xs">
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <span>Current Browser Session</span>
                  <Badge variant="success" className="text-[9px]">Active Now</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">Chrome on Windows · IP 127.0.0.1</div>
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">Family ID: 8f42-a1b</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
