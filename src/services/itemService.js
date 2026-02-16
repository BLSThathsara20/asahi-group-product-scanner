import { supabase } from '../lib/supabase';

export async function createItem(item) {
  const { data, error } = await supabase.from('items').insert([item]).select().single();
  if (error) throw error;
  return data;
}

export async function getItemById(id) {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getItemByQrId(qrId) {
  const { data, error } = await supabase.from('items').select('*').eq('qr_id', qrId).single();
  if (error) throw error;
  return data;
}

/** Check if QR/barcode already exists (for duplicate prevention) */
export async function checkQrIdExists(qrId) {
  const normalized = String(qrId || '').trim();
  if (!normalized) return false;
  const { data, error } = await supabase.from('items').select('id').eq('qr_id', normalized).maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function updateItem(id, updates) {
  const { data, error } = await supabase
    .from('items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function getTransactions(itemId) {
  const { data, error } = await supabase
    .from('item_transactions')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTransaction(transaction) {
  const { data, error } = await supabase
    .from('item_transactions')
    .insert([transaction])
    .select()
    .single();
  if (error) throw error;
  return data;
}
