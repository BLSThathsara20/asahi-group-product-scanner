import { supabase } from '../lib/supabase';
import { getProfilesByIds } from './userService';

/** Fetch out/in counts for today, last 7 days, and last 30 days (for dashboard) */
export async function getDashboardActivityStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);

  const { data: tx, error } = await supabase
    .from('item_transactions')
    .select('type, created_at, quantity')
    .gte('created_at', monthAgo.toISOString());
  if (error) throw error;

  const txs = tx || [];
  const inToday = txs.filter((t) => new Date(t.created_at) >= todayStart && t.type === 'in');
  const outToday = txs.filter((t) => new Date(t.created_at) >= todayStart && t.type === 'out');
  const inWeek = txs.filter((t) => new Date(t.created_at) >= weekAgo && t.type === 'in');
  const outWeek = txs.filter((t) => new Date(t.created_at) >= weekAgo && t.type === 'out');
  const inMonth = txs.filter((t) => t.type === 'in');
  const outMonth = txs.filter((t) => t.type === 'out');

  return {
    outToday: outToday.reduce((s, t) => s + (t.quantity ?? 1), 0),
    inToday: inToday.reduce((s, t) => s + (t.quantity ?? 1), 0),
    outThisWeek: outWeek.reduce((s, t) => s + (t.quantity ?? 1), 0),
    inThisWeek: inWeek.reduce((s, t) => s + (t.quantity ?? 1), 0),
    outThisMonth: outMonth.reduce((s, t) => s + (t.quantity ?? 1), 0),
    inThisMonth: inMonth.reduce((s, t) => s + (t.quantity ?? 1), 0),
  };
}

/** Fetch recent activity (transactions) with pagination - for dashboard. Load on demand. */
export async function getRecentActivity(limit = 30, offset = 0) {
  const { data: tx, error } = await supabase
    .from('item_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;

  const { count } = await supabase
    .from('item_transactions')
    .select('*', { count: 'exact', head: true });
  const total = count ?? 0;

  const itemIds = [...new Set((tx || []).map((t) => t.item_id).filter(Boolean))];
  const performerIds = [...new Set((tx || []).map((t) => t.performed_by).filter(Boolean))];

  const [itemMap, performerMap] = await Promise.all([
    itemIds.length > 0
      ? supabase.from('items').select('id, name, category, qr_id').in('id', itemIds).then(({ data, error }) => {
          if (error) return {};
          return Object.fromEntries((data || []).map((i) => [i.id, i]));
        })
      : Promise.resolve({}),
    performerIds.length > 0 ? getProfilesByIds(performerIds) : Promise.resolve({}),
  ]);

  const data = (tx || []).map((t) => ({
    ...t,
    item: itemMap[t.item_id] || null,
    performedByDisplay: t.performed_by ? (performerMap[t.performed_by] || null) : null,
  }));
  return { data, total };
}

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
