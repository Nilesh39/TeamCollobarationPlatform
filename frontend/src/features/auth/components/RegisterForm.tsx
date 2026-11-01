import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { apiClient } from '../../../lib/apiClient';
import { useAuthStore } from '../../../app/store/useAuthStore';
import { UserPlus, AlertCircle } from 'lucide-react';

export function RegisterForm({ onToggleMode }: { onToggleMode: () => void }) {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [tenantName, setTenantName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        password,
        tenantName: tenantName || undefined
      });

      const { user, tenant, accessToken } = response.data.data;
      setAuth({
        user,
        activeTenant: tenant,
        availableTenants: [tenant],
        accessToken
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Registration failed.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-blue-500" /> Create Workspace Account
        </CardTitle>
        <CardDescription>
          Get started with your team's autonomous AI operating workspace.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Connor"
            required
          />

          <Input
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@cyberdyne.io"
            required
          />

          <Input
            label="Organization Name"
            type="text"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Cyberdyne Systems"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, 1 upper, 1 number, 1 symbol"
            required
          />

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            Create Organization & Register
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
          >
            Sign In
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
