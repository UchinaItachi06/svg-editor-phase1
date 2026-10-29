import { History } from './History.ts';
import type { Document } from '../model/Document.ts';
import type { EditCommand } from '../commands/EditCommand.ts';
export class Session {
  private document?: Document;
  private path?: string;
  private readonly history = new History();
  current(): Document { if (!this.document) throw new Error("no document. use 'init' or 'read' first"); return this.document; }
  get file(): string | undefined { return this.path; }
  load(document: Document, path?: string): void { this.document = document; this.path = path; this.history.barrier(); }
  saved(path: string): void { this.path = path; this.history.barrier(); }
  resize(width: number, height: number): void { const draft = this.current().clone(); draft.resize(width, height); this.document = draft; this.history.barrier(); }
  execute(command: EditCommand): string { const result = command.execute(this.current()); this.document = result.document; this.history.record(command); return result.message; }
  undo(): string { this.current(); const result = this.history.undo(); this.document = result.document; return result.message; }
  redo(): string { this.current(); const result = this.history.redo(); this.document = result.document; return result.message; }
}
