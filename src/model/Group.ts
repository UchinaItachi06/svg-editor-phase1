import { Shape } from './Shape.ts';
export class Group extends Shape {
  private readonly items: Shape[] = [];
  constructor(id: string) {
    super(id);
  }
  get tag(): string {
    return 'g';
  }
  override children(): readonly Shape[] {
    return [...this.items];
  }
  override isContainer(): boolean {
    return true;
  }
  add(shape: Shape, index = this.items.length): void {
    if (shape === this || Group.contains(shape, this))
      throw new Error('cannot move a container into its own descendant: ' + shape.id);
    if (this.items.includes(shape)) throw new Error('shape is already in container: ' + shape.id);
    this.items.splice(index, 0, shape);
  }
  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index < 0) throw new Error('shape is not in container: ' + shape.id);
    this.items.splice(index, 1);
    return index;
  }
  move(dx: number, dy: number): void {
    for (const child of this.items) child.move(dx, dy);
  }
  scale(factor: number): void {
    this.factor(factor);
    for (const child of this.items) child.scale(factor);
  }
  details(): string {
    return this.styleDetails();
  }
  clone(): Group {
    const copy = this.copyPresentation(new Group(this.id));
    for (const child of this.items) copy.add(child.clone());
    return copy;
  }
  static contains(root: Shape, target: Shape): boolean {
    return root === target || root.children().some((child) => Group.contains(child, target));
  }
}
