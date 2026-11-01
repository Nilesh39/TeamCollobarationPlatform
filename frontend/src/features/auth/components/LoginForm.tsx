import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { apiClient } from '../../../lib/apiClient';
import { useAuthStore } from '../../../app/store/useAuthStore';
import { LogIn, AlertCircle } from 'lucide-react';

export function LoginForm({ onToggleMode }: { onToggleMode: () => void }) {
  const [email, setEmail] = React.useState('owner@acme.com');
  const [password, setPassword] = React.useState('Password123!');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, activeTenant, availableTenants, accessToken } = response.data.data;

      setAuth({
        user,
        activeTenant,
        availableTenants,
        accessToken
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Login failed.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <LogIn className="w-6 h-6 text-blue-500" /> Sign In to Workspace
        </CardTitle>
        <CardDescription>
          Enter your credentials to access your multi-tenant organization.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Don't have an organization yet?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
          >
            Create an Account
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
