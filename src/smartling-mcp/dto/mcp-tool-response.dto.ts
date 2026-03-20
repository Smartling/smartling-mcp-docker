import { McpToolTextContentItemDto } from './mcp-tool-text-content-item.dto';

export interface McpToolResponseDto {
  content: Array<McpToolTextContentItemDto>;
  structuredContent?: unknown;
}
