import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSanityConnection, runHealthCheck } from './healthService';

vi.mock('../lib/sanity', () => ({
  sanityClient: {
    fetch: vi.fn(() => Promise.resolve(0)),
  },
  isSanityConfigured: vi.fn(() => true),
}));

vi.mock('../lib/authStorage', () => ({
  getStoredSession: vi.fn(() => null),
}));

describe('healthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSanityConnection', () => {
    it('returns ok when connection succeeds', async () => {
      const result = await checkSanityConnection();
      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('runHealthCheck', () => {
    it('returns healthy status with all checks', async () => {
      const result = await runHealthCheck();
      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('sanity');
      expect(result.checks).toHaveProperty('auth');
    });
  });
});
