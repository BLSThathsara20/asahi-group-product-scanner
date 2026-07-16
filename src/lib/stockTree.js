import { normalizeVehicleFitments, NOT_SPECIFIED_MODEL } from "./vehicleFitments";
import { isLowStock, LOW_STOCK_THRESHOLD } from "./stockAlerts";

function itemSnapshot(item, compatibleModels) {
	return {
		id: item.id,
		name: item.name || "Unnamed",
		quantity: item.quantity ?? 0,
		category: item.category || null,
		qr_id: item.qr_id || null,
		lowStock: isLowStock(item.quantity),
		compatibleModels: [...compatibleModels].sort((a, b) => a.localeCompare(b)),
	};
}

/**
 * Make → parts tree. Each physical part appears once with its compatible models.
 * One CarPlay (qty 10) fitting A1, A4, Q5 is one row — not triple-counted.
 */
export function buildStockTree(items) {
	const makeMap = new Map();
	const unassigned = {
		items: [],
		totalQuantity: 0,
		lowStockItems: [],
	};

	for (const item of items || []) {
		const qty = Math.max(0, item.quantity ?? 0);
		const fitments = normalizeVehicleFitments(item);

		if (!fitments.length) {
			const snapshot = itemSnapshot(item, []);
			unassigned.items.push(snapshot);
			unassigned.totalQuantity += qty;
			if (snapshot.lowStock) unassigned.lowStockItems.push(snapshot);
			continue;
		}

		for (const entry of fitments) {
			let makeNode = makeMap.get(entry.make);
			if (!makeNode) {
				makeNode = {
					make: entry.make,
					parts: new Map(),
					modelSet: new Set(),
				};
				makeMap.set(entry.make, makeNode);
			}

			const models = entry.models.length
				? entry.models.map((model) => model.name)
				: [NOT_SPECIFIED_MODEL];

			models.forEach((name) => makeNode.modelSet.add(name));

			if (!makeNode.parts.has(item.id)) {
				makeNode.parts.set(
					item.id,
					itemSnapshot(item, models)
				);
			} else {
				const existing = makeNode.parts.get(item.id);
				const merged = new Set([...existing.compatibleModels, ...models]);
				existing.compatibleModels = [...merged].sort((a, b) => a.localeCompare(b));
			}
		}
	}

	const makes = [...makeMap.values()]
		.map((makeNode) => {
			const parts = [...makeNode.parts.values()].sort((a, b) =>
				a.name.localeCompare(b.name)
			);
			const lowStockParts = parts.filter((part) => part.lowStock);
			const totalQuantity = parts.reduce((sum, part) => sum + part.quantity, 0);
			const models = [...makeNode.modelSet].sort((a, b) => a.localeCompare(b));

			return {
				make: makeNode.make,
				partCount: parts.length,
				modelCount: models.length,
				models,
				totalQuantity,
				lowStockCount: lowStockParts.length,
				parts,
				lowStockParts,
				isLowStock: lowStockParts.length > 0,
			};
		})
		.sort((a, b) => a.make.localeCompare(b.make));

	const lowStockItemIds = new Set();
	(items || []).forEach((item) => {
		if (isLowStock(item.quantity)) lowStockItemIds.add(item.id);
	});

	return {
		makes,
		unassigned: {
			...unassigned,
			items: unassigned.items.sort((a, b) => a.name.localeCompare(b.name)),
			partCount: unassigned.items.length,
			lowStockCount: unassigned.lowStockItems.length,
		},
		summary: {
			makeCount: makes.length,
			modelCount: new Set(makes.flatMap((make) => make.models)).size,
			partCount: (items || []).length,
			lowStockCount: lowStockItemIds.size,
			threshold: LOW_STOCK_THRESHOLD,
		},
	};
}

/** Rows for PDF export — make header + one row per part. */
export function flattenStockTreeRows(tree) {
	const rows = [];

	for (const make of tree.makes) {
		rows.push({
			type: "make",
			label: make.make,
			units: make.totalQuantity,
			fits: `${make.modelCount} model${make.modelCount === 1 ? "" : "s"}`,
			low: make.lowStockCount > 0 ? String(make.lowStockCount) : "—",
			isLowStock: make.isLowStock,
		});
		for (const part of make.parts) {
			rows.push({
				type: "part",
				label: `    ${part.name}`,
				units: part.quantity,
				fits: part.compatibleModels.join(", ") || "—",
				low: part.lowStock ? "1" : "—",
				isLowStock: part.lowStock,
			});
		}
	}

	if (tree.unassigned.partCount > 0) {
		rows.push({
			type: "make",
			label: "Unassigned",
			units: tree.unassigned.totalQuantity,
			fits: "—",
			low: tree.unassigned.lowStockCount > 0 ? String(tree.unassigned.lowStockCount) : "—",
			isLowStock: tree.unassigned.lowStockCount > 0,
		});
		for (const part of tree.unassigned.items) {
			rows.push({
				type: "part",
				label: `    ${part.name}`,
				units: part.quantity,
				fits: "—",
				low: part.lowStock ? "1" : "—",
				isLowStock: part.lowStock,
			});
		}
	}

	return rows;
}

/** Parts compatible with a given model (for optional model filter). */
export function getPartsForModel(tree, makeName, modelName) {
	const make = tree.makes.find(
		(entry) => entry.make.toLowerCase() === String(makeName).toLowerCase()
	);
	if (!make) return [];
	return make.parts.filter((part) =>
		part.compatibleModels.some(
			(name) => name.toLowerCase() === String(modelName).toLowerCase()
		)
	);
}
