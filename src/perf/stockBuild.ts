// Stock Duramax LLY (Allison automatic) build and typed default catalog view
// (D-008, D-016, D-032; docs/specs/M5-performance.md §2).

import stockCatalogJson from '../../catalog/stock.json';
import type { Build, PartVariant } from '../core/interfaces';

export const stockCatalog: PartVariant[] = stockCatalogJson as PartVariant[];

export const stockBuild: Build = {
  buildId: 'stock',
  name: 'Stock (Allison automatic)',
  selections: {
    turbo: 'turbo_stock',
    injectors: 'injectors_stock',
    cp3: 'cp3_stock',
    intake: 'intake_stock',
    exhaust: 'exhaust_stock',
    intercooler: 'intercooler_stock',
    tune: 'tune_stock',
    pistons: 'pistons_stock',
    rods: 'rods_stock',
    camshaft: 'camshaft_stock',
    heads: 'heads_stock',
    fuelRail: 'fuelRail_stock',
  },
};
