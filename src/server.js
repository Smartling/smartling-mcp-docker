import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
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
    'smartling-cli-ls',
    {
      description: 'List files in a directory. Only works within /smartling. Defaults to /smartling if no path given.',
      inputSchema: { path: z.string().optional().describe('Directory path to list, must start with /smartling, e.g. /smartling/src') }
    },
    async ({ path } = {}) => {
      if (path && !path.startsWith('/smartling')) {
        return { content: [{ type: 'text', text: 'Error: path must be within /smartling' }] };
      }
      const args = path ? ['-lah', path] : ['-lah', '/smartling'];
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
