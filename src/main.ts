// Application entry point for Duramax LLY Engine Lab (Milestone 1: Kinematic Core, Primitives).

import { engineConfig } from './config/engineConfig';
import { valveConfig } from './config/valveConfig';
import { createEngineScene } from './renderer/engineScene';
import { mountEngineUi } from './ui/engineControls';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container element.');
}

const scene = createEngineScene(container, engineConfig, valveConfig);
mountEngineUi(engineConfig, valveConfig, (state) => {
  scene.update(state);
});
