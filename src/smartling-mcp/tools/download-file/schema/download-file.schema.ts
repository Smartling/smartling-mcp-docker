import z from 'zod';

export const DOWNLOAD_FILE_TOOL_NAME = 'smartling_download_translated_file';
export const DOWNLOAD_FILE_TOOL_DESCRIPTION = `Download a translated file from Smartling for a specific locale and save it to the output directory.

# Use cases
- User wants to retrieve translated content for a specific language.
- User has uploaded a file and wants to download its translations after they are completed.
- User wants to review pending (in-progress) translations before they are published.

# Important notes
- The file_uri must match an existing file in the Smartling project (as uploaded via smartling_upload_file).
- The locale_id must be a valid target locale configured in the Smartling project (e.g. "fr-FR", "de-DE", "ja-JP").
- By default, only published (completed) translations are returned. Use retrieval_type "pending" to include in-progress translations.
- The downloaded file is saved to the output directory (OUTPUT_DIR) at {locale_id}/{file_uri} by default, or at the specified output_path.
- The output directory is separate from the input directory and is writable.
- Parent directories are created automatically if they do not exist.

# Examples
- Download published French translations:
{
    "file_uri": "messages.json",
    "locale_id": "fr-FR"
}

- Download pending translations to a custom path:
{
    "file_uri": "content/strings.xliff",
    "locale_id": "de-DE",
    "retrieval_type": "pending",
    "output_path": "translations/de/strings.xliff"
}`;

export const DOWNLOAD_FILE_TOOL_INPUT_SCHEMA = z.object({
  file_uri: z
    .string()
    .describe(
      'The file URI in Smartling that identifies the source file to download translations for.',
    ),
  locale_id: z
    .string()
    .describe(
      'Target locale identifier (e.g. "fr-FR", "de-DE", "ja-JP"). Must be a locale configured in the Smartling project.',
    ),
  retrieval_type: z
    .string()
    .optional()
    .describe(
      'Translation retrieval type. "published" (default) returns only completed translations, "pending" includes in-progress translations, "pseudo" returns pseudo-translated content for testing.',
    ),
  output_path: z
    .string()
    .optional()
    .describe(
      'Relative path within the output directory to save the downloaded file. Defaults to "{locale_id}/{file_uri}". Must not be an absolute path or contain path traversal.',
    ),
});

export const DOWNLOAD_FILE_TOOL_OUTPUT_SCHEMA = z
  .object({
    filePath: z
      .string()
      .describe('Relative path where the translated file was saved'),
    fileUri: z.string().describe('The Smartling file URI'),
    localeId: z.string().describe('The target locale'),
    retrievalType: z.string().describe('The retrieval type used'),
    bytesWritten: z
      .number()
      .describe('Number of bytes written to the output file'),
  })
  .describe('Result of the translated file download from Smartling');

export type DownloadFileParams = z.infer<typeof DOWNLOAD_FILE_TOOL_INPUT_SCHEMA>;
