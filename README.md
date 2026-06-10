# Smartling MCP Docker

A Docker-based MCP (Model Context Protocol) server that wraps [`smartling-cli`](https://github.com/Smartling/smartling-cli) — the official Smartling command-line tool. This MCP server is a thin wrapper and can only do what `smartling-cli` supports. Refer to the [smartling-cli documentation](https://github.com/Smartling/smartling-cli/wiki) for the full list of capabilities and limitations.

## Requirements

- Docker
- Smartling account credentials

## Tools

| Tool | Description |
|---|---|
| `smartling-cli` | Run any `smartling-cli` command (projects, files, mt) |
| `smartling-ls` | List files in `/smartling` or a subdirectory |
| `smartling-cat` | Print the contents of a file inside `/smartling` |

## Setup

### 1. Pull the image

```bash
docker pull smartlinginc/smartling-cli-mcp
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
        "-e", "SMARTLING_ACCOUNT_ID",
        "-v", "/absolute/path/to/your/project:/smartling",
        "smartlinginc/smartling-cli-mcp"
      ],
      "env": {
        "SMARTLING_USER_ID": "your-user-id",
        "SMARTLING_SECRET": "your-secret",
        "SMARTLING_PROJECT_ID": "your-project-id",
        "SMARTLING_ACCOUNT_ID": "your-account-id"
      }
    }
  }
}
```

> **Important:** The volume mount must map to `/smartling` inside the container. The `smartling-ls` and `smartling-cat` tools only work within that path.
>
> `SMARTLING_ACCOUNT_ID` is required for most commands (`files push`, `projects list`, `glossaries *`, etc.). The MCP server injects it automatically as `-a <account-id>` — it is not natively supported by the CLI as an env var.

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
        "-e", "SMARTLING_ACCOUNT_ID",
        "-v", "/absolute/path/to/your/project:/smartling",
        "smartlinginc/smartling-cli-mcp"
      ],
      "env": {
        "SMARTLING_USER_ID": "your-user-id",
        "SMARTLING_SECRET": "your-secret",
        "SMARTLING_PROJECT_ID": "your-project-id",
        "SMARTLING_ACCOUNT_ID": "your-account-id"
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
        "-e", "SMARTLING_ACCOUNT_ID",
        "-v", "/absolute/path/to/your/project:/smartling",
        "-v", "/absolute/path/to/smartling.yml:/app/smartling.yml",
        "smartlinginc/smartling-cli-mcp"
      ],
      "env": {
        "SMARTLING_USER_ID": "your-user-id",
        "SMARTLING_SECRET": "your-secret",
        "SMARTLING_PROJECT_ID": "your-project-id",
        "SMARTLING_ACCOUNT_ID": "your-account-id"
      }
    }
  }
}
```

## Usage examples

Once configured, ask Claude naturally:

- *"List my Smartling projects"*
- *"Show files available for translation"*
- *"Push /smartling/en/strings.json to Smartling with URI en/strings.json"*
- *"Pull Spanish translations for all JSON files into /smartling"*
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

GLOSSARIES
  glossaries list                        List glossaries in the account
    --name <name>                        Filter by name
    --output simple|table|json           Output format
  glossaries create <name>               Create a new glossary
    --locale <locale>                    Add a locale (repeatable)
    --description <text>                 Optional description
    --verification-mode                  Enable verification mode
    --fallback-locale <from>:<to[,to]>   Fallback locale mapping (repeatable)
  glossaries export <uid|name> [file]    Export glossary entries to a file
    --file-type csv|xlsx|tbx             Export file format (required)
    --tbx-version v2|v3                  TBX version (required when --file-type=tbx)
    --focus-locale <locale>              Focus locale for the export
    --locale <locale>                    Include locale in export (repeatable)
    --skip-entries                       Skip glossary entries in the export
    --filter-query <text>                Filter entries by free-text query
    --filter-entry-state <state>         Filter entries by state
    --filter-locale <locale>             Filter by locale ID (repeatable)
    --filter-entry-uid <uid>             Filter by entry UID (repeatable)
    --filter-missing-translation-locale  Filter: locale missing a translation
    --filter-present-translation-locale  Filter: locale with a translation
    --filter-created-date <RFC3339>      Filter by created date
    --filter-last-modified-date <RFC3339> Filter by last modified date
  glossaries import <uid|name> <file>    Import glossary from CSV/XLSX/TBX
    --archive-mode                       Archive entries missing from the file
    --media-type <type>                  Override media type detection

GLOBAL FLAGS
  -a, --account <account-id>             Override account ID
  -p, --project <project-id>             Override project ID
```

Full documentation: [smartling-cli wiki](https://github.com/Smartling/smartling-cli/wiki)
