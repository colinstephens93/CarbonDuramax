import { describe, expect, it } from 'vitest';
import { engineConfig } from './engineConfig';

describe('engineConfig', () => {
  it('computes 8-cylinder displacement from bore and stroke within 0.02 L of 6.6 L', () => {
    const boreCm = engineConfig.boreMm.value / 10;
    const strokeCm = engineConfig.strokeMm.value / 10;
    const singleCylinderCm3 = Math.PI * Math.pow(boreCm / 2, 2) * strokeCm;
    const displacementLiters = (singleCylinderCm3 * 8) / 1000;

    expect(Math.abs(displacementLiters - 6.6)).toBeLessThanOrEqual(0.02);
  });

  it('has a firing order that is a permutation of cylinders 1 through 8', () => {
    expect(engineConfig.firingOrder).toHaveLength(8);
    expect([...engineConfig.firingOrder].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('assigns banks as RH 1-3-5-7 and LH 2-4-6-8', () => {
    expect(engineConfig.bankAssignment).toEqual({
      1: 'RH',
      2: 'LH',
      3: 'RH',
      4: 'LH',
      5: 'RH',
      6: 'LH',
      7: 'RH',
      8: 'LH',
    });
  });

  it('keeps rodLengthMm strictly greater than crankThrowMm for slider-crank geometry', () => {
    expect(engineConfig.rodLengthMm.value).toBeGreaterThan(engineConfig.crankThrowMm.value);
  });
});
