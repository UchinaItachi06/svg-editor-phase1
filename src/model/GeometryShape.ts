import { Shape } from './Shape.ts';
import { Values } from './Values.ts';
export abstract class GeometryShape extends Shape {
  private readonly geometry = new Map<string, number>();
  private readonly positionsX: readonly string[];
  private readonly positionsY: readonly string[];
  private readonly sizes: readonly string[];
  protected constructor(id: string, values: Record<string, number>, xs: string[], ys: string[], sizes: string[]) {
    super(id); this.positionsX = xs; this.positionsY = ys; this.sizes = sizes;
    for (const [key, value] of Object.entries(values)) this.geometry.set(key, sizes.includes(key) ? Values.nonnegative(value, key) : Values.number(value, key));
  }
  protected value(name: string): number { return this.geometry.get(name)!; }
  override attributes(): Record<string, string> { return { ...super.attributes(), ...Object.fromEntries([...this.geometry].map(([k, v]) => [k, String(v)])) }; }
  override set(attr: string, value: string): void {
    if (!this.geometry.has(attr)) return super.set(attr, value);
    this.geometry.set(attr, this.sizes.includes(attr) ? Values.nonnegative(value, attr) : Values.number(value, attr));
  }
  move(dx: number, dy: number): void {
    Values.number(dx); Values.number(dy);
    for (const key of this.positionsX) this.geometry.set(key, Values.number(this.value(key) + dx));
    for (const key of this.positionsY) this.geometry.set(key, Values.number(this.value(key) + dy));
  }
  scale(factor: number): void {
    this.factor(factor);
    for (const [key, value] of this.geometry) this.geometry.set(key, Values.number(value * factor));
  }
  details(): string { return [...this.geometry].map(([k, v]) => k + '=' + v).join(' ') + (this.styleDetails() ? ' ' + this.styleDetails() : ''); }
}
