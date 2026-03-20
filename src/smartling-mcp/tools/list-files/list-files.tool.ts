import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { McpToolResponseDto } from '../../dto/mcp-tool-response.dto';
import { LocalFilesService } from '../../services/local-files/local-files.service';
import { BaseSmartlingTool } from '../base-smartling-tool';
import {
  LIST_FILES_TOOL_NAME,
  LIST_FILES_TOOL_DESCRIPTION,
  LIST_FILES_TOOL_INPUT_SCHEMA,
  LIST_FILES_TOOL_OUTPUT_SCHEMA,
  ListFilesParams,
} from './schema/list-files.schema';

@Injectable()
export class ListFilesTool extends BaseSmartlingTool {
  constructor(private readonly localFilesService: LocalFilesService) {
    super();
  }

  @Tool({
    name: LIST_FILES_TOOL_NAME,
    description: LIST_FILES_TOOL_DESCRIPTION,
    parameters: LIST_FILES_TOOL_INPUT_SCHEMA,
    outputSchema: LIST_FILES_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'List Files',
      readOnlyHint: true,
      destructiveHint: false,
    },
  })
  public async listFiles({
    subpath,
    pattern,
  }: ListFilesParams): Promise<McpToolResponseDto> {
    const files = await this.localFilesService.listFiles(subpath, pattern);
    return this.createTextResponse(files);
  }
}
