import { supabase } from '../lib/supabase';

/** Fetch all transactions with item details for analytics */
export async function getTransactionsWithItems() {
  const { data: tx, error } = await supabase
    .from('item_transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const itemIds = [...new Set((tx || []).map((t) => t.item_id).filter(Boolean))];
  if (itemIds.length === 0) return (tx || []).map((t) => ({ ...t, item: null }));

  const { data: items, error: itemsErr } = await supabase
    .from('items')
    .select('id, name, category, qr_id')
    .in('id', itemIds);
  if (itemsErr) throw itemsErr;

  const itemMap = Object.fromEntries((items || []).map((i) => [i.id, i]));
  return (tx || []).map((t) => ({ ...t, item: itemMap[t.item_id] || null }));
}
