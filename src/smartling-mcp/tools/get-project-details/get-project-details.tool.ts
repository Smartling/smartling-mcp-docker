import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { McpToolResponseDto } from '../../dto/mcp-tool-response.dto';
import { SmartlingProjectsService } from '../../services/projects/smartling-projects.service';
import { SmartlingWorkflowsService } from '../../services/workflows/smartling-workflows.service';
import { BaseSmartlingTool } from '../base-smartling-tool';
import {
  GET_PROJECT_DETAILS_TOOL_NAME,
  GET_PROJECT_DETAILS_TOOL_DESCRIPTION,
  GET_PROJECT_DETAILS_TOOL_INPUT_SCHEMA,
  GET_PROJECT_DETAILS_TOOL_OUTPUT_SCHEMA,
  GetProjectDetailsParams,
} from './schema/get-project-details.schema';

interface TargetLocaleDto {
  localeId: string;
  description: string;
  enabled: boolean;
}

@Injectable()
export class GetProjectDetailsTool extends BaseSmartlingTool {
  constructor(
    private readonly smartlingProjectsService: SmartlingProjectsService,
    private readonly smartlingWorkflowsService: SmartlingWorkflowsService,
  ) {
    super();
  }

  @Tool({
    name: GET_PROJECT_DETAILS_TOOL_NAME,
    description: GET_PROJECT_DETAILS_TOOL_DESCRIPTION,
    parameters: GET_PROJECT_DETAILS_TOOL_INPUT_SCHEMA,
    outputSchema: GET_PROJECT_DETAILS_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Get Project Details',
      readOnlyHint: true,
      destructiveHint: false,
    },
  })
  public async getProjectDetails(
    _params: GetProjectDetailsParams,
  ): Promise<McpToolResponseDto> {
    const project = await this.smartlingProjectsService.getProjectDetails();

    const targetLocales = (project as unknown as { targetLocales: TargetLocaleDto[] }).targetLocales;
    const localeIds = targetLocales.map((tl) => tl.localeId);
    const workflowsByLocale = await this.smartlingWorkflowsService.getWorkflowsByLocale(localeIds);

    const workflowMap = new Map(
      workflowsByLocale.map((lwf) => [lwf.localeId, lwf.workflows]),
    );

    const enrichedLocales = targetLocales.map((tl) => ({
      localeId: tl.localeId,
      description: tl.description,
      enabled: tl.enabled,
      availableWorkflows: workflowMap.get(tl.localeId) ?? [],
    }));

    return this.createTextResponse({
      projectId: (project as any).projectId,
      projectName: (project as any).projectName,
      sourceLocaleId: (project as any).sourceLocaleId,
      targetLocales: enrichedLocales,
    });
  }
}
