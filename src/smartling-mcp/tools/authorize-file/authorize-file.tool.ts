import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { McpToolResponseDto } from '../../dto/mcp-tool-response.dto';
import { SmartlingJobsService } from '../../services/jobs/smartling-jobs.service';
import { SmartlingProjectsService } from '../../services/projects/smartling-projects.service';
import {
  SmartlingWorkflowsService,
  LocaleWorkflowOption,
} from '../../services/workflows/smartling-workflows.service';
import { BaseSmartlingTool } from '../base-smartling-tool';
import {
  AUTHORIZE_FILE_TOOL_NAME,
  AUTHORIZE_FILE_TOOL_DESCRIPTION,
  AUTHORIZE_FILE_TOOL_INPUT_SCHEMA,
  AUTHORIZE_FILE_TOOL_OUTPUT_SCHEMA,
  AuthorizeFileParams,
} from './schema/authorize-file.schema';

interface TargetLocaleDto {
  localeId: string;
  description: string;
  enabled: boolean;
}

@Injectable()
export class AuthorizeFileTool extends BaseSmartlingTool {
  constructor(
    private readonly smartlingJobsService: SmartlingJobsService,
    private readonly smartlingProjectsService: SmartlingProjectsService,
    private readonly smartlingWorkflowsService: SmartlingWorkflowsService,
  ) {
    super();
  }

  @Tool({
    name: AUTHORIZE_FILE_TOOL_NAME,
    description: AUTHORIZE_FILE_TOOL_DESCRIPTION,
    parameters: AUTHORIZE_FILE_TOOL_INPUT_SCHEMA,
    outputSchema: AUTHORIZE_FILE_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Authorize File for Translation',
      readOnlyHint: false,
      destructiveHint: false,
    },
  })
  public async authorizeFile(
    params: AuthorizeFileParams,
  ): Promise<McpToolResponseDto> {
    const projectDetails =
      await this.smartlingProjectsService.getProjectDetails();

    const targetLocales = (
      projectDetails as unknown as { targetLocales: TargetLocaleDto[] }
    ).targetLocales;

    const localeIdsToAuthorize = this.resolveLocaleIds(
      targetLocales,
      params,
    );

    if (localeIdsToAuthorize.length === 0) {
      const requestedIds =
        params.locale_workflows?.map((lw) => lw.locale_id) ??
        params.locale_ids;
      throw new Error(
        requestedIds
          ? `None of the requested locales [${requestedIds.join(', ')}] are enabled in the project.`
          : 'No enabled target locales found in the project.',
      );
    }

    const workflowsByLocale =
      await this.smartlingWorkflowsService.getWorkflowsByLocale(
        localeIdsToAuthorize,
      );

    const workflowMap = new Map(
      workflowsByLocale.map((lwf) => [lwf.localeId, lwf.workflows]),
    );

    const explicitWorkflowMap = new Map(
      (params.locale_workflows ?? []).map((lw) => [
        lw.locale_id,
        lw.workflow_uid,
      ]),
    );

    const authorizedLocales = localeIdsToAuthorize.map((localeId) => {
      const availableWorkflows = workflowMap.get(localeId) ?? [];
      const explicitUid = explicitWorkflowMap.get(localeId);

      let selectedWorkflow: LocaleWorkflowOption;
      if (explicitUid) {
        const found = availableWorkflows.find(
          (w) => w.workflowUid === explicitUid,
        );
        if (!found) {
          throw new Error(
            `Workflow "${explicitUid}" not found for locale "${localeId}". ` +
              `Available: ${availableWorkflows.map((w) => `${w.workflowName} (${w.workflowUid})`).join(', ') || 'none'}`,
          );
        }
        selectedWorkflow = found;
      } else {
        const defaultWorkflow = availableWorkflows.find((w) => w.isDefault);
        if (!defaultWorkflow) {
          throw new Error(
            `No default workflow found for locale "${localeId}". ` +
              `Available workflows: ${availableWorkflows.map((w) => `${w.workflowName} (${w.workflowUid})`).join(', ') || 'none'}. ` +
              `Please specify a workflow_uid explicitly using locale_workflows.`,
          );
        }
        selectedWorkflow = defaultWorkflow;
      }

      return {
        localeId,
        workflowUid: selectedWorkflow.workflowUid,
        workflowName: selectedWorkflow.workflowName,
        availableWorkflows: availableWorkflows.map((w) => ({
          workflowUid: w.workflowUid,
          workflowName: w.workflowName,
          isDefault: w.isDefault,
        })),
      };
    });

    const localeWorkflows = authorizedLocales.map((al) => ({
      localeId: al.localeId,
      workflowUid: al.workflowUid,
    }));

    const result = await this.smartlingJobsService.authorizeFile(
      params.file_uri,
      localeWorkflows,
    );

    return this.createTextResponse({
      translationJobUid: result.translationJobUid,
      jobName: result.jobName,
      fileUri: result.fileUri,
      authorizedLocales,
    });
  }

  private resolveLocaleIds(
    targetLocales: TargetLocaleDto[],
    params: AuthorizeFileParams,
  ): string[] {
    const enabledLocales = targetLocales.filter((tl) => tl.enabled);

    if (params.locale_workflows) {
      const requestedIds = new Set(
        params.locale_workflows.map((lw) => lw.locale_id),
      );
      return enabledLocales
        .filter((tl) => requestedIds.has(tl.localeId))
        .map((tl) => tl.localeId);
    }

    if (params.locale_ids) {
      const requestedIds = new Set(params.locale_ids);
      return enabledLocales
        .filter((tl) => requestedIds.has(tl.localeId))
        .map((tl) => tl.localeId);
    }

    return enabledLocales.map((tl) => tl.localeId);
  }
}
