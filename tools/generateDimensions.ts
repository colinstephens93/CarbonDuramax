// Generates assets-src/dimensions.json from TypeScript configs (Milestone 2 Deliverable 3).
// Usage: node tools/generateDimensions.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detailConfig } from '../src/config/detailConfig.ts';
import { engineConfig } from '../src/config/engineConfig.ts';
import { valveConfig } from '../src/config/valveConfig.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = resolve(repoRoot, 'assets-src', 'dimensions.json');

const dimensions: Record<string, number> = {
  // engineConfig interface dimensions (mm)
  boreMm: engineConfig.boreMm.value,
  strokeMm: engineConfig.strokeMm.value,
  crankThrowMm: engineConfig.crankThrowMm.value,
  rodLengthMm: engineConfig.rodLengthMm.value,

  // valveConfig interface dimensions (mm, preserving exact TS field names without Mm suffix)
  borePitch: valveConfig.borePitch.value,
  maxLift: valveConfig.maxLift.value,
  deckGap: valveConfig.deckGap.value,
};

for (const [key, entry] of Object.entries(detailConfig)) {
  dimensions[key] = entry.value;
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(dimensions, null, 2)}\n`, 'utf-8');
console.log(`Wrote ${Object.keys(dimensions).length} dimensions to ${outPath}`);
