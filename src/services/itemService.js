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

/** Check if barcode base is already used (exact match or as prefix of base_uniqueId) */
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
	return !!(prefix && prefix.length > 0);
}

/** Get item by qr_id or by barcode base (for product barcodes stored as base_uniqueId) */
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
	return prefix?.[0] ?? null;
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
