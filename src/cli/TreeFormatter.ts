import type { Document } from '../model/Document.ts';
import type { Shape } from '../model/Shape.ts';
export class TreeFormatter {
  private label(shape: Shape): string {
    return shape.tag + '#' + shape.id + (shape.details() ? '  ' + shape.details() : '');
  }
  tree(document: Document, id?: string): string {
    const lines: string[] = [];
    const visit = (shape: Shape, prefix: string, branch: string): void => {
      lines.push(prefix + branch + this.label(shape));
      const children = shape.children();
      children.forEach((child, index) =>
        visit(
          child,
          prefix + (branch ? (branch === '└── ' ? '    ' : '│   ') : ''),
          index === children.length - 1 ? '└── ' : '├── ',
        ),
      );
    };
    if (id) visit(document.require(id), '', '');
    else {
      lines.push('svg (' + document.width + 'x' + document.height + ')');
      const children = document.children();
      children.forEach((child, index) =>
        visit(child, '', index === children.length - 1 ? '└── ' : '├── '),
      );
    }
    return lines.join('\n');
  }
  show(document: Document, id: string): string {
    const shape = document.require(id);
    const parent = document.parent(shape);
    const attrs = Object.entries(shape.attributes())
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => '  ' + key + '=' + value);
    if (shape.acceptsText()) attrs.push('  text=' + JSON.stringify(shape.content()));
    return (
      shape.tag +
      '#' +
      shape.id +
      '  parent=' +
      (parent ? 'g#' + parent.id : 'svg') +
      (attrs.length ? '\n' + attrs.join('\n') : '')
    );
  }
}
