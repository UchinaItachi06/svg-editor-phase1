import { Group } from './Group.ts';
import { Shape } from './Shape.ts';
import { Values } from './Values.ts';
export class Document {
  private w: number;
  private h: number;
  private readonly items: Shape[] = [];
  constructor(width = 800, height = 600) { this.w = Values.positive(width, 'width'); this.h = Values.positive(height, 'height'); }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  resize(width: number, height: number): void { const w = Values.positive(width, 'width'); const h = Values.positive(height, 'height'); this.w = w; this.h = h; }
  children(): readonly Shape[] { return [...this.items]; }
  all(): Shape[] { const result: Shape[] = []; const visit = (s: Shape): void => { result.push(s); s.children().forEach(visit); }; this.items.forEach(visit); return result; }
  find(id: string): Shape | undefined { return this.all().find(shape => shape.id === id); }
  require(id: string): Shape { const shape = this.find(id); if (!shape) throw new Error('no such shape: ' + id); return shape; }
  container(id: string): Group { const shape = this.find(id); if (!shape) throw new Error('no such container: ' + id); if (!(shape instanceof Group)) throw new Error('not a container: ' + id); return shape; }
  parent(shape: Shape): Group | undefined { return this.all().find(candidate => candidate.children().includes(shape)) as Group | undefined; }
  siblings(shape: Shape): readonly Shape[] { return this.parent(shape)?.children() ?? this.children(); }
  ensureAvailable(id: string): void { Values.id(id); if (this.find(id)) throw new Error('id already exists: ' + id); }
  insert(shape: Shape, parent?: Group, index?: number): void {
    if (parent && this.find(parent.id) !== parent) throw new Error('container does not belong to document');
    const ids = new Set<string>();
    const check = (node: Shape): void => { this.ensureAvailable(node.id); if (ids.has(node.id)) throw new Error('id already exists: ' + node.id); ids.add(node.id); node.children().forEach(check); }; check(shape);
    if (parent) parent.add(shape, index); else this.items.splice(index ?? this.items.length, 0, shape);
  }
  detach(shape: Shape): void { const parent = this.parent(shape); if (parent) parent.remove(shape); else { const index = this.items.indexOf(shape); if (index < 0) throw new Error('shape does not belong to document'); this.items.splice(index, 1); } }
  group(id: string, ids: string[]): void {
    this.ensureAvailable(id); if (!ids.length) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map(item => this.require(item));
    for (const item of selected) if (selected.some(other => other !== item && Group.contains(item, other))) throw new Error('cannot group a container into its own descendant: ' + item.id);
    const ordered = this.all().filter(shape => selected.includes(shape));
    const first = ordered[0]; const parent = this.parent(first); const index = this.siblings(first).indexOf(first);
    for (const item of ordered) this.detach(item);
    const group = new Group(id); for (const item of ordered) group.add(item);
    this.insert(group, parent, index);
  }
  ungroup(id: string): void {
    const group = this.container(id); const parent = this.parent(group);
    if (!parent) throw new Error('cannot ungroup top-level container: ' + id);
    const index = parent.children().indexOf(group); const children = group.children(); this.detach(group);
    for (let i = 0; i < children.length; i++) { group.remove(children[i]); this.insert(children[i], parent, index + i); }
  }
  addto(gid: string, id: string): void {
    const group = this.container(gid); const shape = this.require(id);
    if (Group.contains(shape, group)) throw new Error('cannot move a container into its own descendant: ' + id);
    this.detach(shape); this.insert(shape, group);
  }
  reorder(id: string, front: boolean): void { const shape = this.require(id); const parent = this.parent(shape); this.detach(shape); this.insert(shape, parent, front ? undefined : 0); }
  clone(): Document { const copy = new Document(this.w, this.h); for (const child of this.items) copy.insert(child.clone()); return copy; }
}
