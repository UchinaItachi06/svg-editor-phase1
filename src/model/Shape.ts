import { Values } from './Values.ts';
export abstract class Shape {
  private readonly identifier: string;
  private readonly presentation = new Map<string, string>();
  protected constructor(id: string) {
    this.identifier = Values.id(id);
  }
  get id(): string {
    return this.identifier;
  }
  abstract get tag(): string;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract details(): string;
  children(): readonly Shape[] {
    return [];
  }
  isContainer(): boolean {
    return false;
  }
  acceptsText(): boolean {
    return false;
  }
  content(): string {
    return '';
  }
  attributes(): Record<string, string> {
    return { id: this.id, ...Object.fromEntries(this.presentation) };
  }
  set(attr: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attr))
      throw new Error('unknown attribute: ' + attr);
    if (attr === 'stroke-width') Values.nonnegative(value, attr);
    this.presentation.set(attr, Values.xml(value));
  }
  importPresentation(attrs: Record<string, string>): void {
    for (const [key, value] of Object.entries(attrs)) this.presentation.set(key, Values.xml(value));
  }
  protected copyPresentation<T extends Shape>(copy: T): T {
    copy.importPresentation(Object.fromEntries(this.presentation));
    return copy;
  }
  protected styleDetails(): string {
    return [...this.presentation].map(([k, v]) => k + '=' + v).join(' ');
  }
  protected factor(value: number): number {
    return Values.positive(value, 'scale factor');
  }
}
