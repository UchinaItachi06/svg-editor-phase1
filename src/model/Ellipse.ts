import { GeometryShape } from './GeometryShape.ts';
export class Ellipse extends GeometryShape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, { cx, cy, rx, ry }, ['cx'], ['cy'], ['rx', 'ry']);
  }
  get tag(): string {
    return 'ellipse';
  }
  clone(): Ellipse {
    return this.copyPresentation(
      new Ellipse(this.id, this.value('cx'), this.value('cy'), this.value('rx'), this.value('ry')),
    );
  }
}
