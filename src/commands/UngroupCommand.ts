import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class UngroupCommand extends EditCommand {
  private readonly id: string;
  constructor(id: string) { super(); this.id = id; }
  get name(): string { return 'ungroup'; }
  protected apply(document: Document): string { document.ungroup(this.id); return 'g#' + this.id + ' ungrouped'; }
}
