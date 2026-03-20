import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { SmartlingApiPrebuilder } from '../commons/smartling-api-prebuilder';
import { LocalFilesService } from './services/local-files/local-files.service';
import { SmartlingFilesService } from './services/files/smartling-files.service';
import { SmartlingProjectsService } from './services/projects/smartling-projects.service';
import { SmartlingJobsService } from './services/jobs/smartling-jobs.service';
import { SmartlingWorkflowsService } from './services/workflows/smartling-workflows.service';
import { OutputFilesService } from './services/output-files/output-files.service';
import { ListFilesTool } from './tools/list-files/list-files.tool';
import { UploadFileTool } from './tools/upload-file/upload-file.tool';
import { DownloadFileTool } from './tools/download-file/download-file.tool';
import { GetProjectDetailsTool } from './tools/get-project-details/get-project-details.tool';
import { AuthorizeFileTool } from './tools/authorize-file/authorize-file.tool';

@Module({
  imports: [
    McpModule.forFeature(
      [ListFilesTool, UploadFileTool, DownloadFileTool, GetProjectDetailsTool, AuthorizeFileTool],
      'smartling-docker-mcp',
    ),
  ],
  providers: [
    SmartlingApiPrebuilder,
    LocalFilesService,
    SmartlingFilesService,
    SmartlingProjectsService,
    SmartlingJobsService,
    SmartlingWorkflowsService,
    OutputFilesService,
    ListFilesTool,
    UploadFileTool,
    DownloadFileTool,
    GetProjectDetailsTool,
    AuthorizeFileTool,
  ],
})
export class SmartlingMcpModule {}
