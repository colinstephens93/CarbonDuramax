// Application entry point for Duramax LLY Engine Lab (Milestone 0 scaffold).

import { mountSmokeCube } from './renderer/smokeCube';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container element.');
}

mountSmokeCube(container);
