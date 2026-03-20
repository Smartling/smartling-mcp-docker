import z from 'zod';

export const UPLOAD_FILE_TOOL_NAME = 'smartling_upload_file';
export const UPLOAD_FILE_TOOL_DESCRIPTION = `Upload a file from the mounted input directory to Smartling for translation.

# Use cases
- User wants to upload a source file to a Smartling project for translation.
- User has listed files and selected one to upload.

# Important notes
- The file must exist in the mounted input directory.
- The file_type must match the Smartling file type format (e.g. "json", "xliff", "xml", "html", "yaml").
- If file_uri is not provided, the file path will be used as the file URI in Smartling.
- If a file with the same file_uri already exists in the Smartling project, it will be overwritten.
- This tool uploads source content only. Translation locales are configured at the Smartling project level.

# Examples
- Upload a JSON file:
{
    "file_path": "messages.json",
    "file_type": "json"
}

- Upload with custom Smartling file URI:
{
    "file_path": "content/strings.xliff",
    "file_type": "xliff",
    "file_uri": "mobile-app/strings.xliff"
}`;

export const UPLOAD_FILE_TOOL_INPUT_SCHEMA = z.object({
  file_path: z
    .string()
    .describe(
      'Relative path to the file within the mounted input directory. Must not be an absolute path or contain path traversal.',
    ),
  file_type: z
    .string()
    .describe(
      'Smartling file type. Valid values: android, ios, gettext, html, java_properties, xliff, xml, json, docx, pptx, xlsx, idml, indd, qt, resx, plain_text, csv, srt, stringsdict, xls, doc, ppt, pres, madcap, yaml, markdown.',
    ),
  file_uri: z
    .string()
    .optional()
    .describe(
      'File URI identifier in Smartling. Defaults to the file_path if not specified. This is the unique identifier for the file within the Smartling project.',
    ),
});

export const UPLOAD_FILE_TOOL_OUTPUT_SCHEMA = z
  .object({
    overWritten: z
      .boolean()
      .describe('Whether an existing file was overwritten'),
    wordCount: z.number().describe('Number of words in the uploaded file'),
    stringCount: z.number().describe('Number of strings in the uploaded file'),
  })
  .describe('Result of the file upload to Smartling');

export type UploadFileParams = z.infer<typeof UPLOAD_FILE_TOOL_INPUT_SCHEMA>;
