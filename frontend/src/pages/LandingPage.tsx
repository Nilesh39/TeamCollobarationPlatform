import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bot,
  Database,
  Layers,
  CheckCircle2,
  Cpu,
  BarChart2,
  Terminal,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { useThemeStore } from '../app/store/useThemeStore';

export function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [activePlan, setActivePlan] = React.useState<'starter' | 'pro' | 'enterprise'>('pro');

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary selection:text-primary-foreground">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-border/70 backdrop-blur-md bg-background/80 sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">AI WORK OS</span>
          <Badge variant="cyan" className="hidden sm:inline-flex text-[10px]">
            v1.0 Production
          </Badge>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#proof" className="hover:text-foreground transition-colors">Enterprise</a>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </Button>

          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-xs">
              Sign In
            </Button>
          </Link>

          <Link to="/signup">
            <Button size="sm" className="text-xs shadow-md shadow-primary/20">
              Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 sm:px-12 max-w-6xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/60 border border-border text-xs text-foreground mb-6"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Phase 1 Architecture Complete</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-primary font-semibold">Explore Interactive UI</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]"
        >
          The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">Autonomous Teams</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Unite sprint tracking, documents, real-time collaboration, and Google Gemini AI agents in one unified, multi-tenant workspace platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8"
        >
          <Link to="/app">
            <Button size="lg" className="w-full sm:w-auto text-sm shadow-xl shadow-primary/25">
              Launch Workspace Demo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
              Sign In with Demo Credentials
            </Button>
          </Link>
        </motion.div>

        {/* Hero Interactive App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 rounded-2xl border border-border/80 bg-card p-2 sm:p-4 shadow-2xl overflow-hidden text-left"
        >
          <div className="flex items-center justify-between pb-3 px-2 border-b border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-foreground">ai-work-os.internal/app</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <Badge variant="success">Socket.IO Connected</Badge>
              <Badge variant="purple">Gemini 1.5 Pro</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
            <div className="p-4 rounded-xl border border-border/60 bg-accent/20 space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Active Sprint Tasks</span>
                <Badge variant="default">86% Velocity</Badge>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="p-2 rounded-lg bg-card border border-border text-xs flex justify-between">
                  <span className="font-medium">CORE-101 pgvector HNSW</span>
                  <Badge variant="success" className="text-[9px]">DONE</Badge>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border text-xs flex justify-between">
                  <span className="font-medium">AI-201 LangChain Tool Registry</span>
                  <Badge variant="warning" className="text-[9px]">IN PROGRESS</Badge>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-accent/20 space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>RAG Knowledge Base</span>
                <Badge variant="cyan">768-dim Vector</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                4 documents indexed. Hybrid cosine search with Reciprocal Rank Fusion active.
              </p>
              <div className="text-[11px] font-mono text-primary bg-primary/10 p-2 rounded-md">
                Query: "Show architecture security rules"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-accent/20 space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Autonomous AI Agent</span>
                <Badge variant="purple">Online</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                WorkOS Sentinel executing scheduled standup summary & task assignments.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 19 automated actions today
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 px-6 sm:px-12 border-t border-border/70 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="default" className="mb-3">Linear-Grade Polish</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Engineered for high-output engineering teams.
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Every screen is crafted with keyboard-first ergonomics, micro-interactions, and real-time responsiveness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center mb-3">
                <Bot className="w-5 h-5" />
              </div>
              <CardTitle>Autonomous AI Agents</CardTitle>
              <CardDescription>
                Empowered with LangChain tools to inspect tasks, move cards, search wiki documents, and dispatch summaries.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <CardTitle>PostgreSQL 16 + pgvector</CardTitle>
              <CardDescription>
                Sub-millisecond cosine distance similarity search on 768-dimensional Gemini embeddings with HNSW indexes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <CardTitle>Zero-Leak Multi-Tenancy</CardTitle>
              <CardDescription>
                Prisma Client extensions automatically inject tenant boundaries on all queries. Strict row-level isolation.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 sm:px-12 border-t border-border/70 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="purple" className="mb-3">Transparent Tiers</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Simple, predictable workspace plans.
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Switch plans anytime. Full data export and isolation guaranteed on all tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={activePlan === 'starter' ? 'border-primary ring-1 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Starter</CardTitle>
              <div className="text-3xl font-extrabold text-foreground mt-2">$0 <span className="text-xs font-normal text-muted-foreground">/ free forever</span></div>
              <CardDescription className="mt-2">Ideal for indie developers and small teams exploring autonomous workspaces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Up to 5 team members</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> 100 MB pgvector RAG storage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Standard Kanban boards</li>
              </ul>
              <Button variant="outline" className="w-full text-xs" onClick={() => setActivePlan('starter')}>
                Select Plan
              </Button>
            </CardContent>
          </Card>

          <Card className={activePlan === 'pro' ? 'border-primary ring-2 ring-primary relative shadow-xl' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pro Workspace</CardTitle>
                <Badge variant="default">Popular</Badge>
              </div>
              <div className="text-3xl font-extrabold text-foreground mt-2">$29 <span className="text-xs font-normal text-muted-foreground">/ seat / month</span></div>
              <CardDescription className="mt-2">For fast-moving tech startups scaling with AI agents and RAG memory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Unlimited team members</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 10 GB pgvector document memory</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Gemini 1.5 Pro Agent tools</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Real-time Socket.IO presence</li>
              </ul>
              <Link to="/signup">
                <Button className="w-full text-xs mt-2" onClick={() => setActivePlan('pro')}>
                  Get Started with Pro
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className={activePlan === 'enterprise' ? 'border-primary ring-1 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Enterprise</CardTitle>
              <div className="text-3xl font-extrabold text-foreground mt-2">Custom</div>
              <CardDescription className="mt-2">Dedicated clusters, custom LLM fine-tuning, SOC2 audit support, and SLA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Dedicated PostgreSQL 16 cluster</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> SSO, SAML & SCIM provisioning</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> 99.99% uptime SLA</li>
              </ul>
              <Button variant="outline" className="w-full text-xs" onClick={() => setActivePlan('enterprise')}>
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 py-12 px-6 sm:px-12 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-semibold text-foreground">AI WORK OS</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          <Link to="/signup" className="hover:text-foreground transition-colors">Create Account</Link>
          <Link to="/app" className="hover:text-foreground transition-colors">Workspace Demo</Link>
        </div>
      </footer>
    </div>
  );
}
