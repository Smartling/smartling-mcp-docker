import { strict as assert } from 'assert';
import { test } from 'node:test';
import { splitArgs, createServer } from '../src/server.js';

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

test('tool handler: returns stdout on success', async () => {
  const fakeExec = async (cmd, args) => ({
    stdout: 'project-id  My Project\n',
    stderr: ''
  });

  const { handleToolCall } = createServer(fakeExec);
  const result = await handleToolCall({ args: 'projects list' });

  assert.equal(result.content[0].type, 'text');
  assert.equal(result.content[0].text, 'project-id  My Project\n');
});

test('tool handler: includes stderr in output', async () => {
  const fakeExec = async () => ({ stdout: 'out', stderr: 'warn' });
  const { handleToolCall } = createServer(fakeExec);
  const result = await handleToolCall({ args: 'files list' });
  assert.ok(result.content[0].text.includes('out'));
  assert.ok(result.content[0].text.includes('warn'));
});

test('tool handler: returns exit code on non-zero exit', async () => {
  const fakeExec = async () => {
    const err = new Error('Command failed');
    err.code = 1;
    err.stdout = '';
    err.stderr = 'Error: project not found';
    throw err;
  };
  const { handleToolCall } = createServer(fakeExec);
  const result = await handleToolCall({ args: 'files list -p bad-id' });
  assert.ok(result.content[0].text.includes('Exit code 1'));
  assert.ok(result.content[0].text.includes('project not found'));
});

test('tool handler: handles spawn failure gracefully', async () => {
  const fakeExec = async () => {
    const err = new Error('spawn smartling-cli ENOENT');
    err.code = 'ENOENT';
    throw err;
  };
  const { handleToolCall } = createServer(fakeExec);
  const result = await handleToolCall({ args: 'projects list' });
  assert.ok(result.content[0].text.includes('Failed to run smartling-cli'));
});

test('tool handler: returns (no output) when both stdout and stderr are empty', async () => {
  const fakeExec = async () => ({ stdout: '', stderr: '' });
  const { handleToolCall } = createServer(fakeExec);
  const result = await handleToolCall({ args: 'files delete old.json' });
  assert.equal(result.content[0].text, '(no output)');
});
