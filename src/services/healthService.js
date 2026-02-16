import { supabase } from '../lib/supabase';

const CHECK_TIMEOUT_MS = 5000;

async function withTimeout(promise, ms = CHECK_TIMEOUT_MS) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function checkSupabaseConnection() {
  const start = Date.now();
  try {
    const { error } = await withTimeout(supabase.from('items').select('id').limit(1));
    return {
      ok: !error,
      latencyMs: Date.now() - start,
      error: error?.message,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Connection failed',
    };
  }
}

export async function checkAuth() {
  try {
    const { data: { session }, error } = await withTimeout(supabase.auth.getSession());
    return {
      ok: !error,
      authenticated: !!session?.user,
      error: error?.message,
    };
  } catch (err) {
    return {
      ok: false,
      authenticated: false,
      error: err.message || 'Auth check failed',
    };
  }
}

export async function getDatabaseStats() {
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('get_database_stats')
    );
    if (error) throw error;
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err.message || 'Failed to fetch DB stats',
    };
  }
}

export async function runHealthCheck() {
  const [supabaseResult, authResult, dbStatsResult] = await Promise.all([
    checkSupabaseConnection(),
    checkAuth(),
    getDatabaseStats(),
  ]);

  const healthy = supabaseResult.ok;
  const checks = {
    supabase: supabaseResult,
    auth: authResult,
    dbStats: dbStatsResult,
  };

  return {
    healthy,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks,
  };
}
