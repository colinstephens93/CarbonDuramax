// Three.js renderer module exports (the sole layer permitted to import three).

export {
  createEngineScene,
  type CameraPose,
  type EngineRenderStats,
  type EngineSceneController,
  type QualityMode,
  type QualityTier,
} from './engineScene';
export { loadRegisteredExteriorShell, type LoadedExteriorShell } from './exteriorLoader';
export {
  bankFrameAxes,
  bankLocalToWorldMm,
  computeEngineLayout,
  computeLayoutClearancesMm,
  computeRodSeatOffsetMm,
  computeStationCenterXMm,
  type CylinderLayout,
  type EngineLayout,
  type ExteriorRegistrationSpec,
  type LayoutClearanceReportMm,
  type LocalXwbMm,
  type StationLayout,
  type ValvetrainLayoutMm,
} from './layout';
export {
  createPartLoader,
  extractPartInstance,
  extractPartPrimitives,
  loadPartGltf,
  wrapInPartLocalFrame,
  type ExtractedPartPrimitive,
} from './partLoader';
