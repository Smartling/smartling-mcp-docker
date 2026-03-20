import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SmartlingJobsApi,
  CreateJobParameters,
  AddFileParameters,
  AuthorizeJobParameters,
} from 'smartling-api-sdk-nodejs';
import { SmartlingBaseService } from '../smartling-base.service';
import { SmartlingApiPrebuilder } from '../../../commons/smartling-api-prebuilder';

export interface LocaleWorkflow {
  localeId: string;
  workflowUid: string;
}

@Injectable()
export class SmartlingJobsService extends SmartlingBaseService {
  constructor(
    smartlingApiClientPreBuilder: SmartlingApiPrebuilder,
    private readonly configService: ConfigService,
  ) {
    super(smartlingApiClientPreBuilder);
  }

  public async authorizeFile(
    fileUri: string,
    localeWorkflows: LocaleWorkflow[],
  ) {
    const apiClient = this.buildApiClient(SmartlingJobsApi);
    const projectId = this.configService.getOrThrow<string>(
      'smartlingProjectId',
    );

    const jobName = `mcp-authorize-${fileUri}-${Date.now()}`;
    const targetLocaleIds = localeWorkflows.map((lw) => lw.localeId);

    const createParams = new CreateJobParameters();
    createParams.setName(jobName);
    createParams.setTargetLocaleIds(targetLocaleIds);

    const job = await apiClient.createJob(projectId, createParams);

    const addFileParams = new AddFileParameters();
    addFileParams.setFileUri(fileUri);

    await apiClient.addFileToJob(
      projectId,
      job.translationJobUid,
      addFileParams,
    );

    const authorizeParams = new AuthorizeJobParameters();
    for (const lw of localeWorkflows) {
      authorizeParams.addLocaleWorkflows(lw.localeId, lw.workflowUid);
    }

    await apiClient.authorizeJob(
      projectId,
      job.translationJobUid,
      authorizeParams,
    );

    return {
      translationJobUid: job.translationJobUid,
      jobName,
      fileUri,
      authorizedLocaleIds: targetLocaleIds,
    };
  }
}
