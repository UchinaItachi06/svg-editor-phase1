import { GeometryShape } from './GeometryShape.ts';
export class Rect extends GeometryShape {
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height }, ['x'], ['y'], ['width', 'height']);
  }
  get tag(): string {
    return 'rect';
  }
  clone(): Rect {
    return this.copyPresentation(
      new Rect(
        this.id,
        this.value('x'),
        this.value('y'),
        this.value('width'),
        this.value('height'),
      ),
    );
  }
}
