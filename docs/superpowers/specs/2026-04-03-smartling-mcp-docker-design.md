# Smartling MCP Docker — Design Spec

**Date:** 2026-04-03  
**Status:** Approved

---

## Overview

A minimal stdio MCP server (Node.js, plain JS) that wraps the `smartling-cli` binary. Exposes a single MCP tool called `smartling-cli` that accepts raw CLI arguments and returns the command output. Packaged as a Docker image for easy drop-in use with Claude Code, Claude Desktop, or any MCP-compatible host.

---

## Architecture

```
[MCP host: Claude Code / Claude Desktop]
      ↕ stdio (JSON-RPC over stdin/stdout)
[MCP server: src/index.js  —  Node.js 20]
      ↕ child_process.execFile
[smartling-cli binary  —  Linux AMD64]
      ↕ HTTPS
[api.smartling.com]
```

The server is pure passthrough. It does not parse, validate, or transform arguments — it shells out directly to `smartling-cli` and returns the result.

---

## Credentials

Passed as environment variables to `docker run`:

```bash
docker run -i --rm \
  -e SMARTLING_USER_ID=xxx \
  -e SMARTLING_SECRET=xxx \
  -v /my/project:/my/project \
  smartling-mcp
```

`smartling-cli` reads `SMARTLING_USER_ID` and `SMARTLING_SECRET` from the environment natively. The MCP server does not touch credentials — they flow from Docker into the process environment and the CLI picks them up automatically.

---

## MCP Tool: `smartling-cli`

**Input schema:**

```json
{
  "type": "object",
  "properties": {
    "args": {
      "type": "string",
      "description": "Arguments to pass to smartling-cli, exactly as on the command line."
    }
  },
  "required": ["args"]
}
```

**Behavior:**
1. Split `args` string into an array (shell-aware split, respecting quoted strings).
2. Run `execFile('smartling-cli', argsArray, { env: process.env })`.
3. Return stdout + stderr combined as a single text content block.
4. On non-zero exit: include exit code in the returned text so the AI can reason about failures.

**Tool description** (embedded in server, used by the AI for command discovery):

```
Run any smartling-cli command. Pass arguments as a single string exactly as you would on the command line.

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
  mt translate /my/project/en.json -l es-ES fr-FR -p my-project-id
```

---

## File Access

Users mount host directories into the container with a 1:1 path mapping:

```bash
-v /my/project:/my/project
```

This means any absolute host path the AI references is valid inside the container without translation. The AI passes paths as-is to the tool.

---

## smartling.yml Requirement

`smartling-cli` requires a `smartling.yml` file to exist in the working directory, even if empty. The Docker image creates an empty one at `WORKDIR /app`:

```dockerfile
WORKDIR /app
RUN touch smartling.yml
```

The MCP server runs from `/app`, so this file is always present.

---

## Project Structure

```
smartling-mcp-docker/
├── src/
│   └── index.js          # entire MCP server (~60 lines)
├── smartling.yml         # empty, already exists in repo
├── package.json          # type: module, @modelcontextprotocol/sdk dep
└── Dockerfile
```

No build step. No TypeScript. No compilation.

---

## Dockerfile

```dockerfile
FROM node:20-alpine

# Install smartling-cli (Linux AMD64 binary)
RUN apk add --no-cache curl && \
    curl -fsSL https://smartling-connectors-releases.s3.amazonaws.com/cli/smartling.linux \
      -o /usr/local/bin/smartling-cli && \
    chmod +x /usr/local/bin/smartling-cli

WORKDIR /app

# Empty smartling.yml required by CLI
RUN touch smartling.yml

COPY package.json .
RUN npm install --omit=dev

COPY src/ src/

CMD ["node", "src/index.js"]
```

---

## package.json

```json
{
  "name": "smartling-mcp-docker",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  }
}
```

---

## Error Handling

- CLI exits non-zero → return combined stdout+stderr with exit code as text; do not throw.
- `execFile` fails to spawn (binary not found, etc.) → return the Node error message as text.
- No retries, no fallbacks. Errors are informational, returned to the AI as content.

---

## Usage (Claude Code / Claude Desktop config)

```json
{
  "mcpServers": {
    "smartling": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "SMARTLING_USER_ID",
        "-e", "SMARTLING_SECRET",
        "-v", "/my/project:/my/project",
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

Credentials go in the `env` section of the MCP config. Claude Code sets these as environment variables before running `docker`, then `-e SMARTLING_USER_ID` / `-e SMARTLING_SECRET` (no value) forwards them into the container.

---

## Out of Scope

- Auth token refresh or rotation
- Streaming CLI output (returns after command completes)
- Multiple simultaneous CLI calls (stdio MCP is inherently sequential)
- Windows/macOS binary support inside Docker (Linux image only)
