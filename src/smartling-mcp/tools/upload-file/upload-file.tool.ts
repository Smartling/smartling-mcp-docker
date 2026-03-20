import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { McpToolResponseDto } from '../../dto/mcp-tool-response.dto';
import { LocalFilesService } from '../../services/local-files/local-files.service';
import { SmartlingFilesService } from '../../services/files/smartling-files.service';
import { BaseSmartlingTool } from '../base-smartling-tool';
import {
  UPLOAD_FILE_TOOL_NAME,
  UPLOAD_FILE_TOOL_DESCRIPTION,
  UPLOAD_FILE_TOOL_INPUT_SCHEMA,
  UPLOAD_FILE_TOOL_OUTPUT_SCHEMA,
  UploadFileParams,
} from './schema/upload-file.schema';

@Injectable()
export class UploadFileTool extends BaseSmartlingTool {
  constructor(
    private readonly localFilesService: LocalFilesService,
    private readonly smartlingFilesService: SmartlingFilesService,
  ) {
    super();
  }

  @Tool({
    name: UPLOAD_FILE_TOOL_NAME,
    description: UPLOAD_FILE_TOOL_DESCRIPTION,
    parameters: UPLOAD_FILE_TOOL_INPUT_SCHEMA,
    outputSchema: UPLOAD_FILE_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Upload File to Smartling',
      readOnlyHint: false,
      destructiveHint: false,
    },
  })
  public async uploadFile({
    file_path: filePath,
    file_type: fileType,
    file_uri: fileUri,
  }: UploadFileParams): Promise<McpToolResponseDto> {
    const validatedFileType =
      SmartlingFilesService.validateFileType(fileType);
    const absolutePath =
      await this.localFilesService.resolveFilePath(filePath);
    const smartlingFileUri = fileUri || filePath;

    const result = await this.smartlingFilesService.uploadFile(
      absolutePath,
      smartlingFileUri,
      validatedFileType,
    );

    return this.createTextResponse(result);
  }
}
