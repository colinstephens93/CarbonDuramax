// Parts catalog and data-driven build compatibility checker
// (D-007, D-008, D-010, D-032; docs/specs/M6-parts-catalog.md §§2–3).
// Pure TypeScript; never imports Three.js or src/perf.

import modifiedCatalogJson from '../../catalog/modified.json';
import stockCatalogJson from '../../catalog/stock.json';
import type { Build, PartSlotId, PartVariant } from '../core/interfaces';

const CATALOG_SLOTS: readonly PartSlotId[] = [
  'turbo',
  'injectors',
  'cp3',
  'intake',
  'exhaust',
  'intercooler',
  'tune',
  'pistons',
  'rods',
  'camshaft',
  'heads',
  'fuelRail',
];

export const fullCatalog: PartVariant[] = [
  ...(stockCatalogJson as PartVariant[]),
  ...(modifiedCatalogJson as PartVariant[]),
];

export function variantsForSlot(slotId: PartSlotId): PartVariant[] {
  return fullCatalog.filter((entry) => entry.slotId === slotId);
}

export function checkCompatibility(
  build: Build,
  catalog: readonly PartVariant[] = fullCatalog,
): string[] {
  const violations: string[] = [];

  const entriesById = new Map<string, PartVariant>();
  if (Array.isArray(catalog)) {
    for (const entry of catalog) {
      if (entry && typeof entry.id === 'string') {
        entriesById.set(entry.id, entry);
      }
    }
  }

  const selections =
    build && typeof build === 'object' && build.selections && typeof build.selections === 'object'
      ? build.selections
      : ({} as Partial<Record<PartSlotId, unknown>>);

  for (const slotId of CATALOG_SLOTS) {
    const selectedId = selections[slotId];
    if (typeof selectedId !== 'string' || selectedId.length === 0) {
      violations.push(
        `Unknown catalog entry "${typeof selectedId === 'string' ? selectedId : ''}" selected for slot "${slotId}".`,
      );
      continue;
    }

    const entry = entriesById.get(selectedId);
    if (!entry) {
      violations.push(`Unknown catalog entry "${selectedId}" selected for slot "${slotId}".`);
      continue;
    }

    const requiresList =
      entry.compatibility && typeof entry.compatibility === 'object'
        ? entry.compatibility.requires
        : undefined;

    if (!Array.isArray(requiresList)) {
      continue;
    }

    for (const requiredId of requiresList) {
      if (typeof requiredId !== 'string') {
        continue;
      }
      const requiredEntry = entriesById.get(requiredId);
      if (!requiredEntry) {
        violations.push(`"${entry.id}" requires unknown catalog entry "${requiredId}".`);
      } else if (selections[requiredEntry.slotId] !== requiredId) {
        violations.push(
          `"${entry.id}" requires "${requiredId}": select "${requiredEntry.name}" in the ${requiredEntry.slotId} slot.`,
        );
      }
    }
  }

  return violations;
}
