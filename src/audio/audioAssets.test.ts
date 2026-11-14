import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

function collectAllFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectAllFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

const FORBIDDEN_AUDIO_TOKENS = [
  'fetch(',
  'XMLHttpRequest',
  'decodeAudioData',
  'new Audio(',
  'AudioWorklet',
  'ScriptProcessor',
] as const;

const AUDIO_FILE_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'] as const;

describe('Milestone 9 zero-download and zero-dependency guard (Spec §10 test 13)', () => {
  it('13. forbids audio downloads/worklets/sampled extensions in src/audio/**, audio files in public/**, and new packages in package.json', () => {
    const rootDir = process.cwd();
    const audioDir = resolve(rootDir, 'src', 'audio');
    const nonTestAudioFiles = collectAllFiles(audioDir).filter(
      (f) => !f.endsWith('.test.ts'),
    );

    expect(nonTestAudioFiles.length).toBeGreaterThanOrEqual(3);

    for (const filePath of nonTestAudioFiles) {
      const rel = relative(rootDir, filePath).split(sep).join('/');
      const contents = readFileSync(filePath, 'utf-8');
      const lower = contents.toLowerCase();

      for (const token of FORBIDDEN_AUDIO_TOKENS) {
        expect(contents.includes(token), `${rel} must not contain ${token}`).toBe(false);
      }
      for (const ext of AUDIO_FILE_EXTENSIONS) {
        expect(lower.includes(ext), `${rel} must not reference ${ext}`).toBe(false);
      }
    }

    const publicDir = resolve(rootDir, 'public');
    const publicFiles = collectAllFiles(publicDir);
    const audioAssetViolations = publicFiles
      .map((f) => relative(rootDir, f).split(sep).join('/'))
      .filter((rel) => AUDIO_FILE_EXTENSIONS.some((ext) => rel.toLowerCase().endsWith(ext)));
    expect(audioAssetViolations).toEqual([]);

    const pkgJson = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(Object.keys(pkgJson.dependencies ?? {}).sort()).toEqual(['three']);
    expect(Object.keys(pkgJson.devDependencies ?? {}).sort()).toEqual([
      '@types/three',
      'ajv',
      'typescript',
      'vite',
      'vitest',
    ]);
  });
});
