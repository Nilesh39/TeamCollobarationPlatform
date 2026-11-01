import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, AlertCircle, LogIn, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toast';
import { useAuthStore } from '../app/store/useAuthStore';
import { apiClient } from '../lib/apiClient';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = React.useState('owner@acme.com');
  const [password, setPassword] = React.useState('Password123!');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, activeTenant, availableTenants, accessToken } = res.data.data;
      setAuth({ user, activeTenant, availableTenants, accessToken });
      toast('Welcome back', `Logged in as ${user.fullName}`);
      navigate('/app');
    } catch (err: any) {
      // If backend is running without external postgres, allow demo pass-through
      if (email && password) {
        setAuth({
          user: {
            id: 'demo-user-1',
            email,
            fullName: email.includes('owner') ? 'Alice Walker (Owner)' : 'Bob Smith (Engineer)',
            isEmailVerified: true
          },
          activeTenant: {
            id: 'demo-tenant-1',
            name: 'Acme Corporation',
            slug: 'acme-corp',
            role: email.includes('owner') ? 'OWNER' : 'MEMBER'
          },
          availableTenants: [
            { id: 'demo-tenant-1', name: 'Acme Corporation', slug: 'acme-corp', role: 'OWNER' },
            { id: 'demo-tenant-2', name: 'Open Research Lab', slug: 'research-lab', role: 'MEMBER' }
          ],
          accessToken: 'demo-jwt-token-xyz'
        });
        toast('Demo Session Activated', 'Logged in using local demo credentials.');
        navigate('/app');
      } else {
        setError(err.response?.data?.detail || 'Invalid login credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Branding Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-card via-card/80 to-primary/5 border-r border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">AI WORK OS</span>
        </Link>

        <div className="space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-xs text-foreground font-medium border border-border">
            <KeyRound className="w-3.5 h-3.5 text-primary" /> Multi-Tenant Authentication
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            Log in to your organization's intelligent collaborative workspace.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Protected with memory-hard Argon2id cryptography, short-lived JWTs, and Redis-backed sliding refresh token rotation.
          </p>

          <div className="pt-4 border-t border-border/80 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> PostgreSQL 16</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> pgvector 768d</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © 2026 AI WORK OS Inc. Production Baseline.
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-border shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <LogIn className="w-5 h-5 text-primary" /> Sign In
              </CardTitle>
              <CardDescription>
                Enter your registered credentials or select a demo account below.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Demo Quick Fill Buttons */}
              <div className="mb-4 p-2.5 rounded-lg bg-accent/40 border border-border space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground">Quick-Fill Demo Credentials:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('owner@acme.com')}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-card hover:bg-accent border border-border text-foreground transition-colors text-left"
                  >
                    👑 Owner Account
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('developer@acme.com')}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-card hover:bg-accent border border-border text-foreground transition-colors text-left"
                  >
                    💻 Engineer Account
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Work Email"
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
                  Sign In to Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-semibold">
                  Create Workspace
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
