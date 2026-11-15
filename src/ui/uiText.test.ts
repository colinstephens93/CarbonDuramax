// Milestone 10 & 11 UI text source verification (docs/specs/M11-capped-cutaways.md §8 test 8, §9).
// Node-only source-text test in the style of src/audio/audioAssets.test.ts (no DOM or Three.js).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPECTED_CAPTION =
  "Illustrative geometry, part shapes & timing: Bore spacing, deck height and piston protrusion, valve timing events, duration, and lift profile shape, lifter gallery placement, detailed part shapes, aftermarket variant part shapes and their service positions, and the exterior shell's individual casting proportions, fitting positions and surface detail remain illustrative, not verified LLY measurements.";

const EXPECTED_SUBTITLE = 'Milestone 11 — Capped-Solid Cutaways';

const EXPECTED_CUTAWAY_NOTE =
  'Section cut faces are filled as solid, hatched material — a diagrammatic section, not a machined or verified LLY surface.';

const RETIRED_CUTAWAY_NOTE = 'Cutaway shows open shells — capped solid sections come later.';

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

describe('Milestone 11 UI caption, cutaway note, and subtitle text (src/ui/uiText.test.ts)', () => {
  it('8. asserts verbatim M11 §9.1 cutaway note, §9.2 subtitles, absence of retired promise, and unchanged M10 disclaimer caption', () => {
    const rootDir = process.cwd();
    const controlsSource = readFileSync(resolve(rootDir, 'src', 'ui', 'engineControls.ts'), 'utf8');
    const indexHtmlSource = readFileSync(resolve(rootDir, 'index.html'), 'utf8');

    const normalizedControls = normalizeWhitespace(controlsSource);
    expect(normalizedControls).toContain(normalizeWhitespace(EXPECTED_CAPTION));
    expect(normalizedControls).not.toContain('registered exterior shell remain illustrative placeholders');

    // M11 §9.1 verbatim cutaway note & absence of the M4 deferred promise in engineControls.ts
    expect(normalizedControls).toContain(normalizeWhitespace(EXPECTED_CUTAWAY_NOTE));
    expect(controlsSource).not.toContain(RETIRED_CUTAWAY_NOTE);

    // M11 §9.2 subtitles in both engineControls.ts and index.html
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
