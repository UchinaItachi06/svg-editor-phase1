import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';

export class MoveCommand extends EditCommand {
  private readonly id: string;
  private readonly dx: number;
  private readonly dy: number;
  constructor(id: string, dx: number, dy: number) {
    super();
    this.id = id;
    this.dx = dx;
    this.dy = dy;
  }
  get name(): string {
    return 'move';
  }
  protected apply(document: Document): string {
    const shape = document.require(this.id);
    shape.move(this.dx, this.dy);
    return shape.tag + '#' + this.id + ' moved by (' + this.dx + ',' + this.dy + ')';
  }
}
