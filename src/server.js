import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

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

Run --help on any command or subcommand to see all available options, e.g. "files push --help" or "mt translate --help".

GLOBAL FLAGS (supported by all commands)
  -a, --account <account-id>             Override account ID
  -p, --project <project-id>             Override project ID

PROJECTS
  projects list                          Display all projects in the account (fields: ID, ACCOUNT, NAME, LOCALE, STATUS)
  projects info                          Show details about the current project
  projects locales                       Display all target project locales with descriptions
    -s, --short                          Show locale IDs only
    --source                             Display only the source locale
    --format '<go-template>'             Custom output format, e.g. --format='{{if .Enabled}}{{.LocaleID}}{{end}}\n'

FILES
  files list ['<mask>']                  List files in project
    --short                              Show URIs only
    --format '<go-template>'             Custom output format
  files push <file> [<uri>]              Upload a file
    --type <type>                        Override file type detection (e.g. json, plaintext)
    --directive <directive>              Set file-level directive
    -b, --branch <prefix>                Add branch prefix to URI; use @auto to detect git branch
  files pull ['<mask>']                  Download translated files
    --source                             Download source file only
    -l <locale>                          Target locale (repeatable: -l es-ES -l fr-FR)
  files delete ['<mask>']                Delete files (also accepts piped URIs via -)
  files rename <old-uri> <new-uri>       Rename a file URI in the project
  files status                           Show translation progress for all files

MT (Machine Translation)
  mt detect '<mask>'                     Detect source language of files
    -s, --short                          Output locale code only
    --type <type>                        Override file type detection
    --input-directory <dir>              Source directory for input files
    --output table|json                  Output format
  mt translate '<mask>'                  Machine translate files to target locale(s)
    -l, --target-locale <locale>         Target locale (repeatable: -l es-ES -l fr)
    --source-locale <locale>             Source language (auto-detected if omitted)
    --input-directory <dir>              Source directory for input files
    --output-directory <dir>             Destination directory for translated files
    --type <type>                        Override file type detection

EXAMPLES
  projects list
  projects locales --short
  projects locales --format='{{if .Enabled}}{{.LocaleID}}{{end}}\n'
  files list
  files list '**.json' --short
  files push /smartling/en/strings.json --type json
  files push /smartling/en/strings.json strings/en.json
  files push '**.md' --type plaintext -b feature-branch
  files push '**.md' --branch '@auto'
  files pull '**.json' -l es-ES -l fr-FR
  files pull --source
  files delete '**.json'
  files rename old/path.json new/path.json
  files status
  mt detect document.txt
  mt detect '*.txt' --output json
  mt translate document.txt -l es-ES
  mt translate '*.txt' -l es -l fr --output-directory /smartling/translations/

Full command reference:
  https://github.com/Smartling/smartling-cli/wiki/Projects-command-examples
  https://github.com/Smartling/smartling-cli/wiki/Files-command-examples
  https://github.com/Smartling/smartling-cli/wiki/MT-command-examples`;

export function createServer(execFileFn = execFileAsync) {
  const server = new McpServer({ name: 'smartling-mcp', version: '1.0.0' });

  async function handleToolCall({ args }) {
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

  server.registerTool(
    'smartling-cli',
    {
      description: TOOL_DESCRIPTION,
      inputSchema: { args: z.string().describe('Arguments to pass to smartling-cli, exactly as on the command line.') }
    },
    handleToolCall
  );

  server.registerTool(
    'smartling-ls',
    {
      description: 'List files in a smartling working directory. Only works within /smartling. Defaults to /smartling if no path given.',
      inputSchema: { path: z.string().optional().describe('Directory path to list, must start with /smartling, e.g. /smartling/src') }
    },
    async ({ path } = {}) => {
      const resolved = resolve(path ?? '/smartling');
      if (resolved !== '/smartling' && !resolved.startsWith('/smartling/')) {
        return { content: [{ type: 'text', text: 'Error: path must be within /smartling' }] };
      }
      const args = ['-lah', resolved];
      try {
        const { stdout } = await execFileFn('ls', args, { env: process.env });
        return { content: [{ type: 'text', text: stdout || '(empty directory)' }] };
      } catch (error) {
        const output = [error.stdout, error.stderr].filter(Boolean).join('\n');
        return { content: [{ type: 'text', text: output || `Failed to list files: ${error.message}` }] };
      }
    }
  );

  return { server, handleToolCall };
}
