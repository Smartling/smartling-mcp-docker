# Smartling MCP — Claude Code Guide

## What this MCP does

Wraps the `smartling-cli` binary. Two tools are available:

- **`smartling-cli`** — run any smartling-cli command as a string
- **`smartling-ls`** — list files under `/smartling` (the mounted project directory)

## File access

User files are mounted at `/smartling` inside the container. Always use `/smartling/...` paths when referring to files:

```
# Correct
files push /smartling/en/strings.json --type json

# Wrong
files push ./en/strings.json
```

Use `smartling-ls` (optionally with a path) to discover what files are available before operating on them.

## Credentials

`SMARTLING_USER_ID`, `SMARTLING_SECRET`, and `SMARTLING_PROJECT_ID` are injected automatically via Docker env. Do not ask the user for credentials and do not include them in commands.

## Common task patterns

**List available files:**
```
smartling-ls                              # list /smartling
smartling-ls path=/smartling/en          # list a subdirectory
```

**Upload a file:**
```
smartling-cli: "files push /smartling/en/strings.json --type json"
```

**Download translations:**
```
smartling-cli: "files pull '**.json' -l es-ES fr-FR"
```

**Check translation progress:**
```
smartling-cli: "files status"
```

**List projects (needs --account if SMARTLING_PROJECT_ID not set):**
```
smartling-cli: "projects list -a <account-id>"
```

**Machine translate:**
```
smartling-cli: "mt translate /smartling/en/strings.json -l es-ES"
```
