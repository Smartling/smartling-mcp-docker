import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmartlingProjectsApi } from 'smartling-api-sdk-nodejs';
import { SmartlingBaseService } from '../smartling-base.service';
import { SmartlingApiPrebuilder } from '../../../commons/smartling-api-prebuilder';

@Injectable()
export class SmartlingProjectsService extends SmartlingBaseService {
  constructor(
    smartlingApiClientPreBuilder: SmartlingApiPrebuilder,
    private readonly configService: ConfigService,
  ) {
    super(smartlingApiClientPreBuilder);
  }

  public async getProjectDetails() {
    const apiClient = this.buildApiClient(SmartlingProjectsApi);
    const projectId = this.configService.getOrThrow<string>(
      'smartlingProjectId',
    );

    return await apiClient.getProjectDetails(projectId);
  }
}
