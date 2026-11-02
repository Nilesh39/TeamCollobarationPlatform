import * as React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { apiClient } from '../lib/apiClient';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = React.useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        token: token.trim(),
        newPassword
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Token may be expired or invalid.');
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a secure, strong password for your workspace account.
          </p>
        </div>

        <Card className="border-border bg-card shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Password Update
            </CardTitle>
            <CardDescription>
              Your new password will be hashed using Argon2id.
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
                    <div className="font-semibold text-emerald-300">Password Reset Complete</div>
                    <div>Your password has been changed. Existing sessions have been revoked for your security.</div>
                  </div>
                </div>

                <Button onClick={() => navigate('/login')} className="w-full gap-2">
                  Proceed to Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Security Reset Token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token if not filled from link"
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <Button type="submit" className="w-full gap-2" isLoading={loading}>
                  Reset Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
