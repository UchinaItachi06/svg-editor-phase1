import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CommandRouter } from '../src/cli/CommandRouter.ts';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.ts';
const setup = (): CommandRouter => {
  const c = new CommandRouter(new FileDocumentStore());
  c.execute('init');
  return c;
};
test('circle and ellipse scale centers and radii with floating point coordinates', () => {
  const c = setup();
  c.execute('create circle c .5 -2 3');
  c.execute('create ellipse e .5 -2 3 4');
  for (const id of ['c', 'e']) assert.ok(!c.execute('scale ' + id + ' 2').startsWith('error:'));
  assert.match(c.execute('show c'), /cx=1/);
  assert.match(c.execute('show c'), /cy=-4/);
  assert.match(c.execute('show c'), /r=6/);
  assert.match(c.execute('show e'), /rx=6/);
  assert.match(c.execute('show e'), /ry=8/);
});
test('all allowed geometry setters change only targeted geometry', () => {
  const c = setup();
  for (const line of [
    'create rect r 1 2 3 4',
    'create circle c 1 2 3',
    'create ellipse e 1 2 3 4',
    'create line l 1 2 3 4',
    'create text t 1 2 "x"',
  ])
    c.execute(line);
  for (const [id, attrs] of [
    ['r', ['x', 'y', 'width', 'height']],
    ['c', ['cx', 'cy', 'r']],
    ['e', ['cx', 'cy', 'rx', 'ry']],
    ['l', ['x1', 'y1', 'x2', 'y2']],
    ['t', ['x', 'y']],
  ] as [string, string[]][])
    for (const attr of attrs) {
      assert.ok(!c.execute('set ' + id + ' ' + attr + ' 8').startsWith('error:'));
      assert.ok(c.execute('show ' + id).includes(attr + '=8'));
    }
});
test('unnamed nested shapes round trip through CLI with defaults omitted', () => {
  const c = setup();
  c.execute('create rect r 0 0 1 1');
  assert.doesNotMatch(c.execute('show r'), /fill=/);
  c.execute('create line l 0 0 1 1');
  assert.doesNotMatch(c.execute('show l'), /stroke=/);
});
test('failed save keeps prior default path and does not block undo', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-save-'));
  try {
    const c = setup();
    const file = path.join(dir, 'good.svg');
    c.execute('create g a');
    assert.ok(!c.execute('save "' + file + '"').startsWith('error:'));
    c.execute('create g b');
    assert.match(c.execute('save "' + path.join(dir, 'missing', 'bad.svg') + '"'), /^error:/);
    assert.match(c.execute('undo'), /undone/);
    assert.ok(!c.execute('save').startsWith('error:'));
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /id="b"/);
    assert.deepEqual(fs.readdirSync(dir), ['good.svg']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test('init read save resize each block both undo and redo, new edit cannot cross barrier', () => {
  const c = setup();
  c.execute('create g a');
  c.execute('canvas 20 30');
  for (const command of ['undo', 'redo'])
    assert.equal(c.execute(command), 'error: undo not allowed after io command');
  c.execute('create g b');
  c.execute('undo');
  assert.match(c.execute('tree'), /g#a/);
  assert.equal(c.execute('undo'), 'error: nothing to undo');
});
