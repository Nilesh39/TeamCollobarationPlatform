import { z } from 'zod';

export const registerDocumentSchema = z.object({
  workspaceId: z.string().uuid('Valid workspace UUID is required'),
  title: z.string().min(2, 'Document title is required').max(255),
  storageKey: z.string().min(2),
  mimeType: z.string().default('application/pdf'),
  fileSize: z.number().positive('File size must be positive')
});

export type RegisterDocumentInput = z.infer<typeof registerDocumentSchema>;
