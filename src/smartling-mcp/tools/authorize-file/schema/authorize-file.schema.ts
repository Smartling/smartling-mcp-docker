import z from 'zod';

export const AUTHORIZE_FILE_TOOL_NAME = 'smartling_authorize_file';
export const AUTHORIZE_FILE_TOOL_DESCRIPTION = `Authorize an uploaded file for translation in Smartling.

# Use cases
- After uploading a file, authorize it so that translation work begins.
- Authorize a file for specific locales or all enabled project locales.
- Choose specific workflows per locale, or let the system use the default workflow.
- Without authorization, downloaded translations will return untranslated (original) content.

# Important notes
- The file must already be uploaded to Smartling (use smartling_upload_file first).
- If locale_ids is omitted, the file is authorized for ALL enabled target locales in the project.
- Use locale_workflows to explicitly choose a workflow per locale. If not provided, the default workflow is used.
- Use smartling_get_project_details first to discover available locales and their workflows.
- The response includes available workflow options for each locale, showing what was used and what alternatives exist.
- Creates a translation job in Smartling to track the authorization.

# Examples
- Authorize for all project locales with default workflows:
{
    "file_uri": "messages.json"
}

- Authorize for specific locales with default workflows:
{
    "file_uri": "messages.json",
    "locale_ids": ["fr-FR", "de-DE"]
}

- Authorize with explicit workflow choices per locale:
{
    "file_uri": "messages.json",
    "locale_workflows": [
        { "locale_id": "fr-FR", "workflow_uid": "abc123" },
        { "locale_id": "de-DE", "workflow_uid": "def456" }
    ]
}`;

export const AUTHORIZE_FILE_TOOL_INPUT_SCHEMA = z.object({
  file_uri: z
    .string()
    .describe(
      'The file URI in Smartling (as specified during upload). This identifies which uploaded file to authorize.',
    ),
  locale_ids: z
    .array(z.string())
    .optional()
    .describe(
      'Target locale IDs to authorize for translation. If omitted, authorizes for all enabled target locales in the project. Ignored if locale_workflows is provided.',
    ),
  locale_workflows: z
    .array(
      z.object({
        locale_id: z.string().describe('Target locale ID (e.g. "fr-FR")'),
        workflow_uid: z
          .string()
          .describe(
            'Workflow UID to use for this locale. Use smartling_get_project_details to discover available workflows.',
          ),
      }),
    )
    .optional()
    .describe(
      'Explicit workflow selection per locale. When provided, overrides locale_ids and default workflow selection. Each entry specifies which workflow to use for a given locale.',
    ),
});

export const AUTHORIZE_FILE_TOOL_OUTPUT_SCHEMA = z
  .object({
    translationJobUid: z
      .string()
      .describe('The UID of the created translation job'),
    jobName: z.string().describe('The name of the created translation job'),
    fileUri: z.string().describe('The file URI that was authorized'),
    authorizedLocales: z
      .array(
        z.object({
          localeId: z.string().describe('The locale ID'),
          workflowUid: z
            .string()
            .describe('The workflow UID used for authorization'),
          workflowName: z
            .string()
            .describe('The workflow name used for authorization'),
          availableWorkflows: z
            .array(
              z.object({
                workflowUid: z.string().describe('Workflow UID'),
                workflowName: z.string().describe('Workflow name'),
                isDefault: z
                  .boolean()
                  .describe('Whether this is the default workflow'),
              }),
            )
            .describe('All available workflows for this locale'),
        }),
      )
      .describe(
        'Locales the file was authorized for, with the workflow used and alternatives available',
      ),
  })
  .describe('Result of the file authorization with workflow details');

export type AuthorizeFileParams = z.infer<
  typeof AUTHORIZE_FILE_TOOL_INPUT_SCHEMA
>;
