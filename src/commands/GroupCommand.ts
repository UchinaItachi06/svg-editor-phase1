import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class GroupCommand extends EditCommand {
  private readonly id: string;
  private readonly ids: string[];
  constructor(id: string, ids: string[]) {
    super();
    this.id = id;
    this.ids = [...ids];
  }
  get name(): string {
    return 'group';
  }
  protected apply(document: Document): string {
    document.group(this.id, this.ids);
    return 'g#' + this.id + ' created with ' + this.ids.length + ' children';
  }
}
