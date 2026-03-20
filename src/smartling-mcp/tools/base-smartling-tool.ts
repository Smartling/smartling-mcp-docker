import { McpToolResponseDto } from '../dto/mcp-tool-response.dto';
import { McpToolContentItemType } from '../enum/mcp-tool-content-item-type';

export abstract class BaseSmartlingTool {
  protected createTextResponse(data: object): McpToolResponseDto {
    const structuredContent = Array.isArray(data) ? { items: data } : data;

    return {
      content: [
        {
          type: McpToolContentItemType.TEXT,
          text: JSON.stringify(structuredContent),
        },
      ],
      structuredContent,
    };
  }

  protected createTextResponseFromString(data: string): McpToolResponseDto {
    return {
      content: [
        {
          type: McpToolContentItemType.TEXT,
          text: data,
        },
      ],
    };
  }
}
