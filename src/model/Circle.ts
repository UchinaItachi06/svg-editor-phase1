import { GeometryShape } from './GeometryShape.ts';
export class Circle extends GeometryShape {
  constructor(id: string, cx: number, cy: number, r: number) {
    super(id, { cx, cy, r }, ['cx'], ['cy'], ['r']);
  }
  get tag(): string {
    return 'circle';
  }
  clone(): Circle {
    return this.copyPresentation(
      new Circle(this.id, this.value('cx'), this.value('cy'), this.value('r')),
    );
  }
}
