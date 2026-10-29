import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class DeleteCommand extends EditCommand {
  private readonly id: string;
  constructor(id: string) { super(); this.id = id; }
  get name(): string { return 'delete'; }
  protected apply(document: Document): string { const shape = document.require(this.id); document.detach(shape); return shape.tag + '#' + this.id + ' deleted'; }
}
