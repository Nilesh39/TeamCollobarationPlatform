import * as React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertCircle, MailCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../app/store/useAuthStore';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setAuth, accessToken, activeTenant, availableTenants } = useAuthStore();

  const [token, setToken] = React.useState(searchParams.get('token') || '');
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token.trim()) {
      setError('Please provide a verification token.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/verify-email', { token: token.trim() });
      setSuccess(true);
      setInfoMsg(res.data?.message || 'Email verified successfully!');

      if (user && accessToken) {
        setAuth({
          user: { ...user, isEmailVerified: true },
          accessToken,
          activeTenant,
          availableTenants
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify email. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      const res = await apiClient.post('/auth/resend-verification', {
        email: user?.email || undefined
      });
      setInfoMsg(res.data?.message || 'Verification link sent!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend verification link.');
    } finally {
      setResending(false);
    }
  };

  React.useEffect(() => {
    if (searchParams.get('token')) {
      handleVerify();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl text-foreground tracking-tight">AI WORK OS</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Verify your email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Confirm your email address to enable all platform capabilities.
          </p>
        </div>

        <Card className="border-border bg-card shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MailCheck className="w-5 h-5 text-primary" /> Email Verification
            </CardTitle>
            <CardDescription>
              {user?.email ? `Associated with ${user.email}` : 'Enter your verification token.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && !error && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your email has been verified. You now have full access to your workspace.
                </p>
                <Button onClick={() => navigate('/app')} className="w-full gap-2">
                  Go to Workspace <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  label="Verification Token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste verification token"
                  required
                />

                <Button type="submit" className="w-full gap-2" isLoading={loading}>
                  Verify Email
                </Button>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
                  <span>Didn't receive a token?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} /> Resend Link
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
