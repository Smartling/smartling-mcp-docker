# Smartling MCP — Claude Code Guide

## What this MCP does

Wraps the `smartling-cli` binary. Three tools are available:

- **`smartling-cli`** — run any smartling-cli command as a string
- **`smartling-ls`** — list files under `/smartling` (the mounted project directory)
- **`smartling-cat`** — print the contents of a file inside `/smartling`

## File access

User files are mounted at `/smartling` inside the container. Always use `/smartling/...` paths when referring to local files.

### URI convention for push/pull

When pushing a file, **always** provide an explicit `<uri>` argument that strips the `/smartling` prefix:

```
# Correct — URI is "en/strings.json" (relative, no /smartling prefix)
files push /smartling/en/strings.json en/strings.json --type json

# Wrong — URI becomes "/smartling/en/strings.json" (absolute container path)
files push /smartling/en/strings.json --type json
```

When pulling, **always** pass `--directory /smartling` so translated files are written back into the mounted directory:

```
# Correct
files pull '**.json' -l es-ES --directory /smartling

# Wrong — files land in /app/smartling/... (inside container, not in mounted dir)
files pull '**.json' -l es-ES
```

**Why this matters:** the pull format template preserves the full URI as the output path. If the URI contains `/smartling/en/strings.json` and you pull with `--directory /smartling`, Go's `filepath.Join` produces `/smartling/smartling/en/strings_es-ES.json` (double path). Keeping URIs as relative paths (e.g. `en/strings.json`) avoids this entirely.

Use `smartling-ls` (optionally with a path) to discover what files are available before operating on them. Use `smartling-cat` to inspect file contents.

## Credentials

`SMARTLING_USER_ID`, `SMARTLING_SECRET`, and `SMARTLING_PROJECT_ID` are injected automatically via Docker env. Do not ask the user for credentials and do not include them in commands.

`SMARTLING_ACCOUNT_ID` is also injected automatically by the MCP server as a `-a` flag on every command. Most commands need account ID - if it is not set, `projects list`, `files push`, `glossaries *`, and other account-scoped operations will fail with "parameter `AccountUID` cannot be empty".

## Common task patterns

**List available files:**
```
smartling-ls                              # list /smartling
smartling-ls path=/smartling/en          # list a subdirectory
```

**Read a file:**
```
smartling-cat path=/smartling/en/strings.json
```

**Upload a file:**
```
smartling-cli: "files push /smartling/en/strings.json en/strings.json --type json"
```

**Download translations:**
```
smartling-cli: "files pull '**.json' -l es-ES -l fr-FR --directory /smartling"
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

**List glossaries:**
```
smartling-cli: "glossaries list"
smartling-cli: "glossaries list --name 'Product Terms'"
```

**Export a glossary:**
```
smartling-cli: "glossaries export 'Product Terms' /smartling/glossary.xlsx --file-type xlsx"
smartling-cli: "glossaries export 'Product Terms' /smartling/glossary.csv --file-type csv --locale es-ES"
smartling-cli: "glossaries export 'Product Terms' /smartling/glossary.tbx --file-type tbx --tbx-version v3"
```

**Import an updated glossary:**
```
smartling-cli: "glossaries import 'Product Terms' /smartling/glossary.xlsx"
smartling-cli: "glossaries import 'Product Terms' /smartling/glossary.xlsx --archive-mode"
```

**Create a glossary:**
```
smartling-cli: "glossaries create 'Product Terms' --locale es-ES --locale fr-FR"
```
