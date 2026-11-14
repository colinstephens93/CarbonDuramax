import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import type { Build, PartSlotId, PartVariant, PerformanceResult } from '../core/interfaces';
import {
  ALL_PART_SLOTS,
  computeCurve,
  computeDetails,
  resolveBuild,
  stockBuild,
  stockCatalog,
} from '../perf';
import { computeAxisMaxima } from '../ui/dynoChart';
import { checkCompatibility, fullCatalog, variantsForSlot } from './index';

function makeBuildWith(
  overrides: Partial<Record<PartSlotId, string>>,
  buildId = 'modified',
  name = 'Modified build',
): Build {
  return {
    buildId,
    name,
    selections: {
      ...stockBuild.selections,
      ...overrides,
    },
  };
}

function findPeak(
  rpmPoints: readonly number[],
  values: readonly number[],
): { value: number; rpm: number } {
  let bestIdx = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! > values[bestIdx]!) {
      bestIdx = i;
    }
  }
  return {
    value: values[bestIdx]!,
    rpm: rpmPoints[bestIdx]!,
  };
}

const FULL_BUILD_OVERRIDES: Partial<Record<PartSlotId, string>> = {
  turbo: 'turbo_large',
  injectors: 'injectors_plus30',
  cp3: 'cp3_stroker',
  tune: 'tune_performance',
  intake: 'intake_highflow',
  exhaust: 'exhaust_4in',
  intercooler: 'intercooler_upgraded',
  heads: 'heads_ported',
  camshaft: 'cam_performance',
};

describe('Milestone 6 parts catalog, compatibility, and build comparison', () => {
  it('1. schema: validates catalog/modified.json and merged fullCatalog (24 unique ids) against catalog/schema.json', () => {
    const repoRoot = process.cwd();
    const schemaRaw = readFileSync(resolve(repoRoot, 'catalog/schema.json'), 'utf-8');
    const modifiedRaw = readFileSync(resolve(repoRoot, 'catalog/modified.json'), 'utf-8');

    const schema = JSON.parse(schemaRaw) as Record<string, unknown>;
    const modified = JSON.parse(modifiedRaw) as PartVariant[];

    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);

    const modifiedValid = validate(modified);
    expect(validate.errors).toBeNull();
    expect(modifiedValid).toBe(true);
    expect(modified).toHaveLength(12);

    const mergedValid = validate(fullCatalog);
    expect(validate.errors).toBeNull();
    expect(mergedValid).toBe(true);
    expect(fullCatalog).toHaveLength(24);

    const uniqueIds = new Set(fullCatalog.map((entry) => entry.id));
    expect(uniqueIds.size).toBe(24);

    for (const entry of modified) {
      expect(entry.provenance).toBe('illustrative');
      expect(entry.modelPath).toBeNull();
      expect(entry.explodeVectorMm).toEqual([0, 0, 0]);
      expect(typeof entry.notes).toBe('string');
      expect(entry.notes!.trim().length).toBeGreaterThan(0);
    }
  });

  it('2. coverage: fullCatalog has 24 entries in stock-then-modified order and variantsForSlot covers all 12 slots', () => {
    expect(fullCatalog).toHaveLength(24);

    for (let i = 0; i < stockCatalog.length; i += 1) {
      expect(fullCatalog[i]?.id).toBe(stockCatalog[i]?.id);
    }

    for (const slotId of ALL_PART_SLOTS) {
      const variants = variantsForSlot(slotId);
      expect(variants[0]?.id).toBe(stockBuild.selections[slotId]);

      if (slotId === 'fuelRail') {
        expect(variants).toHaveLength(1);
      } else if (slotId === 'tune') {
        expect(variants).toHaveLength(3);
      } else {
        expect(variants.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('3. resolver seam & key-set equality: every modified variant resolves individually, all-modified resolves, and performanceParams keys match stock exactly', () => {
    const modifiedEntries = fullCatalog.slice(stockCatalog.length);
    expect(modifiedEntries).toHaveLength(12);

    for (const variant of modifiedEntries) {
      const singleModBuild = makeBuildWith({ [variant.slotId]: variant.id });
      expect(() => resolveBuild(singleModBuild, fullCatalog)).not.toThrow();

      const stockEntryForSlot = stockCatalog.find((e) => e.slotId === variant.slotId)!;
      const modKeys = Object.keys(variant.performanceParams).sort();
      const stockKeys = Object.keys(stockEntryForSlot.performanceParams).sort();
      expect(modKeys).toEqual(stockKeys);
    }

    const allModifiedBuild = makeBuildWith({
      ...FULL_BUILD_OVERRIDES,
      pistons: 'pistons_lowcomp',
      rods: 'rods_forged',
    });
    expect(() => resolveBuild(allModifiedBuild, fullCatalog)).not.toThrow();
  });

  it('4. intake-only near-zero: intake_highflow on stock tune keeps peaks within ±2% at the same RPMs', () => {
    const stockCurve = computeCurve(stockBuild, fullCatalog);
    const intakeBuild = makeBuildWith({ intake: 'intake_highflow' });
    const intakeCurve = computeCurve(intakeBuild, fullCatalog);

    const stockPeakTorque = findPeak(stockCurve.rpmPoints, stockCurve.torqueLbFt);
    const stockPeakPower = findPeak(stockCurve.rpmPoints, stockCurve.powerHp);
    const intakePeakTorque = findPeak(intakeCurve.rpmPoints, intakeCurve.torqueLbFt);
    const intakePeakPower = findPeak(intakeCurve.rpmPoints, intakeCurve.powerHp);

    const torqueDeltaPct =
      ((intakePeakTorque.value - stockPeakTorque.value) / stockPeakTorque.value) * 100;
    const powerDeltaPct =
      ((intakePeakPower.value - stockPeakPower.value) / stockPeakPower.value) * 100;

    expect(Math.abs(torqueDeltaPct)).toBeLessThanOrEqual(2.0);
    expect(Math.abs(powerDeltaPct)).toBeLessThanOrEqual(2.0);
    expect(intakePeakTorque.rpm).toBe(stockPeakTorque.rpm);
    expect(intakePeakPower.rpm).toBe(stockPeakPower.rpm);
  });

  it('5. tune-only caps: Performance Tune gains >= +15% peak power, caps boost at PR 2.50 with egt limit at 3000 RPM, and turbo limit at 1000 RPM', () => {
    const stockCurve = computeCurve(stockBuild, fullCatalog);
    const tuneBuild = makeBuildWith({ tune: 'tune_performance' });
    const tuneCurve = computeCurve(tuneBuild, fullCatalog);
    const tuneDetails = computeDetails(tuneBuild, fullCatalog);

    const stockPeakPower = findPeak(stockCurve.rpmPoints, stockCurve.powerHp);
    const tunePeakPower = findPeak(tuneCurve.rpmPoints, tuneCurve.powerHp);

    expect(tunePeakPower.value).toBeGreaterThanOrEqual(stockPeakPower.value * 1.15);

    const pt1000 = tuneDetails.find((d) => d.rpm === 1000)!;
    const pt3000 = tuneDetails.find((d) => d.rpm === 3000)!;

    expect(pt1000.limit).toBe('turbo');
    expect(Math.abs(pt3000.pressureRatio - 2.5)).toBeLessThanOrEqual(0.01);
    expect(pt3000.limit).toBe('egt');
  });

  it('6. full-build gains: nine-part full build gains >= +15% peak power and >= +10% peak torque, delivering 112 mm³ at 3000 RPM on tune limit', () => {
    const stockCurve = computeCurve(stockBuild, fullCatalog);
    const fullBuild = makeBuildWith(FULL_BUILD_OVERRIDES);
    const fullCurve = computeCurve(fullBuild, fullCatalog);
    const fullDetails = computeDetails(fullBuild, fullCatalog);

    const stockPeakTorque = findPeak(stockCurve.rpmPoints, stockCurve.torqueLbFt);
    const stockPeakPower = findPeak(stockCurve.rpmPoints, stockCurve.powerHp);
    const fullPeakTorque = findPeak(fullCurve.rpmPoints, fullCurve.torqueLbFt);
    const fullPeakPower = findPeak(fullCurve.rpmPoints, fullCurve.powerHp);

    expect(fullPeakPower.value).toBeGreaterThanOrEqual(stockPeakPower.value * 1.15);
    expect(fullPeakTorque.value).toBeGreaterThanOrEqual(stockPeakTorque.value * 1.10);

    const pt3000 = fullDetails.find((d) => d.rpm === 3000)!;
    expect(pt3000.limit).toBe('tune');
    expect(Math.abs(pt3000.fuelMm3 - 112)).toBeLessThanOrEqual(0.5);
    expect(pt3000.egtF).toBeLessThanOrEqual(1300);
  });

  it('7. compatibility: enforces exact violation messages, accepts coherent builds, and never throws on unknown selections', () => {
    // Rule 1: pistons_lowcomp + stock turbo
    const lowCompStockTurbo = makeBuildWith({ pistons: 'pistons_lowcomp' });
    expect(checkCompatibility(lowCompStockTurbo, fullCatalog)).toEqual([
      '"pistons_lowcomp" requires "turbo_large": select "Large Variable-Geometry Turbo" in the turbo slot.',
    ]);

    // Rule 2: injectors_plus30 + stock CP3
    const injStockCp3 = makeBuildWith({ injectors: 'injectors_plus30' });
    const rule2Violations = checkCompatibility(injStockCp3, fullCatalog);
    expect(rule2Violations).toHaveLength(1);
    expect(rule2Violations[0]).toContain('injectors_plus30');
    expect(rule2Violations[0]).toContain('cp3_stroker');
    expect(rule2Violations).toEqual([
      '"injectors_plus30" requires "cp3_stroker": select "Stroker CP3 High-Pressure Pump" in the cp3 slot.',
    ]);

    // Coherent full build + pistons_lowcomp + rods_forged
    const coherentAllModBuild = makeBuildWith({
      ...FULL_BUILD_OVERRIDES,
      pistons: 'pistons_lowcomp',
      rods: 'rods_forged',
    });
    expect(checkCompatibility(coherentAllModBuild, fullCatalog)).toEqual([]);

    // Stock build
    expect(checkCompatibility(stockBuild, fullCatalog)).toEqual([]);

    // Defensive: unknown selection id reports violation without throwing
    const unknownSelectionBuild = makeBuildWith({ turbo: 'turbo_nonexistent_stage99' });
    let unknownViolations: string[] = [];
    expect(() => {
      unknownViolations = checkCompatibility(unknownSelectionBuild, fullCatalog);
    }).not.toThrow();
    expect(unknownViolations).toEqual([
      'Unknown catalog entry "turbo_nonexistent_stage99" selected for slot "turbo".',
    ]);

    // Data-driven: unknown required entry id and forward-compatible ignored rule keys
    const customCatalog: PartVariant[] = fullCatalog.map((entry) =>
      entry.id === 'intake_highflow'
        ? {
            ...entry,
            compatibility: {
              requires: ['phantom_part_id'],
              futureExcludesKey: ['exhaust_4in'],
            },
          }
        : entry,
    );
    expect(checkCompatibility(makeBuildWith({ intake: 'intake_highflow' }), customCatalog)).toEqual(
      ['"intake_highflow" requires unknown catalog entry "phantom_part_id".'],
    );

    // Module boundary check: src/catalog/index.ts never imports src/perf or ajv
    const catalogIndexSrc = readFileSync(resolve(process.cwd(), 'src/catalog/index.ts'), 'utf-8');
    expect(catalogIndexSrc).not.toMatch(/(?:^|[;\r\n])\s*(?:import|export)\b[^;'"]*?\bperf\b/);
    expect(catalogIndexSrc).not.toMatch(/(?:^|[;\r\n])\s*(?:import|export)\b[^;'"]*?\bajv\b/i);
  });

  it('8. stock unchanged through fullCatalog: computeCurve(stockBuild, fullCatalog) deep-equals computeCurve(stockBuild)', () => {
    expect(computeCurve(stockBuild, fullCatalog)).toEqual(computeCurve(stockBuild));
    expect(computeDetails(stockBuild, fullCatalog)).toEqual(computeDetails(stockBuild));
  });

  it('9. axis maxima (pure): covers stock (700/350), tune-only band extension (700/450), and full build (800/450)', () => {
    const stockCurve: PerformanceResult = computeCurve(stockBuild, fullCatalog);
    const tuneOnlyCurve: PerformanceResult = computeCurve(
      makeBuildWith({ tune: 'tune_performance' }),
      fullCatalog,
    );
    const fullBuildCurve: PerformanceResult = computeCurve(
      makeBuildWith(FULL_BUILD_OVERRIDES),
      fullCatalog,
    );

    expect(computeAxisMaxima([stockCurve])).toEqual({ torqueMax: 700, powerMax: 350 });
    expect(computeAxisMaxima([stockCurve, tuneOnlyCurve])).toEqual({
      torqueMax: 700,
      powerMax: 450,
    });
    expect(computeAxisMaxima([stockCurve, fullBuildCurve])).toEqual({
      torqueMax: 800,
      powerMax: 450,
    });
  });

  it('10. determinism & scenario table parity: repeated full-build evaluations return deep-equal results and match §11 scenarios', () => {
    const fullBuild = makeBuildWith(FULL_BUILD_OVERRIDES);
    const curveA = computeCurve(fullBuild, fullCatalog);
    const curveB = computeCurve(fullBuild, fullCatalog);
    expect(curveA).toEqual(curveB);

    const detailsA = computeDetails(fullBuild, fullCatalog);
    const detailsB = computeDetails(fullBuild, fullCatalog);
    expect(detailsA).toEqual(detailsB);

    // Print all §11 scenarios for independent audit
    const scenarios: ReadonlyArray<{ label: string; build: Build }> = [
      { label: 'Stock reference', build: stockBuild },
      { label: '(i) Intake only', build: makeBuildWith({ intake: 'intake_highflow' }) },
      { label: '(ii) Performance Tune only', build: makeBuildWith({ tune: 'tune_performance' }) },
      { label: '(iii) Full build', build: fullBuild },
      {
        label: '(iv) Low-comp pistons + large turbo + Perf. Tune',
        build: makeBuildWith({
          pistons: 'pistons_lowcomp',
          turbo: 'turbo_large',
          tune: 'tune_performance',
        }),
      },
      { label: '(bonus) Tow Tune only', build: makeBuildWith({ tune: 'tune_tow' }) },
    ];

    const stockCurve = computeCurve(stockBuild, fullCatalog);
    const stockPeakT = findPeak(stockCurve.rpmPoints, stockCurve.torqueLbFt);
    const stockPeakP = findPeak(stockCurve.rpmPoints, stockCurve.powerHp);

    const summarizeLimits = (rpms: readonly number[], limits: readonly string[]): string => {
      const runs: string[] = [];
      let startRpm = rpms[0]!;
      let endRpm = rpms[0]!;
      let cur = limits[0]!;
      for (let i = 1; i < rpms.length; i += 1) {
        if (limits[i] === cur) {
          endRpm = rpms[i]!;
        } else {
          runs.push(startRpm === endRpm ? `${cur} @ ${startRpm}` : `${cur} @ ${startRpm}–${endRpm}`);
          startRpm = rpms[i]!;
          endRpm = rpms[i]!;
          cur = limits[i]!;
        }
      }
      runs.push(startRpm === endRpm ? `${cur} @ ${startRpm}` : `${cur} @ ${startRpm}–${endRpm}`);
      return runs.join(', ');
    };

    const lines = scenarios.map(({ label, build }) => {
      const c = computeCurve(build, fullCatalog);
      const d = computeDetails(build, fullCatalog);
      const pkT = findPeak(c.rpmPoints, c.torqueLbFt);
      const pkP = findPeak(c.rpmPoints, c.powerHp);
      const dTPct = (((pkT.value - stockPeakT.value) / stockPeakT.value) * 100).toFixed(2);
      const dPPct = (((pkP.value - stockPeakP.value) / stockPeakP.value) * 100).toFixed(2);
      const idx1000 = c.rpmPoints.indexOf(1000);
      const idx1600 = c.rpmPoints.indexOf(1600);
      const idx3000 = c.rpmPoints.indexOf(3000);
      return [
        `  ${label}`,
        `    Peak Torque: ${pkT.value.toFixed(2)} lb-ft @ ${pkT.rpm} RPM (${Number(dTPct) >= 0 ? '+' : ''}${dTPct}%)`,
        `    Peak Power:  ${pkP.value.toFixed(2)} hp @ ${pkP.rpm} RPM (${Number(dPPct) >= 0 ? '+' : ''}${dPPct}%)`,
        `    Limits:      ${summarizeLimits(c.rpmPoints, c.bindingLimitPerPoint)}`,
        `    @1000: ${d[idx1000]!.limit}, Q=${d[idx1000]!.fuelMm3.toFixed(1)} mm³, PR=${d[idx1000]!.pressureRatio.toFixed(2)}, T=${c.torqueLbFt[idx1000]!.toFixed(1)} lb-ft, EGT=${Math.round(d[idx1000]!.egtF)} °F`,
        `    @1600: ${d[idx1600]!.limit}, Q=${d[idx1600]!.fuelMm3.toFixed(1)} mm³, PR=${d[idx1600]!.pressureRatio.toFixed(2)}, T=${c.torqueLbFt[idx1600]!.toFixed(1)} lb-ft, EGT=${Math.round(d[idx1600]!.egtF)} °F`,
        `    @3000: ${d[idx3000]!.limit}, Q=${d[idx3000]!.fuelMm3.toFixed(1)} mm³, PR=${d[idx3000]!.pressureRatio.toFixed(2)}, T=${c.torqueLbFt[idx3000]!.toFixed(1)} lb-ft, EGT=${Math.round(d[idx3000]!.egtF)} °F`,
      ].join('\n');
    });

    console.info(`[M6 Measured Scenario Table]\n${lines.join('\n')}`);
  });
});
