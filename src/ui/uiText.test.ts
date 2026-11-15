// Milestone 10 UI text source verification (docs/specs/M10-exterior-accuracy.md §9 test 7, §10).
// Node-only source-text test in the style of src/audio/audioAssets.test.ts (no DOM or Three.js).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPECTED_CAPTION =
  "Illustrative geometry, part shapes & timing: Bore spacing, deck height and piston protrusion, valve timing events, duration, and lift profile shape, lifter gallery placement, detailed part shapes, aftermarket variant part shapes and their service positions, and the exterior shell's individual casting proportions, fitting positions and surface detail remain illustrative, not verified LLY measurements.";

const EXPECTED_SUBTITLE = 'Milestone 10 — Exterior Accuracy';

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

describe('Milestone 10 UI caption and subtitle text (src/ui/uiText.test.ts)', () => {
  it('7. asserts verbatim §10.1 disclaimer caption and §10.2 subtitles in engineControls.ts and index.html', () => {
    const rootDir = process.cwd();
    const controlsSource = readFileSync(resolve(rootDir, 'src', 'ui', 'engineControls.ts'), 'utf8');
    const indexHtmlSource = readFileSync(resolve(rootDir, 'index.html'), 'utf8');

    const normalizedControls = normalizeWhitespace(controlsSource);
    expect(normalizedControls).toContain(normalizeWhitespace(EXPECTED_CAPTION));
    expect(normalizedControls).not.toContain('registered exterior shell remain illustrative placeholders');

    const runtimeSubtitleMatch = controlsSource.match(
      /bannerSubtitle\.textContent\s*=\s*['"]([^'"]+)['"]/,
    );
    expect(runtimeSubtitleMatch).not.toBeNull();
    expect(runtimeSubtitleMatch![1]).toBe(EXPECTED_SUBTITLE);

    const htmlSubtitleMatch = indexHtmlSource.match(
      /<div\s+id=["']title-banner["'][^>]*>[\s\S]*?<p>([^<]+)<\/p>/,
    );
    expect(htmlSubtitleMatch).not.toBeNull();
    expect(htmlSubtitleMatch![1]!.trim()).toBe(EXPECTED_SUBTITLE);
  });
});
