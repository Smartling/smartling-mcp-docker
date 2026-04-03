import { strict as assert } from 'assert';
import { test } from 'node:test';
import { splitArgs } from '../src/server.js';

test('splitArgs: splits on spaces', () => {
  assert.deepEqual(splitArgs('files list -p proj-id'), ['files', 'list', '-p', 'proj-id']);
});

test('splitArgs: handles single-quoted strings', () => {
  assert.deepEqual(
    splitArgs("projects locales --format '{{.LocaleID}}'"),
    ['projects', 'locales', '--format', '{{.LocaleID}}']
  );
});

test('splitArgs: handles double-quoted strings', () => {
  assert.deepEqual(
    splitArgs('files push "my file.json" --type json'),
    ['files', 'push', 'my file.json', '--type', 'json']
  );
});

test('splitArgs: collapses multiple spaces', () => {
  assert.deepEqual(splitArgs('files  list'), ['files', 'list']);
});

test('splitArgs: returns empty array for empty string', () => {
  assert.deepEqual(splitArgs(''), []);
});
