import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import configuration from './config';
import { SmartlingMcpModule } from './smartling-mcp/smartling-mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      cache: true,
      isGlobal: true,
    }),
    McpModule.forRoot({
      name: configuration().appName,
      version: configuration().appVersion,
      transport: [McpTransportType.STDIO, McpTransportType.SSE, McpTransportType.STREAMABLE_HTTP],
      instructions:
        'Smartling Docker MCP server provides tools for listing local files and uploading them to Smartling.',
    }),
    SmartlingMcpModule,
  ],
})
export class AppModule {}
