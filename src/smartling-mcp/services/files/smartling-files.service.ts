import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SmartlingFilesApi,
  UploadFileParameters,
  DownloadFileParameters,
  FileType,
  RetrievalType,
  UploadedFileDto,
} from 'smartling-api-sdk-nodejs';
import { SmartlingBaseService } from '../smartling-base.service';
import { SmartlingApiPrebuilder } from '../../../commons/smartling-api-prebuilder';

const VALID_FILE_TYPES = new Set<string>(Object.values(FileType));
const VALID_RETRIEVAL_TYPES = new Set<string>(Object.values(RetrievalType));

@Injectable()
export class SmartlingFilesService extends SmartlingBaseService {
  constructor(
    smartlingApiClientPreBuilder: SmartlingApiPrebuilder,
    private readonly configService: ConfigService,
  ) {
    super(smartlingApiClientPreBuilder);
  }

  public static validateFileType(fileType: string): FileType {
    if (!VALID_FILE_TYPES.has(fileType)) {
      throw new Error(
        `Invalid file type "${fileType}". Valid types: ${[...VALID_FILE_TYPES].sort().join(', ')}`,
      );
    }
    return fileType as FileType;
  }

  public async uploadFile(
    absoluteFilePath: string,
    fileUri: string,
    fileType: FileType,
  ): Promise<UploadedFileDto> {
    const apiClient = this.buildApiClient(SmartlingFilesApi);
    const projectId = this.configService.getOrThrow<string>(
      'smartlingProjectId',
    );

    const params = new UploadFileParameters();
    params.setFileFromLocalFilePath(absoluteFilePath);
    params.setFileUri(fileUri);
    params.setFileType(fileType);

    return await apiClient.uploadFile(projectId, params);
  }

  public static validateRetrievalType(retrievalType: string): RetrievalType {
    if (!VALID_RETRIEVAL_TYPES.has(retrievalType)) {
      throw new Error(
        `Invalid retrieval type "${retrievalType}". Valid types: ${[...VALID_RETRIEVAL_TYPES].sort().join(', ')}`,
      );
    }
    return retrievalType as RetrievalType;
  }

  public async downloadFile(
    fileUri: string,
    localeId: string,
    retrievalType?: RetrievalType,
  ): Promise<string> {
    const apiClient = this.buildApiClient(SmartlingFilesApi);
    const projectId = this.configService.getOrThrow<string>(
      'smartlingProjectId',
    );

    const params = new DownloadFileParameters();
    if (retrievalType) {
      params.setRetrievalType(retrievalType);
    }

    return await apiClient.downloadFile(projectId, fileUri, localeId, params);
  }
}
