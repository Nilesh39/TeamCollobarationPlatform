import * as React from 'react';
import {
  FileText,
  UploadCloud,
  Search,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  Trash2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { INITIAL_DOCUMENTS, FixtureDocument } from '../lib/fixtures';

export function DocumentsPage() {
  const [documents, setDocuments] = React.useState<FixtureDocument[]>(INITIAL_DOCUMENTS);
  const [search, setSearch] = React.useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);

  // New Doc Form State
  const [docTitle, setDocTitle] = React.useState('');
  const [docType, setDocType] = React.useState<FixtureDocument['type']>('PDF');
  const [docWorkspace, setDocWorkspace] = React.useState('Engineering');

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.workspace.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const newDoc: FixtureDocument = {
      id: `doc-${Date.now().toString(36)}`,
      title: docTitle.endsWith(`.${docType.toLowerCase()}`) ? docTitle : `${docTitle}.${docType.toLowerCase()}`,
      type: docType,
      size: '1.8 MB',
      workspace: docWorkspace,
      ragStatus: 'INDEXED',
      chunksCount: Math.floor(Math.random() * 50) + 20,
      updatedAt: 'Just now',
      author: 'Alice Walker'
    };

    setDocuments([newDoc, ...documents]);
    toast('Document Ingested', `Indexed into pgvector with ${newDoc.chunksCount} chunks.`);
    setDocTitle('');
    setIsUploadModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast('Document Removed', `Deleted "${title}" and purged vector embeddings.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base (RAG)</h1>
            <Badge variant="cyan">pgvector 768d</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Store documents, technical manuals, and architecture specs for autonomous Gemini agent retrieval.
          </p>
        </div>

        <Button onClick={() => setIsUploadModalOpen(true)} size="sm">
          <UploadCloud className="w-3.5 h-3.5 mr-1" /> Upload Document
        </Button>
      </div>

      {/* Search & Index Telemetry Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search documents or query chunks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-mono text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Chunks HNSW Indexed
          </span>
          <span>·</span>
          <span>{documents.reduce((acc, d) => acc + d.chunksCount, 0)} Total Vector Embeddings</span>
        </div>
      </div>

      {/* Documents Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/40 border-b border-border/70 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5 pl-4">Document Title</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Workspace</th>
                <th className="p-3.5">Vector Status</th>
                <th className="p-3.5">Chunks</th>
                <th className="p-3.5">Updated</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-accent/20 transition-colors">
                  <td className="p-3.5 pl-4 font-semibold text-foreground flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate max-w-xs">{doc.title}</span>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {doc.type}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{doc.workspace}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={doc.ragStatus === 'INDEXED' ? 'success' : 'warning'}
                      className="text-[10px]"
                    >
                      {doc.ragStatus}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono text-foreground">{doc.chunksCount} chunks</td>
                  <td className="p-3.5 text-muted-foreground">{doc.updatedAt}</td>
                  <td className="p-3.5 text-right pr-4">
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                      title="Delete document and vector embeddings"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Upload Document */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document for RAG Indexing"
        description="Uploaded documents are automatically chunked and embedded using Gemini text-embedding-004."
      >
        <form onSubmit={handleUpload} className="space-y-4 pt-2">
          <Input
            label="Document Title"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus Protocol Specification"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Format</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="PDF">PDF Document</option>
                <option value="DOCX">Word (.docx)</option>
                <option value="MARKDOWN">Markdown (.md)</option>
                <option value="SPEC">Technical Spec</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Workspace</label>
              <select
                value={docWorkspace}
                onChange={(e) => setDocWorkspace(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/60 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Engineering">Engineering</option>
                <option value="Security">Security</option>
                <option value="AI Research">AI Research</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center bg-accent/10">
            <UploadCloud className="w-8 h-8 text-primary mb-2" />
            <div className="text-xs font-semibold text-foreground">Drag and drop file here, or click to browse</div>
            <p className="text-[10px] text-muted-foreground mt-1">Supports PDF, DOCX, TXT, CSV up to 25 MB</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Upload & Vectorize
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
