import {
  SmartlingBaseApi,
  AccessTokenProvider,
} from 'smartling-api-sdk-nodejs';

export interface WorkflowStepDto {
  workflowStepUid: string;
  workflowStepName: string;
  workflowStepClass: string;
  workflowStepOrder: number;
  primaryActionType: string | null;
}

export interface LocalePairDto {
  sourceLocale: { localeId: string; description: string };
  targetLocale: { localeId: string; description: string };
}

export interface WorkflowDto {
  workflowUid: string;
  workflowName: string;
  defaultProjectWorkflow: boolean;
  accountLevel: boolean;
  projectId: string | null;
  localePairs: LocalePairDto[];
  workflowSteps: WorkflowStepDto[];
}

export interface WorkflowListResponse {
  totalCount: number;
  items: WorkflowDto[];
}

/**
 * Custom API client for Smartling Workflows API v2.
 * The public SDK (`smartling-api-sdk-nodejs`) does not include a workflows client,
 * so we extend SmartlingBaseApi directly and call the REST endpoint.
 */
export class SmartlingWorkflowsApi extends SmartlingBaseApi {
  constructor(baseUrl: string, authApi: AccessTokenProvider, logger: any) {
    super(logger);
    this.authApi = authApi;
    this.entrypoint = `${baseUrl}/workflows-api/v2/projects`;
  }

  public async listWorkflows(
    projectId: string,
  ): Promise<WorkflowListResponse> {
    return await this.makeRequest(
      'get',
      `${this.entrypoint}/${projectId}/workflows`,
    );
  }
}
