# Smartling MCP Docker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stdio MCP server in plain Node.js that wraps the `smartling-cli` binary behind a single passthrough tool, packaged as a Docker image.

**Architecture:** A two-file Node.js ESM server — `src/server.js` holds all tool logic (testable via import), `src/index.js` is a 3-line entrypoint that connects the stdio transport. The single MCP tool `smartling-cli` accepts a raw args string, splits it shell-aware, shells out to the binary, and returns combined stdout+stderr.

**Tech Stack:** Node.js 20, `@modelcontextprotocol/sdk` (latest), `node:test` (built-in test runner), Docker (node:20-alpine base).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Create | ESM config, deps, test script |
| `src/server.js` | Create | `splitArgs`, tool handler, server factory — exported for testing |
| `src/index.js` | Create | Entrypoint: connect stdio transport |
| `test/server.test.js` | Create | Unit tests for `splitArgs` and tool handler |
| `Dockerfile` | Create | Node 20 alpine + smartling-cli binary + image config |
| `smartling.yml` | Already exists | Empty file required by CLI — no changes needed |

---

## Task 1: Initialize package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "smartling-mcp-docker",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test test/server.test.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` written, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: init package.json with MCP SDK dep"
```

---

## Task 2: Write splitArgs with tests (TDD)

**Files:**
- Create: `test/server.test.js`
- Create: `src/server.js` (splitArgs only for now)

The only non-trivial logic in this server is splitting a CLI args string into an array while respecting quoted strings (e.g. `--format '{{.LocaleID}}'` must not be split on the space inside quotes).

- [ ] **Step 1: Write the failing tests**

Create `test/server.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: Error — `splitArgs is not exported` or module not found.

- [ ] **Step 3: Implement splitArgs in src/server.js**

Create `src/server.js`:

```js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export function splitArgs(argsString) {
  const args = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of argsString) {
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === ' ') {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) args.push(current);
  return args;
}
```

(Leave the rest of server.js incomplete for now — we add it in Task 3.)

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: 5 passing tests (splitArgs only — handler tests come in Task 3).

- [ ] **Step 5: Commit**

```bash
git add src/server.js test/server.test.js
git commit -m "feat: add splitArgs with tests"
```

---

## Task 3: Implement MCP server tool handler (TDD)

**Files:**
- Modify: `src/server.js` (add createServer, tool handler)
- Modify: `test/server.test.js` (add handler tests)

- [ ] **Step 1: Write failing handler tests**

Replace the entire `test/server.test.js` with the full file (adds `createServer` import and handler tests alongside the existing `splitArgs` tests):

```js
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
  const result = await handleToolCall({ name: 'smartling-cli', arguments: { args: 'projects list' } });

  assert.equal(result.content[0].type, 'text');
  assert.equal(result.content[0].text, 'project-id  My Project\n');
});

test('tool handler: includes stderr in output', async () => {
  const fakeExec = async () => ({ stdout: 'out', stderr: 'warn' });
  const { handleToolCall } = createServer(fakeExec);
  const result = await handleToolCall({ name: 'smartling-cli', arguments: { args: 'files list' } });
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
  const result = await handleToolCall({ name: 'smartling-cli', arguments: { args: 'files list -p bad-id' } });
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
  const result = await handleToolCall({ name: 'smartling-cli', arguments: { args: 'projects list' } });
  assert.ok(result.content[0].text.includes('Failed to run smartling-cli'));
});

test('tool handler: returns (no output) when both stdout and stderr are empty', async () => {
  const fakeExec = async () => ({ stdout: '', stderr: '' });
  const { handleToolCall } = createServer(fakeExec);
  const result = await handleToolCall({ name: 'smartling-cli', arguments: { args: 'files delete old.json' } });
  assert.equal(result.content[0].text, '(no output)');
});
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
npm test
```

Expected: `splitArgs` tests still pass; handler tests fail — `createServer` not exported / `handleToolCall` not a property.

- [ ] **Step 3: Complete src/server.js**

Replace the entire `src/server.js` with:

```js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export function splitArgs(argsString) {
  const args = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of argsString) {
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === ' ') {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) args.push(current);
  return args;
}

const TOOL_DESCRIPTION = `Run any smartling-cli command. Pass arguments as a single string exactly as you would on the command line.

Available commands:

PROJECTS
  projects list                          List all projects in the account
  projects info -p <project-id>          Show project details
  projects locales -p <project-id>       List target locales
    --short                              Output locale IDs only
    --source                             Show source locale only
    --format '<go-template>'             Custom output format

FILES
  files list [mask] -p <project-id>      List files in project
    --short                              URIs only
  files push <file> -p <project-id>      Upload a file
    --type <type>                        Override file type (e.g. json, yaml)
    --branch/-b <prefix>                 Add branch prefix to URI
  files pull <mask> -p <project-id>      Download translated files
    --source                             Download source only
    -l <locale>                          Filter by locale
  files delete <mask> -p <project-id>    Delete files
  files rename <old> <new>               Rename a file URI
  files status -p <project-id>           Show translation progress

MT (Machine Translation)
  mt detect <file>                       Detect source language of a file
    --short                              Output locale code only
    --type <type>                        Override file type
  mt translate <file> -p <project-id>    Machine translate a file
    --source-locale <locale>             Source language (auto-detected if omitted)
    -l <locale>                          Target locale(s)
    --input-directory <dir>              Source directory
    --output-directory <dir>             Output directory for translated files

GLOBAL FLAGS (all commands)
  -a, --account <account-id>             Override account ID
  -p, --project <project-id>             Override project ID

EXAMPLES
  projects list -a my-account-id
  files list -p my-project-id
  files push /my/project/en.json --type json -p my-project-id
  files pull "**.json" -l es-ES -p my-project-id
  mt translate /my/project/en.json -l es-ES fr-FR -p my-project-id`;

const TOOL_DEFINITION = {
  name: 'smartling-cli',
  description: TOOL_DESCRIPTION,
  inputSchema: {
    type: 'object',
    properties: {
      args: {
        type: 'string',
        description: 'Arguments to pass to smartling-cli, exactly as on the command line.'
      }
    },
    required: ['args']
  }
};

export function createServer(execFileFn = execFileAsync) {
  const server = new Server(
    { name: 'smartling-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  async function handleToolCall(request) {
    const { args } = request.arguments;
    const argsArray = splitArgs(args);

    try {
      const { stdout, stderr } = await execFileFn('smartling-cli', argsArray, { env: process.env });
      const output = [stdout, stderr].filter(Boolean).join('\n');
      return { content: [{ type: 'text', text: output || '(no output)' }] };
    } catch (error) {
      const output = [error.stdout, error.stderr].filter(Boolean).join('\n');
      const text = output
        ? `Exit code ${error.code}:\n${output}`
        : `Failed to run smartling-cli: ${error.message}`;
      return { content: [{ type: 'text', text }] };
    }
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [TOOL_DEFINITION] }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => handleToolCall(request.params));

  return { server, handleToolCall };
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests pass (splitArgs + handler tests).

- [ ] **Step 5: Commit**

```bash
git add src/server.js test/server.test.js
git commit -m "feat: add MCP server with smartling-cli tool and tests"
```

---

## Task 4: Write entrypoint

**Files:**
- Create: `src/index.js`

- [ ] **Step 1: Create src/index.js**

```js
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const { server } = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Smoke-test startup**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/index.js
```

Expected: JSON response containing `"name":"smartling-cli"`.

- [ ] **Step 3: Commit**

```bash
git add src/index.js
git commit -m "feat: add stdio entrypoint"
```

---

## Task 5: Write Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache curl && \
    curl -fsSL https://smartling-connectors-releases.s3.amazonaws.com/cli/smartling.linux \
      -o /usr/local/bin/smartling-cli && \
    chmod +x /usr/local/bin/smartling-cli

WORKDIR /app

RUN touch smartling.yml

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY src/ src/

CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Build the image**

```bash
docker build -t smartling-mcp .
```

Expected: Image builds successfully. No errors.

- [ ] **Step 3: Verify binary works inside container**

```bash
docker run --rm smartling-mcp smartling-cli --help
```

Wait — the container CMD starts the MCP server. Override the entrypoint to verify the binary:

```bash
docker run --rm --entrypoint smartling-cli smartling-mcp --help
```

Expected: Prints smartling-cli usage/help text.

- [ ] **Step 4: Verify MCP server starts inside container**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  docker run -i --rm smartling-mcp
```

Expected: JSON response containing `"name":"smartling-cli"`.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile
git commit -m "feat: add Dockerfile"
```

---

## Task 6: Add .dockerignore and README usage snippet

**Files:**
- Create: `.dockerignore`
- Modify: `smartling.yml` (already exists, no change)

- [ ] **Step 1: Create .dockerignore**

```
node_modules
test
docs
*.md
.git
```

- [ ] **Step 2: Rebuild to confirm smaller image**

```bash
docker build -t smartling-mcp .
docker image ls smartling-mcp
```

Expected: Image builds, size is reasonable (under ~200MB).

- [ ] **Step 3: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore"
```

---

## Task 7: End-to-end smoke test with real credentials

> Skip this task if you don't have real `SMARTLING_USER_ID` / `SMARTLING_SECRET` available.

**Files:** None — manual verification only.

- [ ] **Step 1: Run projects list via Docker**

```bash
docker run -i --rm \
  -e SMARTLING_USER_ID=$SMARTLING_USER_ID \
  -e SMARTLING_SECRET=$SMARTLING_SECRET \
  --entrypoint smartling-cli \
  smartling-mcp \
  projects list -a <your-account-id>
```

Expected: List of projects printed to stdout.

- [ ] **Step 2: Run MCP tool call end-to-end**

```bash
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "smartling-cli",
    "arguments": { "args": "projects list -a <your-account-id>" }
  }
}' | docker run -i --rm \
  -e SMARTLING_USER_ID=$SMARTLING_USER_ID \
  -e SMARTLING_SECRET=$SMARTLING_SECRET \
  smartling-mcp
```

Expected: JSON-RPC response with `result.content[0].text` containing project list.

---

## Claude Code / Claude Desktop Config Reference

Add to your MCP config (`~/.claude/settings.json` or Claude Desktop config):

```json
{
  "mcpServers": {
    "smartling": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "SMARTLING_USER_ID",
        "-e", "SMARTLING_SECRET",
        "-v", "/your/project:/your/project",
        "smartling-mcp"
      ],
      "env": {
        "SMARTLING_USER_ID": "your-user-id",
        "SMARTLING_SECRET": "your-secret"
      }
    }
  }
}
```
