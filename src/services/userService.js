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
  if (!ids?.length) return {};
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);
  if (error) throw error;
  const map = {};
  (data || []).forEach((p) => {
    map[p.id] = p.full_name?.trim() || p.email || 'Unknown';
  });
  return map;
}

export async function updateProfileRole(id, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
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

/** Create invite record for add-user flow; returns token for signUp metadata */
async function createInviteForAddUser(email, role) {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const { error } = await supabase.from('user_invites').insert({
    email,
    role,
    token,
    created_by: (await supabase.auth.getUser()).data.user?.id,
  });
  if (error) throw error;
  return token;
}

/** Add user directly with temp password. Admin only. */
export async function addUser(email, fullName, role, tempPassword) {
  const token = await createInviteForAddUser(email, role);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: { full_name: fullName || email, invite_token: token },
    },
  });
  if (error) throw error;
  return data;
}
