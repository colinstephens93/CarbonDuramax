// Pure, DOM-free and Three.js-free reference-frame table (RF-1 .. RF-10)
// (Milestone 8, D-038; docs/specs/M8-part-variants.md §5.2, §9.12).

import type { UiSectionMode } from './engineControls';

export interface ReferenceFrameDef {
  readonly thetaDeg: number;
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly exterior: boolean;
  readonly explodePercent?: number;
  readonly sectionMode?: UiSectionMode;
  readonly sectionPositionMm?: number;
  readonly xray?: boolean;
  readonly labels?: boolean;
  readonly variants?: readonly string[];
}

export const REFERENCE_FRAME_DEFS: Readonly<Record<string, ReferenceFrameDef>> = {
  'RF-1': {
    thetaDeg: 0,
    position: [1.01, -0.78, 0.56],
    target: [0.25, -0.01, 0.12],
    exterior: false,
  },
  'RF-2': {
    thetaDeg: 470,
    position: [0.66, -0.38, 0.56],
    target: [0.4025, -0.2, 0.255],
    exterior: false,
  },
  'RF-3': {
    thetaDeg: 180,
    position: [1.38, -1.18, 0.72],
    target: [0.3, -0.02, 0.17],
    exterior: true,
  },
  'RF-4': {
    thetaDeg: 705,
    position: [0.23, -0.002, 1.18],
    target: [0.23, 0.0, 0.14],
    exterior: false,
  },
  'RF-5': {
    thetaDeg: 90,
    position: [1.28, -1.08, 0.74],
    target: [0.31, -0.05, 0.18],
    exterior: false,
    explodePercent: 100,
    labels: true,
  },
  'RF-6': {
    thetaDeg: 0,
    position: [1.06, -0.54, 0.48],
    target: [0.29, -0.02, 0.14],
    exterior: false,
    explodePercent: 0,
    sectionMode: 'x',
    sectionPositionMm: 402.5,
  },
  'RF-7': {
    thetaDeg: 180,
    position: [1.38, -1.18, 0.72],
    target: [0.3, -0.02, 0.17],
    exterior: true,
    explodePercent: 0,
    xray: true,
  },
  'RF-8': {
    thetaDeg: 180,
    position: [1.38, -1.18, 0.72],
    target: [0.3, -0.02, 0.17],
    exterior: true,
    explodePercent: 0,
    sectionMode: 'off',
    xray: false,
    labels: false,
    variants: ['turbo_large', 'intake_highflow', 'exhaust_4in', 'intercooler_upgraded'],
  },
  'RF-9': {
    thetaDeg: 0,
    position: [-0.62, 1.22, 0.86],
    target: [0.28, 0.02, 0.16],
    exterior: true,
    explodePercent: 0,
    sectionMode: 'off',
    xray: false,
    labels: false,
    variants: ['turbo_large', 'intake_highflow', 'exhaust_4in', 'intercooler_upgraded'],
  },
  'RF-10': {
    thetaDeg: 90,
    position: [1.28, -1.08, 0.74],
    target: [0.31, -0.05, 0.18],
    exterior: false,
    explodePercent: 100,
    sectionMode: 'off',
    xray: false,
    labels: true,
    variants: ['turbo_large', 'pistons_lowcomp'],
  },
};
