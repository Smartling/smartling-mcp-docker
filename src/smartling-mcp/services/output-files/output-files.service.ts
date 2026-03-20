import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  validateAndResolvePath,
  ensureWithinRoot,
} from '../../utils/path-validation.utils';

@Injectable()
export class OutputFilesService {
  private readonly rootDir: string;

  constructor(private readonly configService: ConfigService) {
    this.rootDir = path.resolve(
      this.configService.getOrThrow<string>('outputDir'),
    );
  }

  async writeFile(relativePath: string, content: string): Promise<string> {
    const resolved = validateAndResolvePath(relativePath, this.rootDir);
    await ensureWithinRoot(resolved, this.rootDir);

    const parentDir = path.dirname(resolved);
    await fs.promises.mkdir(parentDir, { recursive: true });
    await fs.promises.writeFile(resolved, content, 'utf-8');

    return resolved;
  }

  getRootDir(): string {
    return this.rootDir;
  }
}
