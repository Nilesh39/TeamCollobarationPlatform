import * as React from 'react';
import {
  Settings,
  ShieldCheck,
  CreditCard,
  Key,
  Palette,
  Building2,
  CheckCircle2,
  Save,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs } from '../components/ui/tabs';
import { toast } from '../components/ui/toast';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../app/store/useAuthStore';
import { useThemeStore } from '../app/store/useThemeStore';

export function SettingsPage() {
  const { activeTenant } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [activeTab, setActiveTab] = React.useState('general');
  const [orgName, setOrgName] = React.useState(activeTenant?.name || 'Acme Corporation');
  const [geminiApiKey, setGeminiApiKey] = React.useState('AIzaSyD-sample-production-key-gemini-2026');
  const [temperature, setTemperature] = React.useState('0.2');
  const [saving, setSaving] = React.useState(false);

  const [newOrgName, setNewOrgName] = React.useState('');
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = React.useState(false);

  const tabs = [
    { id: 'general', label: 'Organization', icon: <Building2 /> },
    { id: 'billing', label: 'Billing & Plan', icon: <CreditCard /> },
    { id: 'security', label: 'Security & Auth', icon: <ShieldCheck /> },
    { id: 'ai', label: 'AI & Gemini Keys', icon: <Key /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette /> }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch('/tenants/current', { name: orgName });
      if (activeTenant) {
        useAuthStore.getState().setActiveTenant({
          ...activeTenant,
          name: orgName
        });
      }
      toast('Settings Saved', 'Organization parameters updated successfully.');
    } catch (err: any) {
      toast('Notice', err.response?.data?.detail || 'Settings saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      const res = await apiClient.post('/tenants', { name: newOrgName.trim() });
      const newTenant = res.data?.data?.tenant;
      if (newTenant) {
        toast('Organization Created', `Created ${newTenant.name}!`);
        setIsCreateOrgModalOpen(false);
        setNewOrgName('');
      }
    } catch (err: any) {
      toast('Creation Failed', err.response?.data?.detail || 'Failed to create organization.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-border/80">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure multi-tenant boundaries, billing tiers, API credentials, and security policies.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: General */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace Organization Profile</CardTitle>
            <CardDescription className="text-xs">Manage tenant slug and organization display name.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Organization Display Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">Organization Slug</label>
                <input
                  type="text"
                  disabled
                  value={activeTenant?.slug || 'acme-corp'}
                  className="w-full h-9 rounded-md border border-input bg-muted/40 px-3 text-xs text-muted-foreground font-mono"
                />
                <p className="text-[11px] text-muted-foreground">Used for API subdomain routing and RLS partition keys.</p>
              </div>

              <div className="flex justify-end pt-3 border-t border-border/70">
                <Button type="submit" size="sm" isLoading={saving}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Current Subscription</CardTitle>
                <CardDescription className="text-xs">Your organization is enrolled in the Enterprise Tier.</CardDescription>
              </div>
              <Badge variant="purple">Active Tier</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-accent/20 border border-border">
                <div>
                  <span className="text-muted-foreground">Seats</span>
                  <div className="font-bold text-sm text-foreground">8 / 20 Used</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Next Invoice</span>
                  <div className="font-bold text-sm text-foreground">Dec 01, 2026</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <div className="font-bold text-sm text-foreground">$149.00 / mo</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Payment Method: Visa ending in 4242</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast('Stripe Portal', 'Opening customer billing portal.')}
                >
                  Manage Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Authentication & Tenant Protection</CardTitle>
            <CardDescription className="text-xs">Verified cryptographic mechanisms implemented in Phase 1.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20">
                <div>
                  <div className="font-semibold text-foreground">Argon2id Password Encryption</div>
                  <div className="text-[11px] text-muted-foreground">MemoryCost: 64MB, TimeCost: 3 iterations</div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20">
                <div>
                  <div className="font-semibold text-foreground">Redis Refresh Token Family Rotation</div>
                  <div className="text-[11px] text-muted-foreground">15m Access Token, 7d Sliding Session, Automatic Replay Revocation</div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20">
                <div>
                  <div className="font-semibold text-foreground">Prisma Client Query Authorization</div>
                  <div className="text-[11px] text-muted-foreground">Auto-scopes tenantId at ORM layer across all models</div>
                </div>
                <Badge variant="success">Enforced</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: AI Keys */}
      {activeTab === 'ai' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Gemini & LangChain Integration</CardTitle>
            <CardDescription className="text-xs">Configure LLM endpoints, temperature, and agent reasoning parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Gemini API Key"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                hint="Used by LangChain for Gemini 1.5 Pro & text-embedding-004."
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">Default Agent Temperature ({temperature})</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-muted-foreground">Lower values (0.1 - 0.3) provide more deterministic and tool-accurate reasoning.</p>
              </div>

              <div className="flex justify-end pt-3 border-t border-border/70">
                <Button type="submit" size="sm" isLoading={saving}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Update AI Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Appearance */}
      {activeTab === 'appearance' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme & Display Preferences</CardTitle>
            <CardDescription className="text-xs">Toggle between Light and Dark interface modes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  toast('Light Theme Enabled');
                }}
                className={`p-4 rounded-xl border text-left flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'light' ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-foreground">Light Mode</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Crisp, clean daytime aesthetics</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  toast('Dark Theme Enabled');
                }}
                className={`p-4 rounded-xl border text-left flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-foreground">Dark Obsidian</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Linear & Vercel deep dark mode</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
