// Fuel-first steady-state performance model public exports (Milestone 5).

export {
  computeCurve,
  computeDetails,
  interpolateKnots,
  type DynoPointDetail,
} from './model';
export {
  CYLINDER_COUNT,
  MODEL_RPM_KNOTS,
  RPM_GRID,
  UNCERTAINTY_PCT,
  perfConfig,
  type PerfConfig,
  type ProvenancedCurve,
} from './perfConfig';
export {
  ALL_PART_SLOTS,
  FUEL_REQ_KEYS,
  resolveBuild,
  type ResolvedParams,
} from './resolveBuild';
export { stockBuild, stockCatalog } from './stockBuild';
