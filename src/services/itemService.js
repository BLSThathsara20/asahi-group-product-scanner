import { supabase } from "../lib/supabase";

export async function createItem(item) {
	const { data, error } = await supabase
		.from("items")
		.insert([item])
		.select()
		.single();
	if (error) throw error;
	return data;
}

/** Get items with low stock (quantity <= reminder_count) for notifications */
export async function getLowStockItems() {
	const { data, error } = await supabase
		.from("items")
		.select("id, name, quantity, reminder_count, category")
		.lte("quantity", 100); // optimization: only items that could be low stock
	if (error) throw error;
	const threshold = (r) => (r.reminder_count != null ? r.reminder_count : 1);
	return (data || []).filter((r) => (r.quantity ?? 0) <= threshold(r));
}

/** Search item names for autocomplete (returns unique names matching query) */
export async function searchItemNames(query) {
	const q = String(query || "").trim();
	if (!q || q.length < 2) return [];
	const { data, error } = await supabase
		.from("items")
		.select("name")
		.ilike("name", `%${q}%`)
		.limit(20);
	if (error) throw error;
	const seen = new Set();
	return (data || [])
		.map((r) => (r.name || "").trim())
		.filter((name) => name && !seen.has(name) && seen.add(name));
}

export async function getItemById(id) {
	if (!id || typeof id !== "string") return null;
	const { data, error } = await supabase
		.from("items")
		.select("*")
		.eq("id", id)
		.maybeSingle();
	if (error) throw error;
	return data;
}

export async function getItemByQrId(qrId) {
	const { data, error } = await supabase
		.from("items")
		.select("*")
		.eq("qr_id", qrId)
		.single();
	if (error) throw error;
	return data;
}

const AGL_INV_PREFIX = "AGL-INV-";
const AGL_INV_REGEX = /^AGL-INV-(\d+)$/;

/** Get next sequential product code: AGL-INV-1, AGL-INV-2, ... */
export async function getNextItemCode() {
	const { data, error } = await supabase
		.from("items")
		.select("qr_id")
		.ilike("qr_id", `${AGL_INV_PREFIX}%`);
	if (error) throw error;
	let maxNum = 0;
	(data || []).forEach((row) => {
		const m = (row.qr_id || "").match(AGL_INV_REGEX);
		if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
	});
	return `${AGL_INV_PREFIX}${maxNum + 1}`;
}

/** Check if QR/barcode already exists (for duplicate prevention) */
export async function checkQrIdExists(qrId) {
	const normalized = String(qrId || "").trim();
	if (!normalized) return false;
	const { data, error } = await supabase
		.from("items")
		.select("id")
		.eq("qr_id", normalized)
		.maybeSingle();
	if (error) throw error;
	return !!data;
}

/** Check if barcode base is already used (exact match or as prefix of base_uniqueId, or in item_barcodes) */
export async function checkBarcodeBaseExists(base) {
	const normalized = String(base || "").trim();
	if (!normalized) return false;
	const { data: exact } = await supabase
		.from("items")
		.select("id")
		.eq("qr_id", normalized)
		.maybeSingle();
	if (exact) return true;
	const escaped = normalized.replace(/\\/g, "\\\\").replace(/_/g, "\\_").replace(/%/g, "\\%");
	const { data: prefix } = await supabase
		.from("items")
		.select("id")
		.ilike("qr_id", escaped + "\\_%")
		.limit(1);
	if (prefix && prefix.length > 0) return true;
	const { data: alt } = await supabase
		.from("item_barcodes")
		.select("id")
		.eq("barcode", normalized)
		.maybeSingle();
	return !!alt;
}

/** Get alt barcodes for an item (qr_id is primary, these are extras) */
export async function getItemBarcodes(itemId) {
	if (!itemId) return [];
	const { data, error } = await supabase
		.from("item_barcodes")
		.select("barcode")
		.eq("item_id", itemId)
		.order("created_at", { ascending: true });
	if (error) throw error;
	return (data || []).map((r) => r.barcode || "").filter(Boolean);
}

/** Replace all alt barcodes for an item (deletes existing, inserts new) */
export async function syncItemBarcodes(itemId, barcodes) {
	if (!itemId) return;
	const { error: delErr } = await supabase.from("item_barcodes").delete().eq("item_id", itemId);
	if (delErr) throw delErr;
	const normalized = (barcodes || []).filter((b) => String(b || "").trim());
	if (normalized.length === 0) return;
	const rows = normalized.map((barcode) => ({ item_id: itemId, barcode: String(barcode).trim() }));
	const { error: insErr } = await supabase.from("item_barcodes").insert(rows);
	if (insErr) throw insErr;
}

/** Insert additional barcodes for an item (qr_id is primary) */
export async function createItemBarcodes(itemId, barcodes) {
	const normalized = (barcodes || []).filter((b) => String(b || "").trim());
	if (normalized.length === 0) return;
	const rows = normalized.map((barcode) => ({ item_id: itemId, barcode: String(barcode).trim() }));
	const { error } = await supabase.from("item_barcodes").insert(rows);
	if (error) throw error;
}

/** Get item by qr_id or by barcode base (for product barcodes stored as base_uniqueId) or item_barcodes */
export async function getItemByQrIdOrBase(barcode) {
	const trimmed = String(barcode || "").trim();
	if (!trimmed) return null;
	const { data: exact } = await supabase
		.from("items")
		.select("*")
		.eq("qr_id", trimmed)
		.maybeSingle();
	if (exact) return exact;
	const escaped = trimmed.replace(/\\/g, "\\\\").replace(/_/g, "\\_").replace(/%/g, "\\%");
	const { data: prefix } = await supabase
		.from("items")
		.select("*")
		.ilike("qr_id", escaped + "\\_%")
		.limit(1);
	if (prefix?.[0]) return prefix[0];
	const { data: alt } = await supabase
		.from("item_barcodes")
		.select("item_id")
		.eq("barcode", trimmed)
		.maybeSingle();
	if (alt) {
		const { data: item } = await supabase.from("items").select("*").eq("id", alt.item_id).single();
		return item;
	}
	return null;
}

export async function updateItem(id, updates) {
	const { data, error } = await supabase
		.from("items")
		.update({ ...updates, updated_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

/**
 * Extract storage path from Supabase public URL.
 * URL format: .../storage/v1/object/public/item-photos/items/xxx.jpg
 */
function getStoragePathFromUrl(photoUrl) {
	if (!photoUrl || typeof photoUrl !== "string") return null;
	const match = photoUrl.match(/\/item-photos\/(.+)$/);
	return match ? match[1] : null;
}

/**
 * Delete item, its photo from storage, and related transactions (cascade).
 * Caller must ensure user is super_admin.
 */
export async function deleteItem(id) {
	const { data: item, error: fetchError } = await supabase
		.from("items")
		.select("id, photo_url")
		.eq("id", id)
		.maybeSingle();
	if (fetchError) throw fetchError;
	if (!item) throw new Error("Item not found");

	const path = getStoragePathFromUrl(item.photo_url);
	if (path) {
		await supabase.storage.from("item-photos").remove([path]);
	}

	const { error } = await supabase.from("items").delete().eq("id", id);
	if (error) throw error;
}

export async function getTransactions(itemId) {
	const { data, error } = await supabase
		.from("item_transactions")
		.select("*")
		.eq("item_id", itemId)
		.order("created_at", { ascending: false });
	if (error) throw error;
	return data || [];
}

export async function createTransaction(transaction) {
	const { data, error } = await supabase
		.from("item_transactions")
		.insert([transaction])
		.select()
		.single();
	if (error) throw error;
	return data;
}
