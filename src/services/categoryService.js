import { supabase } from '../lib/supabase';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Build flat list with display labels: "Parent" or "Parent > Child" */
export function buildCategoryOptions(categories) {
  const byParent = {};
  (categories || []).forEach((c) => {
    const pid = c.parent_id ?? 'root';
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(c);
  });
  const options = [];
  (byParent['root'] || []).forEach((p) => {
    options.push({ value: p.name, label: p.name, id: p.id });
    (byParent[p.id] || []).forEach((c) => {
      options.push({ value: `${p.name} > ${c.name}`, label: `${p.name} > ${c.name}`, id: c.id });
    });
  });
  return options;
}

export async function createCategory(name, parentId = null) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), parent_id: parentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, updates) {
  const payload = { ...updates };
  if ('name' in updates) payload.name = (updates.name || '').trim();
  if ('parent_id' in updates) payload.parent_id = updates.parent_id || null;
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
