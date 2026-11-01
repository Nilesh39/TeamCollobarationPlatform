import * as React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Zap,
  Bot,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { InteractiveLineChart, InteractiveBarChart } from '../components/ui/charts';
import { toast } from '../components/ui/toast';

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState('30d');

  const throughputData = [
    { label: 'Week 1', value: 24 },
    { label: 'Week 2', value: 38 },
    { label: 'Week 3', value: 42 },
    { label: 'Week 4', value: 58 }
  ];

  const agentTokenData = [
    { label: 'Agent Tooling', value: 85 },
    { label: 'RAG Ingestion', value: 65 },
    { label: 'Code Review', value: 45 },
    { label: 'Standup Sync', value: 30 }
  ];

  const handleExport = () => {
    toast('Report Exported', 'Telemetry analytics downloaded as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Telemetry & Analytics</h1>
            <Badge variant="cyan">Real-Time Metrics</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Evaluate engineering velocity, AI agent token consumption, and workspace deliverable trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-accent/40 p-1 rounded-lg border border-border text-xs">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  timeRange === r
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sprint Throughput</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">58 Tasks / Mo</div>
            <p className="text-xs text-emerald-500 mt-1 font-medium">+32% over last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Lead Time</span>
              <Zap className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">2.4 Days</div>
            <p className="text-xs text-muted-foreground mt-1">From backlog to production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gemini Tokens</span>
              <Bot className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">1.24 M Tokens</div>
            <p className="text-xs text-purple-500 mt-1">1.5 Pro + 1.5 Flash allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bug Escape Rate</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-500">0.02%</div>
            <p className="text-xs text-muted-foreground mt-1">Zero regression defects</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Engineering Velocity Trend</CardTitle>
            <CardDescription className="text-xs">Resolved story points per week</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveLineChart data={throughputData} height={200} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Token Consumption By Domain</CardTitle>
            <CardDescription className="text-xs">Tokens in thousands across autonomous workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveBarChart data={agentTokenData} height={200} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
