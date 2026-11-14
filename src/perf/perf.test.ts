import { describe, expect, it } from 'vitest';
import { stockRatings } from '../config/engineConfig';
import type { Build, LimitKind, PartVariant } from '../core/interfaces';
import {
  ALL_PART_SLOTS,
  FUEL_REQ_KEYS,
  computeCurve,
  computeDetails,
  resolveBuild,
  stockBuild,
  stockCatalog,
} from './index';

const VALID_LIMIT_KINDS: ReadonlySet<LimitKind> = new Set([
  'smoke',
  'egt',
  'turbo',
  'cp3',
  'tune',
]);

function cloneCatalogWithOverride(
  entryId: string,
  overrideParams: Record<string, number>,
): PartVariant[] {
  return stockCatalog.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          performanceParams: {
            ...entry.performanceParams,
            ...overrideParams,
          },
        }
      : { ...entry, performanceParams: { ...entry.performanceParams } },
  );
}

describe('Milestone 5 fuel-first performance model', () => {
  it('1. calibration: stock build hits published Allison peaks within ±3% and RPM windows', () => {
    const curve = computeCurve(stockBuild);
    const details = computeDetails(stockBuild);

    const tableLines = curve.rpmPoints.map((rpm, i) => {
      const t = curve.torqueLbFt[i]!.toFixed(2).padStart(6);
      const p = curve.powerHp[i]!.toFixed(2).padStart(6);
      const lim = curve.bindingLimitPerPoint[i]!.padEnd(5);
      const q = details[i]!.fuelMm3.toFixed(2).padStart(6);
      const boost = details[i]!.boostPsiGauge.toFixed(1).padStart(5);
      const afr = details[i]!.afr.toFixed(1).padStart(5);
      const egt = details[i]!.egtF.toFixed(0).padStart(4);
      return `  ${rpm} RPM | ${t} lb-ft | ${p} hp | ${lim} | Q=${q} mm³ | boost=${boost} psi | AFR=${afr} | EGT=${egt} °F`;
    });
    console.info(
      `[M5 Stock Calibration Curve — ${stockBuild.name}]\n${tableLines.join('\n')}`,
    );

    let maxTorque = -Infinity;
    let maxTorqueRpm = 0;
    let maxPower = -Infinity;
    let maxPowerRpm = 0;

    for (let i = 0; i < curve.rpmPoints.length; i += 1) {
      if (curve.torqueLbFt[i]! > maxTorque) {
        maxTorque = curve.torqueLbFt[i]!;
        maxTorqueRpm = curve.rpmPoints[i]!;
      }
      if (curve.powerHp[i]! > maxPower) {
        maxPower = curve.powerHp[i]!;
        maxPowerRpm = curve.rpmPoints[i]!;
      }
    }

    const ratedTorque = stockRatings.peakTorqueLbFt.value; // 605 lb-ft
    const ratedPower = stockRatings.peakPowerHp.value; // 310 hp

    expect(maxTorque).toBeGreaterThanOrEqual(ratedTorque * 0.97);
    expect(maxTorque).toBeLessThanOrEqual(ratedTorque * 1.03);
    expect(maxTorqueRpm).toBeGreaterThanOrEqual(1450);
    expect(maxTorqueRpm).toBeLessThanOrEqual(1750);

    expect(maxPower).toBeGreaterThanOrEqual(ratedPower * 0.97);
    expect(maxPower).toBeLessThanOrEqual(ratedPower * 1.03);
    expect(maxPowerRpm).toBeGreaterThanOrEqual(2850);
    expect(maxPowerRpm).toBeLessThanOrEqual(3150);
  });

  it('2. identity & grid: 25 points (1000..3400 step 100), finite positive outputs, exact power-torque identity, and detail parity', () => {
    const curve = computeCurve(stockBuild);
    const details = computeDetails(stockBuild);

    expect(curve.rpmPoints).toHaveLength(25);
    expect(curve.torqueLbFt).toHaveLength(25);
    expect(curve.powerHp).toHaveLength(25);
    expect(curve.bindingLimitPerPoint).toHaveLength(25);
    expect(curve.uncertaintyPct).toHaveLength(25);
    expect(details).toHaveLength(25);

    for (let i = 0; i < 25; i += 1) {
      const expectedRpm = 1000 + i * 100;
      const rpm = curve.rpmPoints[i]!;
      const torque = curve.torqueLbFt[i]!;
      const power = curve.powerHp[i]!;
      const detail = details[i]!;

      expect(rpm).toBe(expectedRpm);
      expect(Number.isFinite(torque)).toBe(true);
      expect(Number.isFinite(power)).toBe(true);
      expect(torque).toBeGreaterThan(0);
      expect(power).toBeGreaterThan(0);

      const expectedPower = (torque * rpm) / 5252.113;
      expect(Math.abs(power - expectedPower)).toBeLessThan(1e-6);

      // Shared implementation parity between computeCurve and computeDetails
      expect(detail.rpm).toBe(rpm);
      expect(detail.limit).toBe(curve.bindingLimitPerPoint[i]);
      expect(detail.boostPsiGauge).toBeCloseTo((detail.pressureRatio - 1) * 14.7, 9);
    }
  });

  it('3. limits: every point belongs to frozen LimitKind; stock binds smoke/turbo at 1000 and tune at 1600 & 3000', () => {
    const curve = computeCurve(stockBuild);

    for (const limit of curve.bindingLimitPerPoint) {
      expect(VALID_LIMIT_KINDS.has(limit)).toBe(true);
    }

    const idx1000 = curve.rpmPoints.indexOf(1000);
    const idx1600 = curve.rpmPoints.indexOf(1600);
    const idx3000 = curve.rpmPoints.indexOf(3000);

    expect(['smoke', 'turbo']).toContain(curve.bindingLimitPerPoint[idx1000]);
    expect(curve.bindingLimitPerPoint[idx1600]).toBe('tune');
    expect(curve.bindingLimitPerPoint[idx3000]).toBe('tune');
  });

  it('4. shape: torque falls past peak (3400 < 1600), power rolls off past peak (3400 < 3000), and 1000 RPM floor >= 380 lb-ft', () => {
    const curve = computeCurve(stockBuild);

    const idx1000 = curve.rpmPoints.indexOf(1000);
    const idx1600 = curve.rpmPoints.indexOf(1600);
    const idx3000 = curve.rpmPoints.indexOf(3000);
    const idx3400 = curve.rpmPoints.indexOf(3400);

    expect(curve.torqueLbFt[idx3400]!).toBeLessThan(curve.torqueLbFt[idx1600]!);
    expect(curve.powerHp[idx3400]!).toBeLessThan(curve.powerHp[idx3000]!);
    expect(curve.torqueLbFt[idx1000]!).toBeGreaterThanOrEqual(380);
  });

  it('5a. synthetic cap: fuel request x1.6 at all knots causes cp3 or egt to bind', () => {
    const stockTune = stockCatalog.find((e) => e.id === 'tune_stock')!;
    const scaledFuelParams: Record<string, number> = {};
    for (const key of FUEL_REQ_KEYS) {
      scaledFuelParams[key] = stockTune.performanceParams[key]! * 1.6;
    }

    const catalog = cloneCatalogWithOverride('tune_stock', scaledFuelParams);
    const curve = computeCurve(stockBuild, catalog);

    const bindsPhysicalFuelOrThermal = curve.bindingLimitPerPoint.some(
      (lim) => lim === 'cp3' || lim === 'egt',
    );
    expect(bindsPhysicalFuelOrThermal).toBe(true);
  });

  it('5b. synthetic cap: egtLimitF = 900 causes egt to bind', () => {
    const catalog = cloneCatalogWithOverride('tune_stock', { egtLimitF: 900 });
    const curve = computeCurve(stockBuild, catalog);

    expect(curve.bindingLimitPerPoint).toContain('egt');
  });

  it('5c. synthetic cap: boostMaxPr = 1.3 with stock boostReqPr causes turbo to bind at >= 2000 RPM', () => {
    const catalog = cloneCatalogWithOverride('turbo_stock', { boostMaxPr: 1.3 });
    const curve = computeCurve(stockBuild, catalog);

    const highRpmLimits = curve.rpmPoints
      .map((rpm, idx) => ({ rpm, limit: curve.bindingLimitPerPoint[idx]! }))
      .filter((pt) => pt.rpm >= 2000);

    expect(highRpmLimits.some((pt) => pt.limit === 'turbo')).toBe(true);
  });

  it('5d. synthetic cap: flowBaseKgH = 5 and flowSlopeKgHPerRpm = 0 causes cp3 to bind', () => {
    const catalog = cloneCatalogWithOverride('cp3_stock', {
      flowBaseKgH: 5,
      flowSlopeKgHPerRpm: 0,
    });
    const curve = computeCurve(stockBuild, catalog);

    expect(curve.bindingLimitPerPoint).toContain('cp3');
  });

  it('5e. attribution details: injector flow ceiling stays tune with injector detail; compressor choke attributes smoke shortage to turbo', () => {
    const injectorCappedCatalog = cloneCatalogWithOverride('injectors_stock', {
      maxFuelMm3: 85,
    });
    const injDetails = computeDetails(stockBuild, injectorCappedCatalog);
    const pt1600 = injDetails.find((d) => d.rpm === 1600)!;
    expect(pt1600.fuelMm3).toBeCloseTo(85, 6);
    expect(pt1600.limit).toBe('tune');
    expect(pt1600.limitDetail).toBe('injector flow ceiling');

    const chokedTurboCatalog = cloneCatalogWithOverride('turbo_stock', {
      maxAirKgS: 0.14,
    });
    const chokedDetails = computeDetails(stockBuild, chokedTurboCatalog);
    const pt3000 = chokedDetails.find((d) => d.rpm === 3000)!;
    expect(pt3000.limit).toBe('turbo');
    expect(pt3000.limitDetail).toContain('choke');
  });

  it('6. uncertainty: every point equals 8.0 (±0.01) on the stock build', () => {
    const curve = computeCurve(stockBuild);

    for (const u of curve.uncertaintyPct) {
      expect(Math.abs(u - 8.0)).toBeLessThanOrEqual(0.01);
    }
  });

  it('7. resolver: resolves all 12 stock slots and throws on unknown id, slot mismatch, or missing required param', () => {
    const resolved = resolveBuild(stockBuild);
    expect(Object.keys(resolved)).toHaveLength(ALL_PART_SLOTS.length);
    expect(resolved.turbo.boostMaxPr).toBe(2.5);
    expect(resolved.cp3.maxRailPsi).toBe(23000);
    expect(resolved.pistons.compressionRatio).toBe(17.5);

    const unknownBuild: Build = {
      ...stockBuild,
      selections: {
        ...stockBuild.selections,
        turbo: 'turbo_nonexistent_stage99',
      },
    };
    expect(() => resolveBuild(unknownBuild)).toThrow(/unknown catalog entry/i);

    const mismatchedBuild: Build = {
      ...stockBuild,
      selections: {
        ...stockBuild.selections,
        turbo: 'injectors_stock',
      },
    };
    expect(() => resolveBuild(mismatchedBuild)).toThrow(/slot mismatch/i);

    const missingParamCatalog: PartVariant[] = stockCatalog.map((entry) =>
      entry.id === 'turbo_stock'
        ? { ...entry, performanceParams: {} }
        : entry,
    );
    expect(() => resolveBuild(stockBuild, missingParamCatalog)).toThrow(
      /missing required performanceParams key/i,
    );
  });

  it('8. determinism: repeated calls on the stock build return deep-equal results', () => {
    const curveA = computeCurve(stockBuild);
    const curveB = computeCurve(stockBuild);
    expect(curveA).toEqual(curveB);

    const detailsA = computeDetails(stockBuild);
    const detailsB = computeDetails(stockBuild);
    expect(detailsA).toEqual(detailsB);
  });
});
