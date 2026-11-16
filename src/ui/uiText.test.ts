// Milestone 10, 11, 12 & 13 UI text source verification (docs/specs/M13-internal-variants.md §9 test 9, §10).
// Node-only source-text test in the style of src/audio/audioAssets.test.ts (no DOM or Three.js).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stockBuild } from '../perf';

const EXPECTED_CAPTION =
  "Illustrative geometry, part shapes & timing: Bore spacing, deck height and piston protrusion, valve timing events, duration, and lift profile shape, lifter gallery placement, detailed part shapes, aftermarket variant part shapes and their service positions, and the exterior shell's individual casting proportions, fitting positions and surface detail remain illustrative, not verified LLY measurements.";

const EXPECTED_SUBTITLE = 'Milestone 13 — Internal Part Variants';
const RETIRED_M11_SUBTITLE = 'Milestone 11 — Capped-Solid Cutaways';
const RETIRED_M12_SUBTITLE = 'Milestone 12 — Intake Manifold Cover';

const EXPECTED_BUILD_NOTE =
  '3D variants: exterior parts render with the Exterior shell shown (Exterior or X-Ray); the low-compression piston and forged connecting rods render in the internal assembly.';
const RETIRED_M8_BUILD_NOTE =
  '3D variants: exterior parts render with the Exterior shell shown (Exterior or X-Ray); the low-compression piston renders in the internal assembly.';

const EXPECTED_INTAKE_COVER_LABEL = 'Intake cover';
const EXPECTED_INTAKE_COVER_NOTE =
  'Optional cosmetic cover (GM 21994000) — shows with Exterior or X-Ray and hides the Y-bridge. The moulded "6.6 TURBO DIESEL" legend is an illustrative reconstruction; the planform, dimensions and wall thickness are illustrative placeholders, not measured LLY values.';

const EXPECTED_CUTAWAY_NOTE =
  'Section cut faces are filled as solid, hatched material — a diagrammatic section, not a machined or verified LLY surface.';

const RETIRED_CUTAWAY_NOTE = 'Cutaway shows open shells — capped solid sections come later.';

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

describe('Milestone 13 UI caption, build note, intake cover control/note, cutaway note, and subtitle text (src/ui/uiText.test.ts)', () => {
  it('9. asserts verbatim M13 §10.1–§10.2 subtitle & build note, M12 Intake cover label & note, default-off controls, rods_stock default, M11 cutaway note, and M10 disclaimer caption', () => {
    const rootDir = process.cwd();
    const controlsSource = readFileSync(resolve(rootDir, 'src', 'ui', 'engineControls.ts'), 'utf8');
    const indexHtmlSource = readFileSync(resolve(rootDir, 'index.html'), 'utf8');

    const normalizedControls = normalizeWhitespace(controlsSource);
    expect(normalizedControls).toContain(normalizeWhitespace(EXPECTED_CAPTION));
    expect(normalizedControls).not.toContain('registered exterior shell remain illustrative placeholders');

    // M13 §10.2 verbatim build note & absence of stale piston-only M8 build note
    expect(normalizedControls).toContain(normalizeWhitespace(EXPECTED_BUILD_NOTE));
    expect(normalizedControls).not.toContain(normalizeWhitespace(RETIRED_M8_BUILD_NOTE));

    // M12 §10.2 verbatim Intake cover label & note, default-off checkboxes, and no standalone rods checkbox
    expect(controlsSource).toContain(`'${EXPECTED_INTAKE_COVER_LABEL}'`);
    expect(normalizedControls).toContain(normalizeWhitespace(EXPECTED_INTAKE_COVER_NOTE));
    expect(controlsSource).toContain('exteriorCheckbox.checked = false');
    expect(controlsSource).toContain('intakeCoverCheckbox.checked = false');
    expect(controlsSource).not.toMatch(/rodsCheckbox|m13-rods/i);
    expect(stockBuild.selections.rods).toBe('rods_stock');
    expect(controlsSource).toContain('stockBuild.selections[slotId]');

    // M11 §9.1 verbatim cutaway note & absence of the M4 deferred promise in engineControls.ts
    expect(normalizedControls).toContain(normalizeWhitespace(EXPECTED_CUTAWAY_NOTE));
    expect(controlsSource).not.toContain(RETIRED_CUTAWAY_NOTE);

    // M13 §10.1 subtitles in both engineControls.ts and index.html, and absence of retired M11/M12 subtitles
    expect(controlsSource).not.toContain(RETIRED_M11_SUBTITLE);
    expect(indexHtmlSource).not.toContain(RETIRED_M11_SUBTITLE);
    expect(controlsSource).not.toContain(RETIRED_M12_SUBTITLE);
    expect(indexHtmlSource).not.toContain(RETIRED_M12_SUBTITLE);

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
