import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { McpToolResponseDto } from '../../dto/mcp-tool-response.dto';
import { OutputFilesService } from '../../services/output-files/output-files.service';
import { SmartlingFilesService } from '../../services/files/smartling-files.service';
import { BaseSmartlingTool } from '../base-smartling-tool';
import {
  DOWNLOAD_FILE_TOOL_NAME,
  DOWNLOAD_FILE_TOOL_DESCRIPTION,
  DOWNLOAD_FILE_TOOL_INPUT_SCHEMA,
  DOWNLOAD_FILE_TOOL_OUTPUT_SCHEMA,
  DownloadFileParams,
} from './schema/download-file.schema';

@Injectable()
export class DownloadFileTool extends BaseSmartlingTool {
  constructor(
    private readonly outputFilesService: OutputFilesService,
    private readonly smartlingFilesService: SmartlingFilesService,
  ) {
    super();
  }

  @Tool({
    name: DOWNLOAD_FILE_TOOL_NAME,
    description: DOWNLOAD_FILE_TOOL_DESCRIPTION,
    parameters: DOWNLOAD_FILE_TOOL_INPUT_SCHEMA,
    outputSchema: DOWNLOAD_FILE_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Download Translated File from Smartling',
      readOnlyHint: false,
      destructiveHint: false,
    },
  })
  public async downloadFile({
    file_uri: fileUri,
    locale_id: localeId,
    retrieval_type: retrievalType,
    output_path: outputPath,
  }: DownloadFileParams): Promise<McpToolResponseDto> {
    const validatedRetrievalType = retrievalType
      ? SmartlingFilesService.validateRetrievalType(retrievalType)
      : undefined;

    const content = await this.smartlingFilesService.downloadFile(
      fileUri,
      localeId,
      validatedRetrievalType,
    );

    const relativePath = outputPath || `${localeId}/${fileUri}`;
    await this.outputFilesService.writeFile(relativePath, content);

    const bytesWritten = Buffer.byteLength(content, 'utf-8');

    return this.createTextResponse({
      filePath: relativePath,
      fileUri,
      localeId,
      retrievalType: validatedRetrievalType || 'published',
      bytesWritten,
    });
  }
}
