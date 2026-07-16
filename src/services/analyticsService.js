import { sanityClient } from "../lib/sanity";
import { mapTransaction, mapItem } from "../lib/sanityMappers";
import {
	isCheckInTransaction,
	isCheckOutTransaction,
	isStockMovementTransaction,
} from "../lib/transactionTypes";
import { getProfilesByIds } from "./userService";

/** Local calendar day bounds (midnight to midnight in the browser timezone). */
export function getLocalDayBounds(reference = new Date()) {
	const start = new Date(
		reference.getFullYear(),
		reference.getMonth(),
		reference.getDate()
	);
	const end = new Date(start);
	end.setDate(end.getDate() + 1);
	return { start, end };
}

export function isOnLocalDay(isoValue, bounds) {
	if (!isoValue) return false;
	const when = new Date(isoValue);
	if (Number.isNaN(when.getTime())) return false;
	return when >= bounds.start && when < bounds.end;
}

/** Prefer explicit createdAt; fall back to _createdAt when missing or invalid. */
export function resolveTransactionCreatedAt(doc) {
	const candidates = [doc?.createdAt, doc?._createdAt].filter(Boolean);
	for (const raw of candidates) {
		const parsed = new Date(raw);
		if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
	}
	return null;
}

async function fetchStockMovementTransactions() {
	const docs = await sanityClient.fetch(
		`*[_type == "inventoryTransaction"]{
			type, createdAt, _createdAt, quantity, item
		}`
	);

	return (docs || [])
		.map(mapTransaction)
		.filter((t) => t?.created_at && isStockMovementTransaction(t));
}

export async function getDashboardActivityStats() {
	const now = new Date();
	const todayBounds = getLocalDayBounds(now);
	const weekAgo = new Date(now);
	weekAgo.setDate(now.getDate() - 7);
	weekAgo.setHours(0, 0, 0, 0);
	const monthAgo = new Date(now);
	monthAgo.setDate(now.getDate() - 30);
	monthAgo.setHours(0, 0, 0, 0);

	const txs = await fetchStockMovementTransactions();

	const sumQty = (arr) => arr.reduce((s, t) => s + (t.quantity ?? 1), 0);

	const inToday = txs.filter(
		(t) => isOnLocalDay(t.created_at, todayBounds) && isCheckInTransaction(t)
	);
	const outToday = txs.filter(
		(t) => isOnLocalDay(t.created_at, todayBounds) && isCheckOutTransaction(t)
	);
	const inWeek = txs.filter(
		(t) => new Date(t.created_at) >= weekAgo && isCheckInTransaction(t)
	);
	const outWeek = txs.filter(
		(t) => new Date(t.created_at) >= weekAgo && isCheckOutTransaction(t)
	);
	const inMonth = txs.filter(
		(t) => new Date(t.created_at) >= monthAgo && isCheckInTransaction(t)
	);
	const outMonth = txs.filter(
		(t) => new Date(t.created_at) >= monthAgo && isCheckOutTransaction(t)
	);

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
	const todayBounds = getLocalDayBounds();
	const txs = (await fetchStockMovementTransactions())
		.filter((t) => isOnLocalDay(t.created_at, todayBounds))
		.sort(
			(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		);

	if (txs.length === 0) {
		return {
			checkIns: [],
			checkOuts: [],
			dateLabel: todayBounds.start.toLocaleDateString(undefined, { dateStyle: "full" }),
		};
	}

	const itemIds = [...new Set(txs.map((t) => t.item_id).filter(Boolean))];
	let itemMap = {};
	if (itemIds.length > 0) {
		const itemDocs = await sanityClient.fetch(
			`*[_type == "inventoryItem" && _id in $ids]{ _id, name, category, qrId }`,
			{ ids: itemIds }
		);
		itemMap = Object.fromEntries(
			(itemDocs || []).map((i) => [
				i._id,
				{ id: i._id, name: i.name, category: i.category, qr_id: i.qrId },
			])
		);
	}

	const enriched = txs.map((t) => ({ ...t, item: itemMap[t.item_id] || null }));
	return {
		checkIns: enriched.filter(isCheckInTransaction),
		checkOuts: enriched.filter(isCheckOutTransaction),
		dateLabel: todayBounds.start.toLocaleDateString(undefined, { dateStyle: "full" }),
	};
}
