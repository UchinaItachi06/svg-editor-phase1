import type { Document } from '../model/Document.ts';
export interface DocumentStore {
  read(path: string): { document: Document; warnings: string[] };
  write(path: string, document: Document): void;
}
