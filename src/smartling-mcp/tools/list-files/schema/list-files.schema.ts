import z from 'zod';

export const LIST_FILES_TOOL_NAME = 'smartling_list_files';
export const LIST_FILES_TOOL_DESCRIPTION = `List files in the mounted input directory.

# Use cases
- User wants to see which files are available for upload to Smartling.
- User wants to browse subdirectories of the input folder.
- User wants to filter files by pattern (e.g. only JSON files).

# Examples
- List all files in root:
{} (no parameters)

- List files in a subdirectory:
{
    "subpath": "translations"
}

- Filter by pattern:
{
    "pattern": "*.json"
}

- Combine both:
{
    "subpath": "content",
    "pattern": "*.xliff"
}`;

export const LIST_FILES_TOOL_INPUT_SCHEMA = z.object({
  subpath: z
    .string()
    .optional()
    .describe(
      'Subdirectory to list within the input folder. Must be a relative path. Do not use absolute paths or path traversal (../).',
    ),
  pattern: z
    .string()
    .optional()
    .describe(
      "Glob pattern to filter files by name, e.g. '*.json', '*.xliff'. If not provided, all files are listed.",
    ),
});

const fileEntrySchema = z.object({
  name: z.string().describe('File or directory name'),
  path: z.string().describe('Relative path from input root'),
  size: z.number().describe('File size in bytes'),
  isDirectory: z.boolean().describe('Whether this entry is a directory'),
  modifiedAt: z.string().describe('Last modification time in ISO 8601 format'),
});

export const LIST_FILES_TOOL_OUTPUT_SCHEMA = z
  .object({
    items: z.array(fileEntrySchema),
  })
  .describe('List of file entries in the requested directory');

export type ListFilesParams = z.infer<typeof LIST_FILES_TOOL_INPUT_SCHEMA>;
