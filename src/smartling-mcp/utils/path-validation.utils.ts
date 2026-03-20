import * as path from 'path';
import * as fs from 'fs';

export function validateAndResolvePath(
  userPath: string,
  rootDir: string,
): string {
  if (path.isAbsolute(userPath)) {
    throw new Error('Absolute paths are not allowed. Use a relative path.');
  }

  const normalized = path.normalize(userPath);
  const resolved = path.resolve(rootDir, normalized);

  if (resolved !== rootDir && !resolved.startsWith(rootDir + path.sep)) {
    throw new Error('Path traversal detected. Access denied.');
  }

  return resolved;
}

export async function ensureWithinRoot(
  resolvedPath: string,
  rootDir: string,
): Promise<void> {
  let stat: fs.Stats;
  try {
    stat = await fs.promises.lstat(resolvedPath);
  } catch {
    return;
  }

  if (stat.isSymbolicLink()) {
    const realTarget = await fs.promises.realpath(resolvedPath);
    if (
      realTarget !== rootDir &&
      !realTarget.startsWith(rootDir + path.sep)
    ) {
      throw new Error(
        'Symbolic link points outside the allowed directory. Access denied.',
      );
    }
  }
}
