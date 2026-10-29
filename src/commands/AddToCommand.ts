import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class AddToCommand extends EditCommand {
  private readonly gid: string; private readonly id: string;
  constructor(gid: string, id: string) { super(); this.gid = gid; this.id = id; }
  get name(): string { return 'addto'; }
  protected apply(document: Document): string { document.addto(this.gid, this.id); return this.id + ' moved into g#' + this.gid; }
}
