import { Shape } from './Shape.ts';
import { Rect } from './Rect.ts';
import { Circle } from './Circle.ts';
import { Ellipse } from './Ellipse.ts';
import { Line } from './Line.ts';
import { Text } from './Text.ts';
import { Group } from './Group.ts';
import { Values } from './Values.ts';
type Definition = {
  fields: string[];
  optional?: 'fill' | 'stroke';
  text?: boolean;
  make: (id: string, values: number[], text: string) => Shape;
};
export class ShapeFactory {
  // Phase 1's only shape-name dispatch. Replace with provider registration in Phase 2.
  private readonly definitions = new Map<string, Definition>([
    [
      'rect',
      {
        fields: ['x', 'y', 'width', 'height'],
        optional: 'fill',
        make: (id, v) => new Rect(id, v[0], v[1], v[2], v[3]),
      },
    ],
    [
      'circle',
      {
        fields: ['cx', 'cy', 'r'],
        optional: 'fill',
        make: (id, v) => new Circle(id, v[0], v[1], v[2]),
      },
    ],
    [
      'ellipse',
      {
        fields: ['cx', 'cy', 'rx', 'ry'],
        optional: 'fill',
        make: (id, v) => new Ellipse(id, v[0], v[1], v[2], v[3]),
      },
    ],
    [
      'line',
      {
        fields: ['x1', 'y1', 'x2', 'y2'],
        optional: 'stroke',
        make: (id, v) => new Line(id, v[0], v[1], v[2], v[3]),
      },
    ],
    [
      'text',
      { fields: ['x', 'y'], text: true, make: (id, v, text) => new Text(id, v[0], v[1], text) },
    ],
    ['g', { fields: [], make: (id) => new Group(id) }],
  ]);
  private definition(type: string): Definition {
    const def = this.definitions.get(type);
    if (!def) throw new Error('unknown shape type: ' + type + ' (is the plugin loaded?)');
    return def;
  }
  create(type: string, id: string, params: string[]): Shape {
    const def = this.definition(type);
    const count = def.fields.length + (def.text ? 1 : 0);
    if (params.length < count || params.length > count + (def.optional ? 1 : 0))
      throw new Error('invalid parameters for ' + type);
    const shape = def.make(
      id,
      def.fields.map((field, i) => Values.number(params[i], field)),
      def.text ? params[count - 1] : '',
    );
    if (def.optional && params.length > count) shape.set(def.optional, params[count]);
    return shape;
  }
  fromSvg(type: string, id: string, attrs: Record<string, string>, text: string): Shape {
    const def = this.definition(type);
    const shape = def.make(
      id,
      def.fields.map((field) => Values.number(attrs[field] ?? '0', field)),
      text,
    );
    const presentation: Record<string, string> = {};
    const allowed = [
      'fill',
      'stroke',
      'stroke-width',
      'font-size',
      'font-family',
      'font-weight',
      'text-anchor',
      'opacity',
      'fill-opacity',
      'stroke-opacity',
      'stroke-linecap',
      'stroke-linejoin',
      'visibility',
      'display',
    ];
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'id' || def.fields.includes(key) || key.startsWith('data-') || key === 'xmlns')
        continue;
      if (!allowed.includes(key)) throw new Error('unsupported SVG attribute: ' + key);
      if (['fill', 'stroke', 'stroke-width'].includes(key)) shape.set(key, value);
      else presentation[key] = value;
    }
    shape.importPresentation(presentation);
    return shape;
  }
}
