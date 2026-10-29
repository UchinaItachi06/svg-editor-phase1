import { Session } from '../application/Session.ts';
import type { DocumentStore } from '../application/DocumentStore.ts';
import { Document } from '../model/Document.ts';
import { ShapeFactory } from '../model/ShapeFactory.ts';
import { Values } from '../model/Values.ts';
import { Tokenizer } from './Tokenizer.ts';
import type { Token } from './Tokenizer.ts';
import { TreeFormatter } from './TreeFormatter.ts';
import { CreateCommand } from '../commands/CreateCommand.ts';
import { DeleteCommand } from '../commands/DeleteCommand.ts';
import { MoveCommand } from '../commands/MoveCommand.ts';
import { ScaleCommand } from '../commands/ScaleCommand.ts';
import { SetCommand } from '../commands/SetCommand.ts';
import { GroupCommand } from '../commands/GroupCommand.ts';
import { UngroupCommand } from '../commands/UngroupCommand.ts';
import { AddToCommand } from '../commands/AddToCommand.ts';
import { OrderCommand } from '../commands/OrderCommand.ts';
export class CommandRouter {
  private readonly session = new Session();
  private readonly tokenizer = new Tokenizer();
  private readonly formatter = new TreeFormatter();
  private readonly factory = new ShapeFactory();
  private readonly store: DocumentStore;
  private readonly handlers: Map<string, { syntax: string; min: number; max: number; run: (args: Token[]) => string }>;
  constructor(store: DocumentStore) {
    this.store = store;
    const value = (args: Token[], index: number): string => args[index].value;
    const number = (args: Token[], index: number): number => Values.number(value(args, index));
    // Phase 1's only command-name dispatch; future command registration goes here.
    this.handlers = new Map([
      ['init', { syntax: 'init [w] [h]', min: 0, max: 2, run: a => { const d = new Document(a[0] ? number(a, 0) : 800, a[1] ? number(a, 1) : 600); this.session.load(d); return 'canvas ' + d.width + 'x' + d.height + ' created'; } }],
      ['read', { syntax: 'read <file.svg>', min: 1, max: 1, run: a => { const file = value(a, 0); const result = this.store.read(file); this.session.load(result.document, file); return [...result.warnings, 'read ' + file + ' (' + result.document.all().length + ' elements)'].join('\n'); } }],
      ['save', { syntax: 'save [file.svg]', min: 0, max: 1, run: a => { const document = this.session.current(); const file = a[0]?.value ?? this.session.file; if (!file) throw new Error('no file path. use save <file.svg>'); this.store.write(file, document); this.session.saved(file); return 'saved to ' + file + ' (' + document.all().length + ' elements)'; } }],
      ['canvas', { syntax: 'canvas [w] [h]', min: 0, max: 2, run: a => { this.session.current(); if (a.length === 1) throw new Error('usage: canvas [w] [h]'); if (a.length) this.session.resize(number(a, 0), number(a, 1)); const d = this.session.current(); return 'canvas ' + d.width + 'x' + d.height; } }],
      ['create', { syntax: 'create <type> <id> [params...] [in <containerId>]', min: 2, max: Infinity, run: a => this.create(a) }],
      ['delete', { syntax: 'delete <id>', min: 1, max: 1, run: a => this.session.execute(new DeleteCommand(value(a, 0))) }],
      ['move', { syntax: 'move <id> <dx> <dy>', min: 3, max: 3, run: a => this.session.execute(new MoveCommand(value(a, 0), number(a, 1), number(a, 2))) }],
      ['scale', { syntax: 'scale <id> <factor>', min: 2, max: 2, run: a => this.session.execute(new ScaleCommand(value(a, 0), number(a, 1))) }],
      ['set', { syntax: 'set <id> <attr> <value>', min: 3, max: 3, run: a => this.session.execute(new SetCommand(value(a, 0), value(a, 1), value(a, 2))) }],
      ['group', { syntax: 'group <newGid> <id1> [id2...]', min: 2, max: Infinity, run: a => this.session.execute(new GroupCommand(value(a, 0), a.slice(1).map(t => t.value))) }],
      ['ungroup', { syntax: 'ungroup <gid>', min: 1, max: 1, run: a => this.session.execute(new UngroupCommand(value(a, 0))) }],
      ['addto', { syntax: 'addto <gid> <id>', min: 2, max: 2, run: a => this.session.execute(new AddToCommand(value(a, 0), value(a, 1))) }],
      ['front', { syntax: 'front <id>', min: 1, max: 1, run: a => this.session.execute(new OrderCommand(value(a, 0), true)) }],
      ['back', { syntax: 'back <id>', min: 1, max: 1, run: a => this.session.execute(new OrderCommand(value(a, 0), false)) }],
      ['tree', { syntax: 'tree [id]', min: 0, max: 1, run: a => this.formatter.tree(this.session.current(), a[0]?.value) }],
      ['show', { syntax: 'show <id>', min: 1, max: 1, run: a => this.formatter.show(this.session.current(), value(a, 0)) }],
      ['help', { syntax: 'help', min: 0, max: 0, run: () => [...this.handlers.values()].map(h => h.syntax).join('\n') }],
      ['undo', { syntax: 'undo', min: 0, max: 0, run: () => this.session.undo() }],
      ['redo', { syntax: 'redo', min: 0, max: 0, run: () => this.session.redo() }]
    ]);
  }
  private create(args: Token[]): string {
    const params = args.slice(2); let parent: string | undefined;
    if (params.length >= 2 && params.at(-2)!.value === 'in' && !params.at(-2)!.quoted) { parent = params.pop()!.value; params.pop(); }
    const shape = this.factory.create(args[0].value, args[1].value, params.map(t => t.value));
    return this.session.execute(new CreateCommand(shape, parent));
  }
  execute(line: string): string {
    try {
      const tokens = this.tokenizer.parse(line); if (!tokens.length) return '';
      const name = tokens[0].value; const handler = this.handlers.get(name); if (!handler) throw new Error('unknown command: ' + name);
      if (!['init', 'read', 'help'].includes(name)) this.session.current();
      const args = tokens.slice(1); if (args.length < handler.min || args.length > handler.max) throw new Error('usage: ' + handler.syntax);
      return handler.run(args);
    } catch (error) { return 'error: ' + (error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ') : String(error)); }
  }
}
