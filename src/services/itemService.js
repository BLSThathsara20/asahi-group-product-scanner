import { sanityClient } from "../lib/sanity";
import {
	mapItem,
	mapTransaction,
	itemToSanity,
	transactionToSanity,
} from "../lib/sanityMappers";


export async function createItem(item) {
	const doc = await sanityClient.create(itemToSanity(item));
	return mapItem(doc);
}

export async function getLowStockItems() {
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryItem" && quantity <= coalesce(reminderCount, 1)]{
			_id, name, quantity, reminderCount, category
		}`
	);
	return (docs || []).map((d) => ({
		id: d._id,
		name: d.name,
		quantity: d.quantity ?? 0,
		reminder_count: d.reminderCount ?? 1,
		category: d.category,
	}));
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
	const patch = sanityClient.patch(id);
	const sanityUpdates = itemToSanity(updates);
	delete sanityUpdates._type;
	Object.entries(sanityUpdates).forEach(([key, val]) => {
		if (val !== undefined) patch.set({ [key]: val });
	});
	const doc = await patch.commit();
	return mapItem(doc);
}

export async function deleteItem(id) {
	const txIds = await sanityClient.fetch(
		`*[_type == "inventoryTransaction" && item._ref == $id]._id`,
		{ id }
	);
	const barcodeIds = await sanityClient.fetch(
		`*[_type == "itemBarcode" && item._ref == $id]._id`,
		{ id }
	);
	await Promise.all([
		...(txIds || []).map((tid) => sanityClient.delete(tid)),
		...(barcodeIds || []).map((bid) => sanityClient.delete(bid)),
		sanityClient.delete(id),
	]);
}

export async function getTransactions(itemId) {
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryTransaction" && item._ref == $itemId] | order(createdAt desc)`,
		{ itemId }
	);
	return (docs || []).map(mapTransaction);
}

export async function createTransaction(transaction) {
	const doc = await sanityClient.create(transactionToSanity(transaction));
	return mapTransaction(doc);
}

export async function getAllItems() {
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryItem"] | order(_createdAt desc)`
	);
	return (docs || []).map(mapItem);
}
