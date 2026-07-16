import { sanityClient } from "../lib/sanity";
import { mapTransaction, mapItem } from "../lib/sanityMappers";
import { getProfilesByIds } from "./userService";

export async function getDashboardActivityStats() {
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const weekAgo = new Date(now);
	weekAgo.setDate(now.getDate() - 7);
	const monthAgo = new Date(now);
	monthAgo.setDate(now.getDate() - 30);

	const docs = await sanityClient.fetch(
		`*[_type == "inventoryTransaction" && coalesce(createdAt, _createdAt) >= $monthAgo]{
			type, createdAt, _createdAt, quantity
		}`,
		{ monthAgo: monthAgo.toISOString() }
	);

	const txs = (docs || []).map((d) => ({
		type: d.type,
		created_at: d.createdAt || d._createdAt,
		quantity: d.quantity ?? 1,
	}));

	const sumQty = (arr) => arr.reduce((s, t) => s + (t.quantity ?? 1), 0);

	const inToday = txs.filter(
		(t) => new Date(t.created_at) >= todayStart && t.type === "in"
	);
	const outToday = txs.filter(
		(t) => new Date(t.created_at) >= todayStart && t.type === "out"
	);
	const inWeek = txs.filter(
		(t) => new Date(t.created_at) >= weekAgo && t.type === "in"
	);
	const outWeek = txs.filter(
		(t) => new Date(t.created_at) >= weekAgo && t.type === "out"
	);
	const inMonth = txs.filter((t) => t.type === "in");
	const outMonth = txs.filter((t) => t.type === "out");

	return {
		outToday: sumQty(outToday),
		inToday: sumQty(inToday),
		outThisWeek: sumQty(outWeek),
		inThisWeek: sumQty(inWeek),
		outThisMonth: sumQty(outMonth),
		inThisMonth: sumQty(inMonth),
	};
}

export async function getRecentActivity(limit = 30, offset = 0) {
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryTransaction"] | order(coalesce(createdAt, _createdAt) desc)[$offset...$end]{
			...,
			"itemRef": item._ref
		}`,
		{ offset, end: offset + limit - 1 }
	);

	const total = await sanityClient.fetch(
		`count(*[_type == "inventoryTransaction"])`
	);

	const txs = (docs || []).map(mapTransaction);
	const itemIds = [...new Set(txs.map((t) => t.item_id).filter(Boolean))];
	const performerIds = [...new Set(txs.map((t) => t.performed_by).filter(Boolean))];

	const [itemDocs, performerMap] = await Promise.all([
		itemIds.length > 0
			? sanityClient.fetch(
					`*[_type == "inventoryItem" && _id in $ids]{ _id, name, category, qrId }`,
					{ ids: itemIds }
				)
			: Promise.resolve([]),
		performerIds.length > 0 ? getProfilesByIds(performerIds) : Promise.resolve({}),
	]);

	const itemMap = Object.fromEntries(
		(itemDocs || []).map((i) => [
			i._id,
			{ id: i._id, name: i.name, category: i.category, qr_id: i.qrId },
		])
	);

	const data = txs.map((t) => ({
		...t,
		item: itemMap[t.item_id] || null,
		performedByDisplay: t.performed_by
			? performerMap[t.performed_by] || null
			: null,
	}));

	return { data, total: total ?? 0 };
}

export async function getTransactionsWithItems() {
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryTransaction"] | order(coalesce(createdAt, _createdAt) desc)`
	);
	const txs = (docs || []).map(mapTransaction);
	const itemIds = [...new Set(txs.map((t) => t.item_id).filter(Boolean))];
	if (itemIds.length === 0) return txs.map((t) => ({ ...t, item: null }));

	const itemDocs = await sanityClient.fetch(
		`*[_type == "inventoryItem" && _id in $ids]{ _id, name, category, qrId }`,
		{ ids: itemIds }
	);
	const itemMap = Object.fromEntries(
		(itemDocs || []).map((i) => [i._id, mapItem(i)])
	);
	return txs.map((t) => ({ ...t, item: itemMap[t.item_id] || null }));
}

/** Check-in/out transactions for today (local calendar day) with item details. */
export async function getTodayStockMovements() {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const docs = await sanityClient.fetch(
		`*[_type == "inventoryTransaction" && (type == "in" || type == "out") && coalesce(createdAt, _createdAt) >= $todayStart]
			| order(coalesce(createdAt, _createdAt) asc)`,
		{ todayStart: todayStart.toISOString() }
	);

	const txs = (docs || []).map(mapTransaction);
	const itemIds = [...new Set(txs.map((t) => t.item_id).filter(Boolean))];
	if (itemIds.length === 0) {
		return { checkIns: [], checkOuts: [], dateLabel: todayStart.toLocaleDateString() };
	}

	const itemDocs = await sanityClient.fetch(
		`*[_type == "inventoryItem" && _id in $ids]{ _id, name, category, qrId }`,
		{ ids: itemIds }
	);
	const itemMap = Object.fromEntries(
		(itemDocs || []).map((i) => [
			i._id,
			{ id: i._id, name: i.name, category: i.category, qr_id: i.qrId },
		])
	);

	const enriched = txs.map((t) => ({ ...t, item: itemMap[t.item_id] || null }));
	return {
		checkIns: enriched.filter((t) => t.type === "in"),
		checkOuts: enriched.filter((t) => t.type === "out"),
		dateLabel: todayStart.toLocaleDateString(undefined, { dateStyle: "full" }),
	};
}
