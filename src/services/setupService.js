import { supabase } from '../lib/supabase';

/**
 * Returns true if a super_admin already exists. Used to hide setup link on Login.
 * Handles 404 when setup_complete RPC doesn't exist (run SUPABASE_FULL_SETUP.sql).
 */
export async function isSetupComplete() {
  try {
    const { data, error } = await supabase.rpc('setup_complete');
    if (error) return true; // If function missing (404) or error, assume setup done (hide link for safety)
    return data === true;
  } catch {
    return true; // On any error, hide link for safety
  }
}
