import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../src/', import.meta.url));
const files = fs
  .readdirSync(source, { recursive: true })
  .filter((p): p is string => typeof p === 'string' && p.endsWith('.ts'));
const allowed: Record<string, string[]> = {
  model: ['model'],
  commands: ['commands', 'model'],
  application: ['application', 'commands', 'model'],
  cli: ['cli', 'application', 'commands', 'model'],
  infrastructure: ['infrastructure', 'application', 'model'],
};
test('every production class has its own matching file', () => {
  for (const file of files) {
    const content = fs.readFileSync(path.join(source, file), 'utf8');
    const classes = [...content.matchAll(/export (?:abstract )?class (\w+)/g)];
    assert.ok(classes.length <= 1, file);
    if (classes.length) assert.equal(path.basename(file, '.ts'), classes[0][1]);
  }
});
test('production imports obey declared module directions and core has no external IO', () => {
  for (const file of files) {
    const layer = file.split(path.sep)[0];
    if (file === 'main.ts') continue;
    const content = fs.readFileSync(path.join(source, file), 'utf8');
    for (const match of content.matchAll(/from ['"]([^'"]+)['"]/g)) {
      const dependency = match[1];
      if (dependency.startsWith('.')) {
        const resolved = path
          .relative(source, path.resolve(path.dirname(path.join(source, file)), dependency))
          .split(path.sep)[0];
        assert.ok(allowed[layer]?.includes(resolved), file + ' -> ' + resolved);
      } else assert.ok(['cli', 'infrastructure'].includes(layer), file + ' -> ' + dependency);
    }
  }
});
test('no tag switches or procedural exported functions in production', () => {
  for (const file of files) {
    const content = fs.readFileSync(path.join(source, file), 'utf8');
    assert.doesNotMatch(content, /switch\s*\(/, file);
    assert.doesNotMatch(content, /export\s+(?:async\s+)?function\s/, file);
  }
});
