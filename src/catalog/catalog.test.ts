import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import type { PartVariant } from '../core/interfaces';

describe('parts catalog', () => {
  it('validates catalog/stock.json against catalog/schema.json and contains the stock turbo entry', () => {
    const repoRoot = process.cwd();
    const schemaRaw = readFileSync(resolve(repoRoot, 'catalog/schema.json'), 'utf-8');
    const stockRaw = readFileSync(resolve(repoRoot, 'catalog/stock.json'), 'utf-8');

    const schema = JSON.parse(schemaRaw) as Record<string, unknown>;
    const stock = JSON.parse(stockRaw) as PartVariant[];

    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(stock);

    expect(validate.errors).toBeNull();
    expect(valid).toBe(true);
    expect(stock).toHaveLength(12);
    expect(stock[0]?.slotId).toBe('turbo');
  });
});
