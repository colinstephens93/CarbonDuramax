import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const THREE_IMPORT_RE =
  /(?:(?:^|[;\r\n])\s*(?:import|export)\b[^;'"]*?\bfrom\s*['"]three(?:\/[^'"]*)?['"]|(?:^|[;\r\n])\s*import\s*['"]three(?:\/[^'"]*)?['"]|\b(?:import|require)\s*\(\s*['"]three(?:\/[^'"]*)?['"]\s*\))/;

describe('layered architecture boundary (D-007)', () => {
  it('forbids importing three in any file under src/ outside src/renderer/', () => {
    const srcRoot = resolve(process.cwd(), 'src');
    const rendererPrefix = `renderer${sep}`;
    const allFiles = collectSourceFiles(srcRoot);

    const nonRendererViolations: string[] = [];
    let rendererImportsFound = 0;

    for (const filePath of allFiles) {
      const relPath = relative(srcRoot, filePath);
      const contents = readFileSync(filePath, 'utf-8');
      const importsThree = THREE_IMPORT_RE.test(contents);

      if (relPath.startsWith(rendererPrefix)) {
        if (importsThree) {
          rendererImportsFound += 1;
        }
      } else if (importsThree) {
        nonRendererViolations.push(relPath.split(sep).join('/'));
      }
    }

    expect(rendererImportsFound).toBeGreaterThan(0);
    expect(nonRendererViolations).toEqual([]);
  });
});
