import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CommandRouter } from '../src/cli/CommandRouter.ts';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.ts';
import { SvgCodec } from '../src/infrastructure/SvgCodec.ts';
import { Document } from '../src/model/Document.ts';
import { ShapeFactory } from '../src/model/ShapeFactory.ts';
import { Group } from '../src/model/Group.ts';
import { Rect } from '../src/model/Rect.ts';
const setup = (): CommandRouter => {
  const cli = new CommandRouter(new FileDocumentStore());
  assert.match(cli.execute('init'), /800x600/);
  return cli;
};
const ok = (cli: CommandRouter, line: string): string => {
  const result = cli.execute(line);
  assert.ok(!result.startsWith('error:'), line + ': ' + result);
  return result;
};
const svg = (body: string): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
  body +
  '</svg>';
const temp = (run: (dir: string) => void): void => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-editor-test-'));
  try {
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

test('no-document guard, help, comments and unknown commands', () => {
  const cli = new CommandRouter(new FileDocumentStore());
  assert.match(cli.execute('tree'), /no document/);
  assert.match(cli.execute('help'), /addto/);
  assert.equal(cli.execute('  # comment'), '');
  assert.equal(cli.execute('   '), '');
  assert.match(cli.execute('what'), /unknown command/);
});
for (const [type, params, attrs] of [
  ['rect', '1 2 3 4 red', ['x=1', 'y=2', 'width=3', 'height=4', 'fill=red']],
  ['circle', '1 2 3 blue', ['cx=1', 'cy=2', 'r=3', 'fill=blue']],
  ['ellipse', '1 2 3 4', ['cx=1', 'cy=2', 'rx=3', 'ry=4']],
  ['line', '1 2 3 4 black', ['x1=1', 'y1=2', 'x2=3', 'y2=4', 'stroke=black']],
  ['text', '1 2 "中文 title"', ['x=1', 'y=2', 'text="中文 title"']],
  ['g', '', ['parent=svg']],
] as const)
  test('create and inspect ' + type, () => {
    const cli = setup();
    ok(cli, 'create ' + type + ' s ' + params);
    const output = ok(cli, 'show s');
    for (const attr of attrs) assert.ok(output.includes(attr));
  });

test('create in nested groups and tree subtree', () => {
  const c = setup();
  ok(c, 'create g outer');
  ok(c, 'create g inner in outer');
  ok(c, 'create rect r 1 2 3 4 in inner');
  assert.match(ok(c, 'show r'), /parent=g#inner/);
  assert.ok(!ok(c, 'tree inner').includes('g#outer'));
  assert.match(ok(c, 'tree'), /width=3/);
});
test('id is unique and case-sensitive; delete makes ids available', () => {
  const c = setup();
  ok(c, 'create g r');
  ok(c, 'create g R');
  assert.equal(c.execute('create g r'), 'error: id already exists: r');
  ok(c, 'delete r');
  ok(c, 'create g r');
});
test('unknown type includes future box and unknown attribute', () => {
  const c = setup();
  assert.match(c.execute('create box b'), /unknown shape type: box/);
  ok(c, 'create rect r 0 0 1 1');
  assert.equal(c.execute('set r transform x'), 'error: unknown attribute: transform');
  assert.match(c.execute('set r r 1'), /unknown attribute/);
});
test('quoted content, empty content, escaped quotes and hash colors', () => {
  const c = setup();
  ok(c, 'create text t 0 0 "hello world"');
  ok(c, 'set t text ""');
  assert.match(c.execute('show t'), /text=""/);
  ok(c, String.raw`set t text "say \"hi\""`);
  assert.match(c.execute('show t'), /hi/);
  ok(c, 'create rect r 0 0 1 1 #ffffff');
  assert.match(c.execute('show r'), /#ffffff/);
  assert.match(c.execute('set t text "unfinished'), /unterminated/);
});
test('literal in in quoted text does not become a parent clause', () => {
  const c = setup();
  ok(c, 'create text t 0 0 "in"');
  assert.match(c.execute('show t'), /text="in"/);
});
test('invalid parent and invalid syntax leave state unchanged', () => {
  const c = setup();
  ok(c, 'create rect r 0 0 1 1');
  const before = c.execute('tree');
  assert.equal(c.execute('create g g in absent'), 'error: no such container: absent');
  assert.equal(c.execute('create g g in r'), 'error: not a container: r');
  assert.match(c.execute('canvas 1'), /usage/);
  assert.match(c.execute('move r 1'), /usage/);
  assert.equal(c.execute('tree'), before);
});
for (const line of [
  'scale r 0',
  'scale r -1',
  'scale r NaN',
  'move r Infinity 0',
  'move r 0x10 0',
  'set r width -1',
  'set r stroke-width -1',
  'create circle c 0 0 -1',
  'init 0 1',
  'canvas -1 2',
])
  test('reject invalid numbers atomically: ' + line, () => {
    const c = setup();
    ok(c, 'create rect r 1 2 3 4');
    const before = c.execute('tree');
    assert.match(c.execute(line), /^error:/);
    assert.equal(c.execute('tree'), before);
  });
test('move and scale all geometry recursively including line endpoints and text positions', () => {
  const c = setup();
  ok(c, 'create g g');
  ok(c, 'create rect r 1 2 3 4 in g');
  ok(c, 'create line l 1 2 3 4 in g');
  ok(c, 'create text t 1 2 "x" in g');
  ok(c, 'move g 2 3');
  ok(c, 'scale g 2');
  const r = c.execute('show r');
  assert.match(r, /x=6/);
  assert.match(r, /y=10/);
  assert.match(r, /width=6/);
  assert.match(r, /height=8/);
  assert.match(c.execute('show l'), /x2=10/);
  assert.match(c.execute('show l'), /y2=14/);
  assert.match(c.execute('show t'), /x=6/);
});
test('group style and leaf style survive clone and undo', () => {
  const c = setup();
  ok(c, 'create g g');
  ok(c, 'set g fill red');
  ok(c, 'create rect r 0 0 2 2 in g');
  ok(c, 'set r stroke blue');
  ok(c, 'set r stroke-width 2');
  ok(c, 'move g 1 1');
  ok(c, 'undo');
  assert.match(c.execute('show g'), /fill=red/);
  assert.match(c.execute('show r'), /stroke=blue/);
  assert.match(c.execute('show r'), /stroke-width=2/);
});
test('group keeps document order rather than argument order and is one undo unit', () => {
  const c = setup();
  for (const id of ['a', 'b', 'c']) ok(c, 'create g ' + id);
  const before = c.execute('tree');
  ok(c, 'group x c a');
  const tree = c.execute('tree');
  assert.ok(tree.indexOf('g#a') < tree.indexOf('g#c'));
  ok(c, 'undo');
  assert.equal(c.execute('tree'), before);
  ok(c, 'redo');
  assert.equal(c.execute('tree'), tree);
});
test('cross-parent grouping uses first preorder selected node parent and slot', () => {
  const c = setup();
  ok(c, 'create g outer');
  ok(c, 'create g a in outer');
  ok(c, 'create g b');
  ok(c, 'group x b a');
  assert.match(c.execute('show x'), /parent=g#outer/);
  assert.match(c.execute('show b'), /parent=g#x/);
});
test('ancestor plus descendant grouping, duplicate members and cycle moves fail atomically', () => {
  const c = setup();
  ok(c, 'create g p');
  ok(c, 'create g q in p');
  const before = c.execute('tree');
  assert.equal(
    c.execute('group bad q p'),
    'error: cannot group a container into its own descendant: p',
  );
  assert.match(c.execute('group bad q q'), /duplicate/);
  assert.match(c.execute('addto q p'), /own descendant/);
  assert.match(c.execute('addto p p'), /own descendant/);
  assert.equal(c.execute('tree'), before);
});
test('ungroup nested group occupies exact slot; root ungroup is forbidden', () => {
  const c = setup();
  ok(c, 'create g p');
  ok(c, 'create g a in p');
  ok(c, 'create g g in p');
  ok(c, 'create g x in g');
  ok(c, 'create g y in g');
  ok(c, 'create g b in p');
  const before = c.execute('tree');
  ok(c, 'ungroup g');
  assert.match(c.execute('show x'), /parent=g#p/);
  const tree = c.execute('tree');
  assert.ok(tree.indexOf('g#a') < tree.indexOf('g#x'));
  assert.ok(tree.indexOf('g#y') < tree.indexOf('g#b'));
  ok(c, 'undo');
  assert.equal(c.execute('tree'), before);
  assert.equal(c.execute('ungroup p'), 'error: cannot ungroup top-level container: p');
});
test('addto appends and undo restores parent and exact order', () => {
  const c = setup();
  for (const id of ['a', 'b', 'c']) ok(c, 'create g ' + id);
  ok(c, 'create g x in a');
  const before = c.execute('tree');
  ok(c, 'addto a b');
  const tree = c.execute('tree a');
  assert.ok(tree.indexOf('g#x') < tree.indexOf('g#b'));
  ok(c, 'undo');
  assert.equal(c.execute('tree'), before);
});
test('front and back reorder only siblings, reversible', () => {
  const c = setup();
  for (const id of ['a', 'b', 'c']) ok(c, 'create g ' + id);
  ok(c, 'create g inner in b');
  const before = c.execute('tree');
  ok(c, 'front a');
  assert.ok(c.execute('tree').indexOf('g#c') < c.execute('tree').indexOf('g#a'));
  ok(c, 'undo');
  assert.equal(c.execute('tree'), before);
  ok(c, 'back c');
  assert.ok(c.execute('tree').indexOf('g#c') < c.execute('tree').indexOf('g#a'));
  assert.match(c.execute('show inner'), /parent=g#b/);
});
test('delete subtree and undo restore complete hierarchy and styles', () => {
  const c = setup();
  ok(c, 'create g p');
  ok(c, 'create g q in p');
  ok(c, 'create circle c 1 2 3 red in q');
  const before = c.execute('tree');
  ok(c, 'delete p');
  assert.equal(c.execute('show c'), 'error: no such shape: c');
  ok(c, 'undo');
  assert.equal(c.execute('tree'), before);
  ok(c, 'redo');
  assert.equal(c.execute('tree'), 'svg (800x600)');
});
test('display commands preserve undo/redo; successful new edit discards redo', () => {
  const c = setup();
  ok(c, 'create g a');
  ok(c, 'undo');
  ok(c, 'help');
  ok(c, 'tree');
  ok(c, 'redo');
  ok(c, 'undo');
  ok(c, 'create g b');
  assert.equal(c.execute('redo'), 'error: nothing to redo');
});
test('failed edits preserve redo', () => {
  const c = setup();
  ok(c, 'create g a');
  ok(c, 'undo');
  assert.match(c.execute('delete absent'), /^error:/);
  ok(c, 'redo');
  assert.match(c.execute('tree'), /g#a/);
});
test('canvas query does not block history; resize and init introduce barriers', () => {
  const c = setup();
  ok(c, 'create g a');
  ok(c, 'canvas');
  ok(c, 'undo');
  ok(c, 'redo');
  ok(c, 'canvas 400 200');
  assert.equal(c.execute('undo'), 'error: undo not allowed after io command');
  assert.equal(c.execute('redo'), 'error: undo not allowed after io command');
  ok(c, 'create g b');
  ok(c, 'undo');
  assert.match(c.execute('tree'), /g#a/);
  assert.equal(c.execute('undo'), 'error: nothing to undo');
  ok(c, 'init');
  assert.equal(c.execute('tree'), 'svg (800x600)');
});
test('geometry overflow fails transaction without partial group move', () => {
  const c = setup();
  ok(c, 'create g g');
  ok(c, 'create circle a 1 2 3 in g');
  ok(c, 'create circle b 1e308 2 3 in g');
  const before = c.execute('tree');
  assert.match(c.execute('move g 1e308 0'), /^error:/);
  assert.equal(c.execute('tree'), before);
});

test('XML round trip preserves all six types, nesting, styles, text and z-order', () => {
  const f = new ShapeFactory();
  const d = new Document(400, 300);
  const g = new Group('scene');
  d.insert(g);
  for (const [t, p] of [
    ['rect', ['1', '2', '3', '4', 'red']],
    ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4']],
    ['line', ['1', '2', '3', '4', 'black']],
    ['text', ['1', '2', '中文 <&> " text']],
    ['g', []],
  ] as [string, string[]][])
    d.insert(f.create(t, t + '1', p), g);
  const codec = new SvgCodec();
  const source = codec.encode(d);
  assert.match(source, /&lt;&amp;&gt;/);
  const decoded = codec.decode(source);
  assert.equal(codec.encode(decoded.document), source);
  assert.deepEqual(decoded.warnings, []);
});
test('missing ids reserve all explicit ids before assigning deterministic names', () => {
  const result = new SvgCodec().decode(
    svg('<rect width="1" height="2"/><rect id="rect1"/><g><circle/></g>'),
  );
  assert.deepEqual(result.warnings, [
    'warning: assigned id rect2 to unnamed <rect>',
    'warning: assigned id g1 to unnamed <g>',
    'warning: assigned id circle1 to unnamed <circle>',
  ]);
  assert.ok(result.document.find('rect2'));
});
test('external SVG preserves allowed presentation and treats data-kind box as plain group', () => {
  const codec = new SvgCodec();
  const d = codec.decode(
    svg(
      '<g id="n" data-kind="box" fill="red"><text id="t" font-size="16" text-anchor="middle">Hello</text></g>',
    ),
  ).document;
  assert.equal(d.require('n').tag, 'g');
  assert.match(codec.encode(d), /font-size="16"/);
});
for (const [name, source] of [
  ['duplicate id', svg('<g id="x"><rect id="x"/></g>')],
  ['malformed', svg('<rect id="r">')],
  ['unknown shape', svg('<path id="p" d="M0 0"/>')],
  ['transform', svg('<g id="g" transform="rotate(30)"/>')],
  ['DTD', '<!DOCTYPE svg [<!ENTITY x "x">]>' + svg('')],
  ['namespace', '<svg><rect/></svg>'],
  [
    'viewBox',
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="1 0 400 300"/>',
  ],
  ['nested text markup', svg('<text id="t"><tspan>hello</tspan></text>')],
])
  test('reject unsupported or invalid external SVG: ' + name, () =>
    assert.throws(() => new SvgCodec().decode(source)),
  );
test('saved attribute whitespace and text carriage returns survive round trip', () => {
  const d = new Document();
  const t = new ShapeFactory().create('text', 't', ['1', '2', 'a\rb']);
  t.set('fill', 'a\nb\tc');
  d.insert(t);
  const codec = new SvgCodec();
  const source = codec.encode(d);
  assert.equal(codec.encode(codec.decode(source).document), source);
});
test('file save barriers, default path, read barrier and warning outputs', () =>
  temp((dir) => {
    const c = setup();
    ok(c, 'create rect r 0 0 2 3 red');
    const file = path.join(dir, 'my diagram.svg');
    ok(c, 'save "' + file + '"');
    assert.equal(c.execute('undo'), 'error: undo not allowed after io command');
    ok(c, 'move r 2 3');
    ok(c, 'save');
    assert.match(fs.readFileSync(file, 'utf8'), /x="2"/);
    ok(c, 'read "' + file + '"');
    assert.equal(c.execute('undo'), 'error: undo not allowed after io command');
    fs.writeFileSync(file, svg('<circle/>'));
    assert.match(ok(c, 'read "' + file + '"'), /warning: assigned id circle1/);
    assert.match(c.execute('tree'), /circle#circle1/);
  }));
test('file failures preserve document, history and current save path', () =>
  temp((dir) => {
    const c = setup();
    assert.match(c.execute('save'), /no file path/);
    ok(c, 'create g a');
    const before = c.execute('tree');
    assert.match(c.execute('read "' + path.join(dir, 'missing.svg') + '"'), /cannot read file/);
    assert.equal(c.execute('tree'), before);
    assert.match(
      c.execute('save "' + path.join(dir, 'missing', 'x.svg') + '"'),
      /cannot write file/,
    );
    ok(c, 'undo');
    assert.equal(c.execute('tree'), 'svg (800x600)');
  }));
test('malformed read preserves redo and previous document', () =>
  temp((dir) => {
    const c = setup();
    ok(c, 'create g a');
    ok(c, 'undo');
    const file = path.join(dir, 'bad.svg');
    fs.writeFileSync(file, svg('<g id="broken">'));
    assert.match(c.execute('read "' + file + '"'), /^error:/);
    ok(c, 'redo');
    assert.match(c.execute('tree'), /g#a/);
  }));
test('batch CLI processes comments and Unicode; errors set exit code and execution continues', () => {
  const cwd = fileURLToPath(new URL('..', import.meta.url));
  const result = spawnSync(process.execPath, ['src/main.ts'], {
    cwd,
    encoding: 'utf8',
    input: '# example\ninit\ncreate text t 1 2 "开始"\nmove absent 1 2\ntree\n',
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /text#t/);
  assert.match(result.stdout, /开始/);
  assert.match(result.stdout, /error: no such shape/);
  assert.equal(result.stderr, '');
});
test('document boundary rejects duplicate subtree ids and unowned parents', () => {
  const d = new Document();
  const g = new Group('g');
  g.add(new Rect('x', 0, 0, 1, 1));
  g.add(new Rect('x', 1, 1, 1, 1));
  assert.throws(() => d.insert(g), /id already exists/);
  assert.equal(d.all().length, 0);
  assert.throws(() => d.insert(new Group('x'), new Group('foreign')), /does not belong/);
});
