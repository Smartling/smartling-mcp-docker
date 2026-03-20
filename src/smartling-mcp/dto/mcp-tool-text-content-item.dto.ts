import { McpToolContentItemType } from '../enum/mcp-tool-content-item-type';

export interface McpToolTextContentItemDto {
  type: McpToolContentItemType.TEXT;
  text: string;
}
