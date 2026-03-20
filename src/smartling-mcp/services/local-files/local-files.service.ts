import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  validateAndResolvePath,
  ensureWithinRoot,
} from '../../utils/path-validation.utils';

export interface FileEntry {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedAt: string;
}

@Injectable()
export class LocalFilesService {
  private readonly rootDir: string;

  constructor(private readonly configService: ConfigService) {
    this.rootDir = path.resolve(
      this.configService.getOrThrow<string>('inputDir'),
    );
  }

  async listFiles(subpath?: string, pattern?: string): Promise<FileEntry[]> {
    const targetDir = subpath
      ? validateAndResolvePath(subpath, this.rootDir)
      : this.rootDir;

    await ensureWithinRoot(targetDir, this.rootDir);

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Directory not found: ${subpath || '/'}`);
      }
      if ((err as NodeJS.ErrnoException).code === 'ENOTDIR') {
        throw new Error(`Not a directory: ${subpath || '/'}`);
      }
      throw err;
    }

    if (pattern) {
      const regex = this.globToRegex(pattern);
      entries = entries.filter((e) => regex.test(e.name));
    }

    const results: FileEntry[] = [];
    for (const entry of entries) {
      const fullPath = path.join(targetDir, entry.name);
      try {
        const stat = await fs.promises.stat(fullPath);
        results.push({
          name: entry.name,
          path: subpath ? path.join(subpath, entry.name) : entry.name,
          size: stat.size,
          isDirectory: stat.isDirectory(),
          modifiedAt: stat.mtime.toISOString(),
        });
      } catch {
        // Skip files we cannot stat (e.g. broken symlinks)
      }
    }

    return results;
  }

  async resolveFilePath(relativePath: string): Promise<string> {
    const resolved = validateAndResolvePath(relativePath, this.rootDir);
    await ensureWithinRoot(resolved, this.rootDir);

    try {
      await fs.promises.access(resolved, fs.constants.R_OK);
    } catch {
      throw new Error(`File not found or not readable: ${relativePath}`);
    }

    const stat = await fs.promises.stat(resolved);
    if (stat.isDirectory()) {
      throw new Error(`Path is a directory, not a file: ${relativePath}`);
    }

    return resolved;
  }

  async writeFile(relativePath: string, content: string): Promise<string> {
    const resolved = validateAndResolvePath(relativePath, this.rootDir);
    await ensureWithinRoot(resolved, this.rootDir);

    const parentDir = path.dirname(resolved);
    await fs.promises.mkdir(parentDir, { recursive: true });
    await fs.promises.writeFile(resolved, content, 'utf-8');

    return resolved;
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }
}
