# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Dockerized MCP server for listing local files and uploading them to Smartling. Built with NestJS + `@rekog/mcp-nest`, following the same architecture as [Smartling/smartling-mcp-server](https://github.com/Smartling/smartling-mcp-server).

Two tools: `smartling_list_files` (browse mounted input directory) and `smartling_upload_file` (upload to Smartling project).

## Commands

```bash
npm run build          # Compile to dist/ (nest build)
npm run start:dev      # Dev with watch mode
npm run start:prod     # Run compiled output (node dist/main.js)
npm test               # Run all tests (jest)
npx jest --testPathPattern=<pattern>  # Run a single test file
npm run lint           # ESLint with --fix
npm run format         # Prettier on src/**/*.ts

# Docker
docker compose up --build   # Build and run container
docker compose build        # Build only
```

## Environment

Requires `.env` file (copy from `.env.example`). Key variables: `SMARTLING_USER_IDENTIFIER`, `SMARTLING_USER_SECRET`, `SMARTLING_PROJECT_ID`. Optional: `SMARTLING_API_BASE_URL`, `INPUT_DIR` (default `/workspace/input`), `PORT` (default `3000`).

## Architecture

NestJS app using CJS module system. Transports: STDIO + SSE + Streamable HTTP (endpoint: `/mcp`).

### Module Structure

- `AppModule` — wires `ConfigModule` (global), `McpModule.forRoot()`, and `SmartlingMcpModule`
- `SmartlingMcpModule` — registers tools via `McpModule.forFeature([...tools])`, provides services

### Adding a New Tool

Each tool follows this pattern — all four pieces are required:

1. **Schema** at `src/smartling-mcp/tools/{name}/schema/{name}.schema.ts` — exports `TOOL_NAME`, `TOOL_DESCRIPTION`, `TOOL_INPUT_SCHEMA` (Zod), `TOOL_OUTPUT_SCHEMA` (Zod), and `Params` type
2. **Tool class** at `src/smartling-mcp/tools/{name}/{name}.tool.ts` — `@Injectable()` class extending `BaseSmartlingTool`, with method decorated by `@Tool()` referencing the schema exports
3. **Service** (if calling Smartling API) at `src/smartling-mcp/services/{domain}/smartling-{domain}.service.ts` — extends `SmartlingBaseService`, uses `buildApiClient()` to get SDK clients
4. **Register** in `SmartlingMcpModule` — add to both `McpModule.forFeature([...])` and `providers`

### Key Base Classes

- `BaseSmartlingTool` — provides `createTextResponse(data)` and `createTextResponseFromString(data)` for MCP response formatting
- `SmartlingBaseService` — provides `buildApiClient<T>(constructor)` to instantiate any Smartling SDK API class, and `getErrorReason(error)` for error extraction
- `SmartlingApiPrebuilder` — NestJS injectable that creates `SmartlingApiClientBuilder` with auth from `ConfigService`

### Schemas

Use **Zod 4** (required by `@rekog/mcp-nest` >= 1.9.x). Import as `import z from 'zod'`.

### Path Security

`LocalFilesService` and `path-validation.utils.ts` enforce that all file access stays within `INPUT_DIR`. Path traversal and symlinks outside root are rejected. In Docker, the input directory is mounted read-only.

## TypeScript Config

- `tsconfig.json` has `"types": ["node", "jest"]` — this is intentional to avoid spurious errors from `@types/express`
- Target: ES2023, CommonJS output
- `noImplicitAny: false`, `strictNullChecks: true`

## Docker

Multi-stage build: Node 20 Alpine. Runs as non-root `appuser`. `sample-files/` is mounted at `/workspace/input:ro` in docker-compose.

## Reference

- Official Smartling MCP server (pattern source): `github.com/Smartling/smartling-mcp-server`
- Smartling Node SDK: `smartling-api-sdk-nodejs` package
