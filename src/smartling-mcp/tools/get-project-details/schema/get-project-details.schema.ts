import z from 'zod';

export const GET_PROJECT_DETAILS_TOOL_NAME = 'smartling_get_project_details';
export const GET_PROJECT_DETAILS_TOOL_DESCRIPTION = `Get details about the configured Smartling project, including target locales and all available workflows.

# Use cases
- Discover which target locales are configured for the project.
- See all available workflows per locale (with UIDs needed for authorization).
- Find the default project workflow for each locale.
- Verify project configuration before uploading or authorizing files.

# Important notes
- No parameters required — uses the project ID from the server configuration.
- Returns target locales with all available workflows fetched from the Smartling Workflows API.
- Each locale lists every workflow that supports it, with isDefault marking the project default.
- Use the workflow UIDs from this response when calling smartling_authorize_file with explicit locale_workflows.`;

export const GET_PROJECT_DETAILS_TOOL_INPUT_SCHEMA = z.object({});

export const GET_PROJECT_DETAILS_TOOL_OUTPUT_SCHEMA = z
  .object({
    projectId: z.string().describe('The Smartling project ID'),
    projectName: z.string().describe('The project name'),
    sourceLocaleId: z.string().describe('The source locale ID'),
    targetLocales: z
      .array(
        z.object({
          localeId: z.string().describe('The locale ID (e.g. "fr-FR")'),
          description: z.string().describe('Human-readable locale name'),
          enabled: z.boolean().describe('Whether the locale is enabled'),
          availableWorkflows: z
            .array(
              z.object({
                workflowUid: z.string().describe('Workflow UID'),
                workflowName: z.string().describe('Workflow name'),
                isDefault: z
                  .boolean()
                  .describe(
                    'Whether this is the default project workflow',
                  ),
              }),
            )
            .describe('Workflows available for this locale'),
        }),
      )
      .describe('Target locales configured for the project'),
  })
  .describe('Smartling project details with workflow information');

export type GetProjectDetailsParams = z.infer<
  typeof GET_PROJECT_DETAILS_TOOL_INPUT_SCHEMA
>;
