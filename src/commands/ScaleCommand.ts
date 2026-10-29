import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class ScaleCommand extends EditCommand {
  private readonly id: string; private readonly factor: number;
  constructor(id: string, factor: number) { super(); this.id = id; this.factor = factor; }
  get name(): string { return 'scale'; }
  protected apply(document: Document): string { const shape = document.require(this.id); shape.scale(this.factor); return shape.tag + '#' + this.id + ' scaled by ' + this.factor; }
}
