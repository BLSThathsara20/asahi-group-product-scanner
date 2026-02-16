import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSupabaseConnection, runHealthCheck } from './healthService';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
    },
  },
}));

describe('healthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSupabaseConnection', () => {
    it('returns ok when connection succeeds', async () => {
      const result = await checkSupabaseConnection();
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
      expect(result.checks).toHaveProperty('supabase');
      expect(result.checks).toHaveProperty('auth');
    });
  });
});
