# Smartling MCP Docker

A Docker-based MCP (Model Context Protocol) server that wraps the [`smartling-cli`](https://github.com/Smartling/smartling-cli) tool, enabling Claude and other MCP clients to interact with Smartling TMS directly.

## Requirements

- Docker
- Smartling account credentials

## Tools

| Tool | Description |
|---|---|
| `smartling-cli` | Run any `smartling-cli` command (projects, files, mt) |
| `smartling-ls` | List files in `/smartling` or a subdirectory |

## Setup

### 1. Pull the image

```bash
docker pull smartlinginc/smartling-docker-mcp
```

### 2. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "smartling": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "SMARTLING_USER_ID",
        "-e", "SMARTLING_SECRET",
        "-e", "SMARTLING_PROJECT_ID",
        "-v", "/absolute/path/to/your/project:/smartling",
        "smartlinginc/smartling-docker-mcp"
      ],
      "env": {
        "SMARTLING_USER_ID": "your-user-id",
        "SMARTLING_SECRET": "your-secret",
        "SMARTLING_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

> **Important:** The volume mount must map to `/smartling` inside the container. The `smartling-ls` tool only works within that path.

To use a custom `smartling.yml` (e.g. with file type mappings), mount it into `/app/smartling.yml` inside the container:

```json
"-v", "/absolute/path/to/your/project:/smartling",
"-v", "/absolute/path/to/smartling.yml:/app/smartling.yml",
```

Restart Claude Desktop after editing the config.

### 3. Configure Claude Code

Add to your project's `.claude/settings.json` or run `/mcp` in Claude Code:

```json
{
  "mcpServers": {
    "smartling": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "SMARTLING_USER_ID",
        "-e", "SMARTLING_SECRET",
        "-e", "SMARTLING_PROJECT_ID",
        "-v", "/absolute/path/to/your/project:/smartling",
        "smartlinginc/smartling-docker-mcp"
      ],
      "env": {
        "SMARTLING_USER_ID": "your-user-id",
        "SMARTLING_SECRET": "your-secret",
        "SMARTLING_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

With a custom `smartling.yml`:

```json
{
  "mcpServers": {
    "smartling": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "SMARTLING_USER_ID",
        "-e", "SMARTLING_SECRET",
        "-e", "SMARTLING_PROJECT_ID",
        "-v", "/absolute/path/to/your/project:/smartling",
        "-v", "/absolute/path/to/smartling.yml:/app/smartling.yml",
        "smartlinginc/smartling-docker-mcp"
      ],
      "env": {
        "SMARTLING_USER_ID": "your-user-id",
        "SMARTLING_SECRET": "your-secret",
        "SMARTLING_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

## Usage examples

Once configured, ask Claude naturally:

- *"List my Smartling projects"*
- *"Show files available for translation"*
- *"Push /smartling/en/strings.json to Smartling"*
- *"Pull Spanish translations for all JSON files"*
- *"Check translation status for my project"*
- *"Machine translate /smartling/en/strings.json to French"*

## Available `smartling-cli` commands

```
PROJECTS
  projects list                          List all projects in the account
  projects info                          Show details about the current project
  projects locales                       List target locales
    -s, --short                          Locale IDs only
    --source                             Source locale only
    --format '<go-template>'             Custom output format

FILES
  files list ['<mask>']                  List files in project
    --short                              URIs only
  files push <file> [<uri>]              Upload a file
    --type <type>                        Override file type (e.g. json, plaintext)
    -b, --branch <prefix>                Add branch prefix; @auto detects git branch
    --directive <directive>              Set file-level directive
  files pull ['<mask>']                  Download translated files
    --source                             Download source only
    -l <locale>                          Target locale (repeatable)
  files delete ['<mask>']               Delete files
  files rename <old-uri> <new-uri>       Rename a file URI
  files status                           Show translation progress

MT (Machine Translation)
  mt detect '<mask>'                     Detect source language
    -s, --short                          Output locale code only
    --output table|json                  Output format
  mt translate '<mask>'                  Machine translate files
    -l, --target-locale <locale>         Target locale (repeatable)
    --source-locale <locale>             Source language (auto-detected if omitted)
    --input-directory <dir>              Source directory
    --output-directory <dir>             Output directory

GLOBAL FLAGS
  -a, --account <account-id>             Override account ID
  -p, --project <project-id>             Override project ID
```

Full documentation: [smartling-cli wiki](https://github.com/Smartling/smartling-cli/wiki)
