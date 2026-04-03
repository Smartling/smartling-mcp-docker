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

### 1. Build the image

```bash
git clone https://github.com/Smartling/smartling-mcp-docker
cd smartling-mcp-docker
docker build -t smartling-mcp .
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
        "smartling-mcp"
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
        "smartling-mcp"
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
  projects info -p <project-id>          Show project details
  projects locales -p <project-id>       List target locales

FILES
  files list [mask] -p <project-id>      List files in project
  files push <file> -p <project-id>      Upload a file
  files pull <mask> -p <project-id>      Download translated files
  files delete <mask> -p <project-id>    Delete files
  files rename <old> <new>               Rename a file URI
  files status -p <project-id>           Show translation progress

MT (Machine Translation)
  mt detect <file>                       Detect source language
  mt translate <file> -p <project-id>    Machine translate a file

GLOBAL FLAGS
  -a, --account <account-id>             Override account ID
  -p, --project <project-id>             Override project ID
```

Full documentation: [smartling-cli wiki](https://github.com/Smartling/smartling-cli/wiki)
