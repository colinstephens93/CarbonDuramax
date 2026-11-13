import { describe, expect, it } from 'vitest';

// Deliberate failure — exists only to prove that branch protection blocks
// merging when CI is red (Milestone 0 acceptance criterion 3). Do not merge.
describe('merge-block proof', () => {
  it('fails on purpose', () => {
    expect(true).toBe(false);
  });
});
