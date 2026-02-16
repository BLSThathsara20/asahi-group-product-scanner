import { supabase } from '../lib/supabase';

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Returns { [id]: "full_name or email" } for display */
export async function getProfilesByIds(ids) {
  const validIds = (ids || []).filter((id) => id != null && id !== '');
  if (!validIds.length) return {};
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', validIds);
  if (error) throw error;
  const map = {};
  (data || []).forEach((p) => {
    map[p.id] = p.full_name?.trim() || p.email || 'Unknown';
  });
  return map;
}

export async function updateProfileRole(id, role) {
  const roleVal = role && String(role).trim();
  if (!roleVal) throw new Error('Role is required');
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: roleVal, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

const PROFILE_UPDATE_FIELDS = ['full_name', 'address', 'phone_number'];

export async function updateProfile(id, updates) {
  const payload = { updated_at: new Date().toISOString() };
  for (const key of PROFILE_UPDATE_FIELDS) {
    if (key in updates) {
      const val = updates[key];
      payload[key] = val === '' || val === undefined ? null : String(val);
    }
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(id) {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}

export async function createInvite(email, role) {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const { error } = await supabase.from('user_invites').insert({
    email,
    role,
    token,
    created_by: (await supabase.auth.getUser()).data.user?.id,
  });
  if (error) throw error;
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite?invite=${token}`;
}

/** Add user via activation link. Creates invite with temp password, returns activation URL. */
export async function addUser(email, fullName, role, tempPassword) {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const { error } = await supabase.from('user_invites').insert({
    email,
    role,
    token,
    full_name: fullName || null,
    temp_password: tempPassword,
    created_by: (await supabase.auth.getUser()).data.user?.id,
  });
  if (error) throw error;
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}${(import.meta.env?.BASE_URL || '').replace(/\/$/, '')}`
    : '';
  return { activationLink: `${base}/activate?token=${token}` };
}

/** Get invite by token (for activation page) */
export async function getInviteByToken(token) {
  const { data, error } = await supabase.rpc('get_invite_by_token', { t: token });
  if (error) throw error;
  return data?.[0] || null;
}

/** Verify temp password for activation */
export async function verifyInviteTempPassword(token, tempPassword) {
  const { data, error } = await supabase.rpc('verify_invite_temp_password', {
    t: token,
    pwd: tempPassword,
  });
  if (error) throw error;
  return !!data;
}
