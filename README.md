# Smartling Docker MCP Server

Dockerized MCP server for listing local files and uploading them to Smartling. Built with NestJS following the same architecture as [Smartling/smartling-mcp-server](https://github.com/Smartling/smartling-mcp-server).

## Tools

| Tool | Description |
|---|---|
| `smartling_list_files` | List files in the mounted input directory, with optional subdirectory and glob filter |
| `smartling_upload_file` | Upload a file from the input directory to a Smartling project |

## Prerequisites

- Node.js >= 20
- Docker (for containerized usage)
- Smartling API credentials (User Identifier + User Secret)
- Smartling Project ID

## Setup

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Smartling credentials
```

## Required Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMARTLING_USER_IDENTIFIER` | Yes | — | Smartling API user identifier |
| `SMARTLING_USER_SECRET` | Yes | — | Smartling API user secret |
| `SMARTLING_PROJECT_ID` | Yes | — | Target Smartling project ID |
| `SMARTLING_API_BASE_URL` | No | `https://api.smartling.com` | Smartling API base URL |
| `INPUT_DIR` | No | `/workspace/input` | Path to allowed input directory |
| `PORT` | No | `3000` | HTTP server port |

## Run Locally

```bash
# Build
npm run build

# Start (uses STDIO + HTTP transports)
npm run start:prod

# Development with watch
npm run start:dev
```

## Run in Docker

```bash
# Build and start
docker compose up --build

# Or build separately
docker compose build
docker compose up
```

The `sample-files/` directory is mounted read-only at `/workspace/input` inside the container.

## Sample Folder Mount

The MCP server operates on files from a configured input directory. In Docker, this is a volume mount:

```yaml
volumes:
  - ./sample-files:/workspace/input:ro  # read-only mount
```

You can mount any local directory by changing the source path:

```yaml
volumes:
  - /path/to/your/files:/workspace/input:ro
```

## MCP Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "smartling-docker-mcp": {
      "command": "docker",
      "args": ["compose", "-f", "/path/to/smartling-docker-mcp/docker-compose.yml", "run", "--rm", "-T", "smartling-mcp"],
      "env": {
        "SMARTLING_USER_IDENTIFIER": "your_identifier",
        "SMARTLING_USER_SECRET": "your_secret",
        "SMARTLING_PROJECT_ID": "your_project_id"
      }
    }
  }
}
```

### Streamable HTTP

The server also exposes a Streamable HTTP endpoint at `http://localhost:3000/mcp`.

## Example Tool Calls

### List files

```json
{
  "name": "smartling_list_files",
  "arguments": {}
}
```

```json
{
  "name": "smartling_list_files",
  "arguments": {
    "subpath": "translations",
    "pattern": "*.json"
  }
}
```

### Upload file to Smartling

```json
{
  "name": "smartling_upload_file",
  "arguments": {
    "file_path": "hello.json",
    "file_type": "json"
  }
}
```

```json
{
  "name": "smartling_upload_file",
  "arguments": {
    "file_path": "greeting.xliff",
    "file_type": "xliff",
    "file_uri": "mobile/greeting.xliff"
  }
}
```

## Architecture

Follows the same NestJS + `@rekog/mcp-nest` pattern as the official Smartling MCP server:

- **Tools** use `@Tool()` decorator from `@rekog/mcp-nest` and extend `BaseSmartlingTool`
- **Services** extend `SmartlingBaseService` which uses `SmartlingApiPrebuilder` to construct SDK clients
- **Schemas** use Zod and are in separate schema files per tool
- **Path validation** prevents traversal outside the mounted input directory

```
src/
├── main.ts                          # NestJS bootstrap
├── app.module.ts                    # Root module (Config, MCP, SmartlingMcp)
├── config/index.ts                  # Environment configuration
├── commons/
│   └── smartling-api-prebuilder.ts  # SDK client factory
└── smartling-mcp/
    ├── smartling-mcp.module.ts      # MCP feature module
    ├── dto/                         # Response DTOs
    ├── enum/                        # Content type enum
    ├── services/
    │   ├── smartling-base.service.ts
    │   ├── files/                   # Smartling upload service
    │   └── local-files/             # Local filesystem service
    ├── tools/
    │   ├── base-smartling-tool.ts
    │   ├── list-files/              # list_files tool + schema
    │   └── upload-file/             # upload_file tool + schema
    └── utils/
        └── path-validation.utils.ts
```

## Security

- Only files inside the configured `INPUT_DIR` can be accessed
- Path traversal (`../`) is blocked
- Symlinks pointing outside the root directory are rejected
- Input directory is mounted read-only in Docker
- Container runs as non-root user
- Secrets are passed via environment variables only

## Assumptions

1. Uses Smartling v2 OAuth — SDK handles token lifecycle automatically
2. No job/batch association on upload — files appear in project's Files list
3. No locale specification on upload — source file only
4. `file_uri` defaults to relative path; overwrites if same URI exists
5. No Smartling directives exposed — can be added later
