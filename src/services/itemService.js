import { sanityClient } from "../lib/sanity";
import { getStoredSession } from "../lib/authStorage";
import {
	mapItem,
	mapTransaction,
	mapDeletionLog,
	itemToSanity,
	transactionToSanity,
	deletionLogToSanity,
} from "../lib/sanityMappers";
import { getModelOrderAlerts } from "../lib/stockTree";
import { formatVehicleFitments } from "../lib/vehicleFitments";
import { ensureVehicleCatalogEntries } from "./vehicleCatalogService";
import { MAX_ITEM_ACTIONS } from "../lib/itemActionLimits";
import { triggerGoogleSheetSync } from "./googleSheetSyncService";

function currentUserId() {
	return getStoredSession()?.userId ?? null;
}

function notifySheetSync() {
	triggerGoogleSheetSync();
}

/** Delete oldest actions when a part exceeds MAX_ITEM_ACTIONS rows. */
async function pruneItemActions(itemId) {
	if (!itemId) return;
	const count = await sanityClient.fetch(
		`count(*[_type == "inventoryTransaction" && item._ref == $itemId])`,
		{ itemId }
	);
	if (count <= MAX_ITEM_ACTIONS) return;

	const removeCount = count - MAX_ITEM_ACTIONS;
	const staleIds = await sanityClient.fetch(
		`*[_type == "inventoryTransaction" && item._ref == $itemId]
			| order(coalesce(createdAt, _createdAt) asc)[0...${removeCount}]._id`,
		{ itemId }
	);
	if (!staleIds?.length) return;
	await Promise.all(staleIds.map((id) => sanityClient.delete(id)));
}


export async function createItem(item) {
	const payload = {
		...item,
		added_by: item.added_by ?? currentUserId(),
	};
	if (item.vehicle_fitments?.length) {
		await ensureVehicleCatalogEntries(item.vehicle_fitments);
	}
	const doc = await sanityClient.create(itemToSanity(payload));
	notifySheetSync();
	return mapItem(doc);
}

export async function getStockAlerts() {
	const docs = await sanityClient.fetch(`*[_type == "inventoryItem"] | order(name asc)`);
	const items = (docs || []).map(mapItem).filter(Boolean);
	return getModelOrderAlerts(items);
}

/** @deprecated Use getStockAlerts — kept for compatibility */
export async function getLowStockItems() {
	return getStockAlerts();
}

export async function searchItemNames(query) {
	const q = String(query || "").trim();
	if (!q || q.length < 2) return [];
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryItem" && name match $pattern][0...20].name`,
		{ pattern: `*${q}*` }
	);
	const seen = new Set();
	return (docs || [])
		.map((name) => (name || "").trim())
		.filter((name) => name && !seen.has(name) && seen.add(name));
}

export async function getItemById(id) {
	if (!id || typeof id !== "string") return null;
	const doc = await sanityClient.fetch(
		`*[_type == "inventoryItem" && _id == $id][0]`,
		{ id }
	);
	return mapItem(doc);
}

export async function getItemByQrId(qrId) {
	const doc = await sanityClient.fetch(
		`*[_type == "inventoryItem" && qrId == $qrId][0]`,
		{ qrId }
	);
	return mapItem(doc);
}

const AGL_INV_PREFIX = "AGL-INV-";
const AGL_INV_REGEX = /^AGL-INV-(\d+)$/;

export async function getNextItemCode() {
	const qrIds = await sanityClient.fetch(
		`*[_type == "inventoryItem" && qrId match "AGL-INV-*"].qrId`
	);
	let maxNum = 0;
	(qrIds || []).forEach((qrId) => {
		const m = (qrId || "").match(AGL_INV_REGEX);
		if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
	});
	return `${AGL_INV_PREFIX}${maxNum + 1}`;
}

export async function checkQrIdExists(qrId) {
	const normalized = String(qrId || "").trim();
	if (!normalized) return false;
	const count = await sanityClient.fetch(
		`count(*[_type == "inventoryItem" && qrId == $qrId])`,
		{ qrId: normalized }
	);
	return count > 0;
}

export async function checkBarcodeBaseExists(base) {
	const normalized = String(base || "").trim();
	if (!normalized) return false;

	const exact = await sanityClient.fetch(
		`count(*[_type == "inventoryItem" && qrId == $base])`,
		{ base: normalized }
	);
	if (exact > 0) return true;

	const prefix = await sanityClient.fetch(
		`count(*[_type == "inventoryItem" && qrId match $pattern])`,
		{ pattern: `${normalized}_*` }
	);
	if (prefix > 0) return true;

	const alt = await sanityClient.fetch(
		`count(*[_type == "itemBarcode" && barcode == $base])`,
		{ base: normalized }
	);
	return alt > 0;
}

export async function getItemBarcodes(itemId) {
	if (!itemId) return [];
	const docs = await sanityClient.fetch(
		`*[_type == "itemBarcode" && item._ref == $itemId] | order(_createdAt asc).barcode`,
		{ itemId }
	);
	return (docs || []).filter(Boolean);
}

export async function syncItemBarcodes(itemId, barcodes) {
	if (!itemId) return;
	const existing = await sanityClient.fetch(
		`*[_type == "itemBarcode" && item._ref == $itemId]._id`,
		{ itemId }
	);
	await Promise.all((existing || []).map((id) => sanityClient.delete(id)));

	const normalized = (barcodes || []).filter((b) => String(b || "").trim());
	if (normalized.length === 0) return;

	await Promise.all(
		normalized.map((barcode) =>
			sanityClient.create({
				_type: "itemBarcode",
				item: { _type: "reference", _ref: itemId },
				barcode: String(barcode).trim(),
			})
		)
	);
}

export async function createItemBarcodes(itemId, barcodes) {
	const normalized = (barcodes || []).filter((b) => String(b || "").trim());
	if (normalized.length === 0) return;
	await Promise.all(
		normalized.map((barcode) =>
			sanityClient.create({
				_type: "itemBarcode",
				item: { _type: "reference", _ref: itemId },
				barcode: String(barcode).trim(),
			})
		)
	);
}

export async function getItemByQrIdOrBase(barcode) {
	const trimmed = String(barcode || "").trim();
	if (!trimmed) return null;

	const exact = await getItemByQrId(trimmed);
	if (exact) return exact;

	const prefixDoc = await sanityClient.fetch(
		`*[_type == "inventoryItem" && qrId match $pattern][0]`,
		{ pattern: `${trimmed}_*` }
	);
	if (prefixDoc) return mapItem(prefixDoc);

	const alt = await sanityClient.fetch(
		`*[_type == "itemBarcode" && barcode == $barcode][0]{ "itemId": item._ref }`,
		{ barcode: trimmed }
	);
	if (alt?.itemId) return getItemById(alt.itemId);
	return null;
}

export async function updateItem(id, updates) {
	const session = getStoredSession();
	if (updates.vehicle_fitments?.length) {
		await ensureVehicleCatalogEntries(updates.vehicle_fitments);
	}
	const patch = sanityClient.patch(id);
	const sanityUpdates = itemToSanity(updates);
	delete sanityUpdates._type;

	// Track who last changed stock-related fields
	const touchesActivity =
		"status" in updates || "quantity" in updates || "last_used_date" in updates;
	if (touchesActivity && !("last_used_by" in updates) && session?.userId) {
		sanityUpdates.lastUsedBy = { _type: "reference", _ref: session.userId };
	}

	Object.entries(sanityUpdates).forEach(([key, val]) => {
		if (val !== undefined) patch.set({ [key]: val });
	});
	const doc = await patch.commit();
	notifySheetSync();
	return mapItem(doc);
}

/** Permanently remove a spare part and every Sanity document tied to it. */
export async function deleteItem(id, deletedBy) {
	if (!id) return;

	const related = await sanityClient.fetch(
		`{
			"item": *[_type == "inventoryItem" && _id == $id][0]{
				...,
				"photoAssetId": photo.asset._ref
			},
			"transactionIds": *[_type == "inventoryTransaction" && item._ref == $id]._id,
			"barcodeIds": *[_type == "itemBarcode" && item._ref == $id]._id
		}`,
		{ id }
	);

	const rawItem = related?.item;
	if (!rawItem) return;

	const item = mapItem(rawItem);
	const barcodes = await getItemBarcodes(id);
	const deletedAt = new Date().toISOString();

	// Single ordered transaction: drop references before the item itself.
	const mutation = sanityClient.transaction();
	for (const txId of related.transactionIds || []) {
		mutation.delete(txId);
	}
	for (const barcodeId of related.barcodeIds || []) {
		mutation.delete(barcodeId);
	}
	mutation.delete(id);
	if (rawItem.photoAssetId) {
		mutation.delete(rawItem.photoAssetId);
	}
	mutation.create(
		deletionLogToSanity({
			item_id: id,
			qr_id: item.qr_id,
			name: item.name,
			category: item.category,
			vehicle_model: formatVehicleFitments(item),
			agl_number: item.agl_number,
			quantity: item.quantity,
			status: item.status,
			barcodes,
			deleted_by: deletedBy ?? currentUserId(),
			deleted_at: deletedAt,
		})
	);

	await mutation.commit();
	notifySheetSync();
}

export async function getDeletionLogs({ limit = 100 } = {}) {
	const docs = await sanityClient.fetch(
		`*[_type == "itemDeletionLog"] | order(coalesce(deletedAt, _createdAt) desc)[0...$limit] {
			...,
			"deleterName": coalesce(deletedBy->fullName, deletedBy->email)
		}`,
		{ limit }
	);
	return (docs || []).map(mapDeletionLog);
}

export async function getTransactions(itemId) {
	const count = await sanityClient.fetch(
		`count(*[_type == "inventoryTransaction" && item._ref == $itemId])`,
		{ itemId }
	);
	if (count > MAX_ITEM_ACTIONS) await pruneItemActions(itemId);

	const docs = await sanityClient.fetch(
		`*[_type == "inventoryTransaction" && item._ref == $itemId]
			| order(coalesce(createdAt, _createdAt) desc)[0...${MAX_ITEM_ACTIONS}] {
			...,
			"performerName": coalesce(performedBy->fullName, performedBy->email)
		}`,
		{ itemId }
	);
	return (docs || []).map((doc) => ({
		...mapTransaction(doc),
		performer_name: doc.performerName?.trim() || null,
	}));
}

export async function createTransaction(transaction) {
	const performedBy = transaction.performed_by ?? currentUserId();
	const doc = await sanityClient.create(
		transactionToSanity({ ...transaction, performed_by: performedBy })
	);
	const itemId = transaction.item_id;
	if (itemId) await pruneItemActions(itemId);
	notifySheetSync();
	return mapTransaction(doc);
}

/** Record a spare-part action on the item's history timeline. */
export async function logItemAction(itemId, action, userId) {
	if (!itemId || !action?.type) return null;
	const performedBy = userId ?? currentUserId();
	return createTransaction({
		item_id: itemId,
		type: action.type,
		quantity: action.quantity ?? 1,
		notes: action.notes ?? null,
		recipient_name: action.recipient_name ?? null,
		purpose: action.purpose ?? null,
		responsible_person: action.responsible_person ?? null,
		vehicle_model: action.vehicle_model ?? null,
		performed_by: performedBy,
		created_at: action.created_at || new Date().toISOString(),
	});
}

export async function getAllItems() {
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryItem"] | order(_createdAt desc)`
	);
	return (docs || []).map(mapItem);
}
