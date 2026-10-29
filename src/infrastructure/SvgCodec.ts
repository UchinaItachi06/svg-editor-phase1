import { DOMParser } from '@xmldom/xmldom';
import { Document } from '../model/Document.ts';
import { ShapeFactory } from '../model/ShapeFactory.ts';
import { Group } from '../model/Group.ts';
import type { Shape } from '../model/Shape.ts';
import { Values } from '../model/Values.ts';
export class SvgCodec {
  private readonly factory = new ShapeFactory();
  private escape(value: string, attr = false): string {
    let escaped = Values.xml(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\r', '&#13;');
    if (attr) escaped = escaped.replaceAll('\n', '&#10;').replaceAll('\t', '&#9;');
    return escaped;
  }
  encode(document: Document): string {
    const render = (shape: Shape, depth: number): string => {
      const indent = '  '.repeat(depth); const attrs = Object.entries(shape.attributes()).map(([k, v]) => k + '="' + this.escape(v, true) + '"').join(' ');
      if (shape.isContainer()) return indent + '<' + shape.tag + ' ' + attrs + '>\n' + shape.children().map(s => render(s, depth + 1)).join('') + indent + '</' + shape.tag + '>\n';
      if (shape.acceptsText()) return indent + '<' + shape.tag + ' ' + attrs + '>' + this.escape(shape.content()) + '</' + shape.tag + '>\n';
      return indent + '<' + shape.tag + ' ' + attrs + '/>\n';
    };
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + document.width + '" height="' + document.height + '" viewBox="0 0 ' + document.width + ' ' + document.height + '">\n' + document.children().map(shape => render(shape, 1)).join('') + '</svg>\n';
  }
  decode(source: string): { document: Document; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('invalid SVG: DTD and entities are unsupported');
    const errors: string[] = [];
    const xml = new DOMParser({ errorHandler: { warning: msg => errors.push(msg), error: msg => errors.push(msg), fatalError: msg => errors.push(msg) } }).parseFromString(source, 'image/svg+xml');
    const root = xml.documentElement;
    if (errors.length || !root || root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('invalid SVG: malformed XML or missing SVG namespace');
    const allowedRoot = ['xmlns', 'width', 'height', 'viewBox', 'id', 'version'];
    for (let i = 0; i < root.attributes.length; i++) if (!allowedRoot.includes(root.attributes.item(i)!.name)) throw new Error('unsupported SVG root attribute: ' + root.attributes.item(i)!.name);
    const dimension = (name: string, fallback: string): number => Values.positive((root.getAttribute(name) || fallback).replace(/px$/, ''), name);
    const document = new Document(dimension('width', '800'), dimension('height', '600'));
    if (root.hasAttribute('viewBox')) {
      const box = root.getAttribute('viewBox')!.trim().split(/[\s,]+/).map(v => Values.number(v));
      if (box.length !== 4 || box[0] !== 0 || box[1] !== 0 || box[2] !== document.width || box[3] !== document.height) throw new Error('unsupported SVG viewBox: expected 0 0 width height');
    }
    const reserved = new Set<string>(); const warnings: string[] = [];
    const elements = [root, ...Array.from({ length: root.getElementsByTagName('*').length }, (_, i) => root.getElementsByTagName('*').item(i)!)];
    for (const element of elements) if (element.hasAttribute('id')) { const id = Values.id(element.getAttribute('id')!); if (reserved.has(id)) throw new Error('id already exists: ' + id); reserved.add(id); }
    const importChildren = (element: typeof root, parent?: Group): void => {
      for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes.item(i)!;
        if (node.nodeType === 8 || node.nodeType === 7) continue;
        if (node.nodeType !== 1) { if (node.nodeValue?.trim()) throw new Error('invalid SVG: unexpected text outside text element'); continue; }
        const child = node as typeof root;
        if (child.namespaceURI !== root.namespaceURI) throw new Error('unsupported SVG namespace');
        const attrs = Object.fromEntries(Array.from({ length: child.attributes.length }, (_, j) => { const a = child.attributes.item(j)!; return [a.name, a.value]; }));
        let id = attrs.id;
        if (id === undefined) { let n = 1; while (reserved.has(child.localName + n)) n++; id = child.localName + n; reserved.add(id); warnings.push('warning: assigned id ' + id + ' to unnamed <' + child.localName + '>'); }
        const shape = this.factory.fromSvg(child.localName, id, attrs, child.textContent ?? '');
        document.insert(shape, parent);
        if (shape instanceof Group) importChildren(child, shape);
        else {
          if (child.getElementsByTagName('*').length) throw new Error('unsupported nested content in <' + child.localName + '>');
          if (!shape.acceptsText() && child.textContent?.trim()) throw new Error('invalid SVG: unexpected shape text');
        }
      }
    };
    importChildren(root); return { document, warnings };
  }
}
