import { EditCommand } from './EditCommand.ts';
import type { Document } from '../model/Document.ts';
import { Shape } from '../model/Shape.ts';
export class CreateCommand extends EditCommand {
  private readonly shape: Shape;
  private readonly parentId?: string;
  constructor(shape: Shape, parentId?: string) {
    super();
    this.shape = shape.clone();
    this.parentId = parentId;
  }
  get name(): string {
    return 'create';
  }
  protected apply(document: Document): string {
    const parent = this.parentId ? document.container(this.parentId) : undefined;
    document.insert(this.shape.clone(), parent);
    return this.shape.tag + '#' + this.shape.id + ' created' + (parent ? ' in g#' + parent.id : '');
  }
}
