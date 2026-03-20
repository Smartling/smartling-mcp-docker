import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmartlingBaseService } from '../smartling-base.service';
import { SmartlingApiPrebuilder } from '../../../commons/smartling-api-prebuilder';
import {
  SmartlingWorkflowsApi,
  WorkflowDto,
} from '../../api/smartling-workflows.api';

export interface LocaleWorkflowOption {
  workflowUid: string;
  workflowName: string;
  isDefault: boolean;
}

export interface LocaleWithWorkflows {
  localeId: string;
  workflows: LocaleWorkflowOption[];
}

@Injectable()
export class SmartlingWorkflowsService extends SmartlingBaseService {
  constructor(
    smartlingApiClientPreBuilder: SmartlingApiPrebuilder,
    private readonly configService: ConfigService,
  ) {
    super(smartlingApiClientPreBuilder);
  }

  public async listWorkflows(): Promise<WorkflowDto[]> {
    const apiClient = this.buildApiClient(SmartlingWorkflowsApi);
    const projectId = this.configService.getOrThrow<string>(
      'smartlingProjectId',
    );

    const response = await apiClient.listWorkflows(projectId);
    return response.items;
  }

  /**
   * Returns available workflows grouped by target locale ID.
   * Each locale lists which workflows support it, with the project default marked.
   */
  public async getWorkflowsByLocale(
    localeIds: string[],
  ): Promise<LocaleWithWorkflows[]> {
    const workflows = await this.listWorkflows();

    return localeIds.map((localeId) => {
      const availableWorkflows: LocaleWorkflowOption[] = [];

      for (const wf of workflows) {
        const supportsLocale = wf.localePairs.some(
          (lp) => lp.targetLocale.localeId === localeId,
        );
        if (supportsLocale) {
          availableWorkflows.push({
            workflowUid: wf.workflowUid,
            workflowName: wf.workflowName,
            isDefault: wf.defaultProjectWorkflow,
          });
        }
      }

      return { localeId, workflows: availableWorkflows };
    });
  }
}
