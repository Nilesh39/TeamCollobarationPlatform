import * as React from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  Paperclip,
  RotateCcw,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/toast';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  toolCall?: { name: string; args: string; result: string };
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    sender: 'user',
    content: 'Find all overdue or high-priority tasks in Project CORE and draft an architectural summary.',
    timestamp: '10:24 AM'
  },
  {
    id: 'm-2',
    sender: 'agent',
    content: `I queried your active PostgreSQL task database using the \`query_workspace_tasks\` tool.

Here is the status breakdown for **Project CORE (Core Platform Architecture)**:
1. **CORE-101 (PostgreSQL 16 pgvector HNSW Indexing)** — Marked **DONE**.
2. **CORE-102 (Sliding JWT Refresh Rotation)** — Marked **DONE**.
3. **AI-201 (LangChain Structured Tooling)** — **IN PROGRESS** with due date Nov 12.

**Suggested Next Steps:**
- All cryptographic primitives have passed regression tests (17 passed).
- We can proceed to trigger document vector embeddings for technical specifications.`,
    toolCall: {
      name: 'query_workspace_tasks',
      args: '{ "projectId": "proj-1", "priority": "HIGH" }',
      result: 'Found 3 matching tasks. 2 DONE, 1 IN_PROGRESS.'
    },
    timestamp: '10:25 AM'
  }
];

export function AiAssistantPage() {
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [agentModel, setAgentModel] = React.useState('gemini-1.5-pro');

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate Agent Reasoning Loop with Tool Calling
    setTimeout(() => {
      const agentMsg: Message = {
        id: `agt-${Date.now()}`,
        sender: 'agent',
        content: `I've analyzed your request: "${text}".\n\nUsing **${agentModel}** with hybrid RAG retrieval, I verified your workspace context. All data isolation boundaries are enforced with 768-dimensional pgvector cosine search.`,
        toolCall: {
          name: 'rag_hybrid_search',
          args: `{ "query": "${text.substring(0, 30)}...", "limit": 3 }`,
          result: 'Retrieved 3 document chunks from technical specification knowledge base.'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
      toast('Agent Replied', 'Gemini reasoning loop completed.');
    }, 1200);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      {/* Agent Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">AI WorkOS Sentinel</h1>
              <Badge variant="purple" className="text-[10px]">Autonomous Agent</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Connected to PostgreSQL, pgvector RAG memory, and LangChain tools.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={agentModel}
            onChange={(e) => setAgentModel(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none cursor-pointer"
          >
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast High-Throughput)</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages(INITIAL_MESSAGES);
              toast('Chat Cleared', 'Conversation memory reset.');
            }}
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Chat Messages Viewport */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1 px-1">
              <span>{msg.sender === 'user' ? 'You' : 'AI Sentinel'}</span>
              <span>·</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Tool execution badge if present */}
            {msg.toolCall && (
              <div className="mb-2 p-2 rounded-lg bg-accent/40 border border-border max-w-lg text-[11px] font-mono space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <Terminal className="w-3.5 h-3.5" /> Executed Tool: {msg.toolCall.name}
                </div>
                <div className="text-muted-foreground text-[10px]">{msg.toolCall.args}</div>
                <div className="text-emerald-500 text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {msg.toolCall.result}
                </div>
              </div>
            )}

            <div
              className={`max-w-3xl xl:max-w-4xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                  : 'bg-card border border-border text-foreground rounded-tl-none whitespace-pre-wrap'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground bg-accent/30 rounded-xl w-fit">
            <Sparkles className="w-4 h-4 text-primary animate-spin" />
            <span>AI Sentinel is reasoning with LangChain tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Prompt Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {[
          'Summarize overdue tasks in Project CORE',
          'Search security architecture standards in RAG',
          'Calculate sprint delivery velocity for Q4'
        ].map((promptText, i) => (
          <button
            key={i}
            onClick={() => handleSend(promptText)}
            className="px-3 py-1.5 rounded-full text-[11px] bg-accent/40 hover:bg-accent text-muted-foreground hover:text-foreground border border-border transition-colors whitespace-nowrap cursor-pointer"
          >
            💡 {promptText}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card shadow-lg shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Sentinel to search documents, query tasks or automate workflow..."
          className="flex-1 bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || isTyping}>
          <Send className="w-3.5 h-3.5 mr-1" /> Send
        </Button>
      </form>
    </div>
  );
}
