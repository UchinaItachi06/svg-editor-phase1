import { Document } from '../model/Document.ts';
export abstract class EditCommand {
  private before?: Document;
  private after?: Document;
  abstract get name(): string;
  protected abstract apply(document: Document): string;
  execute(document: Document): { document: Document; message: string } {
    const draft = document.clone();
    const message = this.apply(draft);
    this.before = document.clone();
    this.after = draft.clone();
    return { document: draft, message };
  }
  undo(): Document {
    if (!this.before) throw new Error('command has not executed');
    return this.before.clone();
  }
  redo(): Document {
    if (!this.after) throw new Error('command has not executed');
    return this.after.clone();
  }
}
