export interface FixtureProject {
  id: string;
  name: string;
  key: string;
  description: string;
  status: 'ACTIVE' | 'PLANNING' | 'COMPLETED' | 'PAUSED';
  progress: number;
  taskCount: number;
  completedTasks: number;
  members: Array<{ name: string; avatar: string; role: string }>;
  dueDate: string;
  category: string;
}

export interface FixtureTask {
  id: string;
  projectId: string;
  projectKey: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee: { name: string; avatar: string; email: string };
  dueDate: string;
  tags: string[];
  commentsCount: number;
}

export interface FixtureMember {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  status: 'ACTIVE' | 'INVITED' | 'OFFLINE';
  avatar: string;
  department: string;
  joinedDate: string;
}

export interface FixtureDocument {
  id: string;
  title: string;
  type: 'PDF' | 'DOCX' | 'MARKDOWN' | 'SPEC';
  size: string;
  workspace: string;
  ragStatus: 'INDEXED' | 'PROCESSING' | 'FAILED';
  chunksCount: number;
  updatedAt: string;
  author: string;
}

export interface FixtureMeeting {
  id: string;
  title: string;
  time: string;
  duration: string;
  participants: Array<{ name: string; avatar: string }>;
  status: 'UPCOMING' | 'LIVE' | 'RECORDED';
  aiSummary?: string;
  actionItems?: string[];
}

export interface FixtureNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'mention' | 'task' | 'agent' | 'system';
  isRead: boolean;
}

export const INITIAL_PROJECTS: FixtureProject[] = [
  {
    id: 'proj-1',
    name: 'Core Platform Architecture',
    key: 'CORE',
    description: 'Enterprise multi-tenant foundational services, Prisma pgvector & auth.',
    status: 'ACTIVE',
    progress: 78,
    taskCount: 24,
    completedTasks: 19,
    members: [
      { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'Owner' },
      { name: 'Bob Smith', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', role: 'Lead Architect' }
    ],
    dueDate: '2026-11-20',
    category: 'Engineering'
  },
  {
    id: 'proj-2',
    name: 'Gemini AI Agent Reasoning',
    key: 'AI',
    description: 'Autonomous tool-calling agents with LangChain & hybrid RAG search.',
    status: 'ACTIVE',
    progress: 45,
    taskCount: 18,
    completedTasks: 8,
    members: [
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', role: 'AI Researcher' },
      { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', role: 'ML Engineer' }
    ],
    dueDate: '2026-12-05',
    category: 'Intelligence'
  },
  {
    id: 'proj-3',
    name: 'Mobile PWA & Real-time Canvas',
    key: 'MOB',
    description: 'Touch-optimized responsive workspace client with offline cache.',
    status: 'PLANNING',
    progress: 20,
    taskCount: 15,
    completedTasks: 3,
    members: [
      { name: 'Bob Smith', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', role: 'Frontend Dev' }
    ],
    dueDate: '2026-12-30',
    category: 'Product'
  },
  {
    id: 'proj-4',
    name: 'SOC2 Compliance & Audit Trail',
    key: 'SEC',
    description: 'Immutable logging, tenant encryption, and penetration hardening.',
    status: 'COMPLETED',
    progress: 100,
    taskCount: 12,
    completedTasks: 12,
    members: [
      { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'Security Officer' }
    ],
    dueDate: '2026-10-15',
    category: 'Security'
  }
];

export const INITIAL_TASKS: FixtureTask[] = [
  {
    id: 'task-101',
    projectId: 'proj-1',
    projectKey: 'CORE-101',
    title: 'PostgreSQL 16 pgvector HNSW indexing',
    description: 'Set ef_construction=64 and m=16 for cosine distance vector recall.',
    status: 'DONE',
    priority: 'URGENT',
    assignee: { name: 'Bob Smith', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', email: 'bob@acme.com' },
    dueDate: '2026-11-02',
    tags: ['Database', 'Vector'],
    commentsCount: 5
  },
  {
    id: 'task-102',
    projectId: 'proj-1',
    projectKey: 'CORE-102',
    title: 'Sliding JWT token rotation with family replay check',
    description: 'Ensure consumed tokens in Redis trigger full family revocation upon replay.',
    status: 'DONE',
    priority: 'HIGH',
    assignee: { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'alice@acme.com' },
    dueDate: '2026-11-04',
    tags: ['Auth', 'Security'],
    commentsCount: 3
  },
  {
    id: 'task-103',
    projectId: 'proj-2',
    projectKey: 'AI-201',
    title: 'Design LangChain structured tool registry',
    description: 'Define query_workspace_tasks and rag_search tools with Zod schemas.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', email: 'david@acme.com' },
    dueDate: '2026-11-12',
    tags: ['Gemini', 'LangChain'],
    commentsCount: 8
  },
  {
    id: 'task-104',
    projectId: 'proj-2',
    projectKey: 'AI-202',
    title: 'Hybrid search with Reciprocal Rank Fusion (RRF)',
    description: 'Combine dense vector cosine distance with Postgres full-text tsvector.',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    assignee: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', email: 'elena@acme.com' },
    dueDate: '2026-11-15',
    tags: ['RAG', 'Search'],
    commentsCount: 2
  },
  {
    id: 'task-105',
    projectId: 'proj-3',
    projectKey: 'MOB-301',
    title: 'Linear-inspired keyboard shortcuts palette',
    description: 'Command+K palette for global navigation and quick task creation.',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: { name: 'Bob Smith', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', email: 'bob@acme.com' },
    dueDate: '2026-11-18',
    tags: ['Frontend', 'UI'],
    commentsCount: 1
  },
  {
    id: 'task-106',
    projectId: 'proj-3',
    projectKey: 'MOB-302',
    title: 'Offline indexedDB sync with service workers',
    description: 'Queue local state mutations and reconcile with backend upon reconnection.',
    status: 'BACKLOG',
    priority: 'LOW',
    assignee: { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'alice@acme.com' },
    dueDate: '2026-12-01',
    tags: ['Offline', 'PWA'],
    commentsCount: 0
  }
];

export const INITIAL_MEMBERS: FixtureMember[] = [
  {
    id: 'mem-1',
    name: 'Alice Walker',
    email: 'owner@acme.com',
    role: 'OWNER',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    department: 'Executive / Product',
    joinedDate: 'Jan 2026'
  },
  {
    id: 'mem-2',
    name: 'Bob Smith',
    email: 'developer@acme.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    department: 'Core Architecture',
    joinedDate: 'Feb 2026'
  },
  {
    id: 'mem-3',
    name: 'David Kim',
    email: 'david.kim@acme.com',
    role: 'MEMBER',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    department: 'AI & Machine Learning',
    joinedDate: 'Mar 2026'
  },
  {
    id: 'mem-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@acme.com',
    role: 'MEMBER',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    department: 'ML Engineering',
    joinedDate: 'Apr 2026'
  },
  {
    id: 'mem-5',
    name: 'Marcus Vance',
    email: 'marcus.v@contractor.io',
    role: 'GUEST',
    status: 'INVITED',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    department: 'Security Auditor',
    joinedDate: 'Nov 2026'
  }
];

export const INITIAL_DOCUMENTS: FixtureDocument[] = [
  {
    id: 'doc-1',
    title: 'AI WORK OS Technical Architecture Baseline.pdf',
    type: 'PDF',
    size: '2.4 MB',
    workspace: 'Engineering',
    ragStatus: 'INDEXED',
    chunksCount: 142,
    updatedAt: '2 hours ago',
    author: 'Alice Walker'
  },
  {
    id: 'doc-2',
    title: 'Multi-Tenant Security & Isolation Standards.docx',
    type: 'DOCX',
    size: '1.1 MB',
    workspace: 'Security',
    ragStatus: 'INDEXED',
    chunksCount: 86,
    updatedAt: 'Yesterday',
    author: 'Bob Smith'
  },
  {
    id: 'doc-3',
    title: 'Gemini 1.5 Pro Agent Tool Specification.md',
    type: 'MARKDOWN',
    size: '450 KB',
    workspace: 'AI Research',
    ragStatus: 'PROCESSING',
    chunksCount: 38,
    updatedAt: '3 hours ago',
    author: 'David Kim'
  },
  {
    id: 'doc-4',
    title: 'Q4 Product Roadmap & Sprint Milestones.spec',
    type: 'SPEC',
    size: '890 KB',
    workspace: 'General',
    ragStatus: 'INDEXED',
    chunksCount: 64,
    updatedAt: '3 days ago',
    author: 'Elena Rostova'
  }
];

export const INITIAL_MEETINGS: FixtureMeeting[] = [
  {
    id: 'meet-1',
    title: 'Daily Architecture Standup & Sprint Sync',
    time: '10:00 AM - 10:30 AM',
    duration: '30 mins',
    status: 'LIVE',
    participants: [
      { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { name: 'Bob Smith', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' }
    ]
  },
  {
    id: 'meet-2',
    title: 'LangChain Tooling & Gemini API Review',
    time: '02:00 PM - 03:00 PM',
    duration: '60 mins',
    status: 'UPCOMING',
    participants: [
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
      { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' }
    ]
  },
  {
    id: 'meet-3',
    title: 'Phase 1 Security & Tenant Verification Signoff',
    time: 'Yesterday at 4:00 PM',
    duration: '45 mins',
    status: 'RECORDED',
    participants: [
      { name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { name: 'Bob Smith', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }
    ],
    aiSummary:
      'Verified 17 automated tests for Argon2id hashing, JWT refresh rotation, and Prisma tenant isolation. All tests passing with 0 vulnerabilities.',
    actionItems: [
      'Deploy Docker Compose for local PostgreSQL 16 & Redis 7',
      'Begin Phase 2 Frontend Linear/Vercel design system implementation'
    ]
  }
];

export const INITIAL_NOTIFICATIONS: FixtureNotification[] = [
  {
    id: 'notif-1',
    title: 'Alice Walker mentioned you in CORE-101',
    description: 'Please review the pgvector index parameters for cosine ops.',
    timestamp: '10m ago',
    type: 'mention',
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'AI Sentinel completed background indexing',
    description: 'Document "Technical Architecture Baseline" has 142 chunks indexed.',
    timestamp: '1h ago',
    type: 'agent',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Task Assigned: Gemini Tool Registry',
    description: 'David Kim assigned AI-201 to you.',
    timestamp: '3h ago',
    type: 'task',
    isRead: true
  },
  {
    id: 'notif-4',
    title: 'Weekly Tenant Security Audit',
    description: 'Zero cross-tenant leaks detected in last 24,000 queries.',
    timestamp: '1d ago',
    type: 'system',
    isRead: true
  }
];
