import { GeometryShape } from './GeometryShape.ts';
import { Values } from './Values.ts';
export class Text extends GeometryShape {
  private text: string;
  constructor(id: string, x: number, y: number, text: string) {
    super(id, { x, y }, ['x'], ['y'], []);
    this.text = Values.xml(text);
  }
  get tag(): string {
    return 'text';
  }
  override acceptsText(): boolean {
    return true;
  }
  override content(): string {
    return this.text;
  }
  override set(attr: string, value: string): void {
    if (attr === 'text') this.text = Values.xml(value);
    else super.set(attr, value);
  }
  override details(): string {
    return super.details() + ' ' + JSON.stringify(this.text);
  }
  clone(): Text {
    return this.copyPresentation(new Text(this.id, this.value('x'), this.value('y'), this.text));
  }
}
