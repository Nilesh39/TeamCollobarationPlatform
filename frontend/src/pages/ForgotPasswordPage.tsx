import * as React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/apiClient';

export function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      setSuccess(res.data?.message || 'If an account exists, a reset link has been dispatched.');
      if (res.data?.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dispatch password reset request.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your account email and we'll send you instructions to reset your password.
          </p>
        </div>

        <Card className="border-border bg-card shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> Password Recovery
            </CardTitle>
            <CardDescription>
              We'll issue a time-sensitive, single-use security token.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-emerald-300">Instructions Sent</div>
                    <div>{success}</div>
                  </div>
                </div>

                {resetToken && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground space-y-2">
                    <div className="font-semibold text-primary">Development Token Generated:</div>
                    <code className="block p-2 rounded bg-background/50 font-mono break-all text-[11px]">
                      {resetToken}
                    </code>
                    <Link
                      to={`/reset-password?token=${resetToken}`}
                      className="inline-block text-primary hover:underline font-medium"
                    >
                      Click here to reset password directly →
                    </Link>
                  </div>
                )}

                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Account Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />

                <Button type="submit" className="w-full gap-2" isLoading={loading}>
                  <Mail className="w-4 h-4" /> Send Reset Link
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
