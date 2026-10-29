import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class OrderCommand extends EditCommand {
  private readonly id: string;
  private readonly front: boolean;
  constructor(id: string, front: boolean) {
    super();
    this.id = id;
    this.front = front;
  }
  get name(): string {
    return 'order';
  }
  protected apply(document: Document): string {
    document.reorder(this.id, this.front);
    return this.id + ' moved to ' + (this.front ? 'front' : 'back');
  }
}
