import { Injectable } from '@nestjs/common';
import {
  AccessTokenProvider,
  SmartlingBaseApi,
  SmartlingException,
} from 'smartling-api-sdk-nodejs';
import { SmartlingApiPrebuilder } from '../../commons/smartling-api-prebuilder';

@Injectable()
export class SmartlingBaseService {
  public constructor(
    protected readonly smartlingApiClientPreBuilder: SmartlingApiPrebuilder,
  ) {}

  protected getErrorReason(error: Error): string {
    return error instanceof SmartlingException
      ? JSON.stringify(error, null, 2)
      : error.message;
  }

  protected buildApiClient<T extends SmartlingBaseApi>(
    constructor: new (
      baseUrl: string,
      authApi: AccessTokenProvider,
      logger: any,
    ) => T,
  ): T {
    return this.smartlingApiClientPreBuilder.preBuild().build(constructor);
  }
}
