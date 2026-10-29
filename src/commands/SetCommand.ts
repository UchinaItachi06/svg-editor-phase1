import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class SetCommand extends EditCommand {
  private readonly id: string; private readonly attr: string; private readonly value: string;
  constructor(id: string, attr: string, value: string) { super(); this.id = id; this.attr = attr; this.value = value; }
  get name(): string { return 'set'; }
  protected apply(document: Document): string { const shape = document.require(this.id); shape.set(this.attr, this.value); return shape.tag + '#' + this.id + ' updated: ' + this.attr + '=' + this.value; }
}
