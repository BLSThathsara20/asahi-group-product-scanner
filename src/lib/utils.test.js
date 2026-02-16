import { describe, it, expect } from 'vitest';
import { generateQrId } from './utils';

describe('generateQrId', () => {
  it('returns a string starting with AGL-INV-', () => {
    const id = generateQrId();
    expect(id).toMatch(/^AGL-INV-/);
  });

  it('returns an 8-character suffix after AGL-INV-', () => {
    const id = generateQrId();
    const suffix = id.replace('AGL-INV-', '');
    expect(suffix).toHaveLength(8);
    expect(suffix).toMatch(/^[A-Z0-9]+$/);
  });

  it('generates unique ids', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateQrId());
    }
    expect(ids.size).toBe(100);
  });
});
