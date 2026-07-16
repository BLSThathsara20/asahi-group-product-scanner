import { normalizeVehicleFitments, NOT_SPECIFIED_MODEL } from "./vehicleFitments";
import { isLowStock, isModelStockLow, LOW_STOCK_THRESHOLD } from "./stockAlerts";

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

function buildModelStockForMake(parts, modelNames) {
	return modelNames.map((model) => {
		const partsForModel = parts.filter((part) =>
			part.compatibleModels.includes(model)
		);
		const totalQuantity = partsForModel.reduce((sum, part) => sum + part.quantity, 0);
		return {
			model,
			totalQuantity,
			partCount: partsForModel.length,
			needsOrder: isModelStockLow(totalQuantity),
			parts: partsForModel,
		};
	});
}

function annotatePartAttention(parts, modelStock) {
	const needsOrderModels = new Set(
		modelStock.filter((row) => row.needsOrder).map((row) => row.model)
	);
	return parts.map((part) => ({
		...part,
		needsOrder: part.compatibleModels.some((model) => needsOrderModels.has(model)),
	}));
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
				makeNode.parts.set(item.id, itemSnapshot(item, models));
			} else {
				const existing = makeNode.parts.get(item.id);
				const merged = new Set([...existing.compatibleModels, ...models]);
				existing.compatibleModels = [...merged].sort((a, b) => a.localeCompare(b));
			}
		}
	}

	const makes = [...makeMap.values()]
		.map((makeNode) => {
			const rawParts = [...makeNode.parts.values()].sort((a, b) =>
				a.name.localeCompare(b.name)
			);
			const models = [...makeNode.modelSet].sort((a, b) => a.localeCompare(b));
			const modelStock = buildModelStockForMake(rawParts, models);
			const parts = annotatePartAttention(rawParts, modelStock);
			const modelsNeedingOrder = modelStock.filter((row) => row.needsOrder);
			const totalQuantity = parts.reduce((sum, part) => sum + part.quantity, 0);

			return {
				make: makeNode.make,
				partCount: parts.length,
				modelCount: models.length,
				models,
				modelStock,
				modelsNeedingOrder,
				totalQuantity,
				lowStockCount: modelsNeedingOrder.length,
				parts,
				isLowStock: modelsNeedingOrder.length > 0,
			};
		})
		.sort((a, b) => a.make.localeCompare(b.make));

	const modelOrderAlerts = getModelOrderAlertsFromTree({
		makes,
		unassigned: {
			...unassigned,
			items: unassigned.items.sort((a, b) => a.name.localeCompare(b.name)),
			partCount: unassigned.items.length,
			lowStockCount: unassigned.lowStockItems.length,
		},
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
			lowStockCount: modelOrderAlerts.length,
			threshold: LOW_STOCK_THRESHOLD,
		},
		modelOrderAlerts,
	};
}

function getModelOrderAlertsFromTree(tree) {
	const alerts = [];

	for (const make of tree.makes) {
		for (const row of make.modelsNeedingOrder || []) {
			alerts.push({
				type: "model",
				make: make.make,
				model: row.model,
				totalQuantity: row.totalQuantity,
				partCount: row.partCount,
				parts: row.parts.map((part) => ({
					id: part.id,
					name: part.name,
					quantity: part.quantity,
				})),
			});
		}
	}

	for (const part of tree.unassigned?.items || []) {
		if (!isLowStock(part.quantity)) continue;
		alerts.push({
			type: "unassigned",
			make: null,
			model: null,
			totalQuantity: part.quantity,
			partCount: 1,
			parts: [{ id: part.id, name: part.name, quantity: part.quantity }],
		});
	}

	return alerts.sort((a, b) => {
		const makeA = a.make || "ZZZ";
		const makeB = b.make || "ZZZ";
		if (makeA !== makeB) return makeA.localeCompare(makeB);
		return (a.model || a.parts[0]?.name || "").localeCompare(
			b.model || b.parts[0]?.name || ""
		);
	});
}

/** Alerts when a make+model has less than 2 units total across all compatible parts. */
export function getModelOrderAlerts(items) {
	return buildStockTree(items).modelOrderAlerts;
}

/** Which items to highlight in reports (same logic as bell alerts). */
export function getOrderAlertDetails(tree) {
	const itemIds = new Set();
	const modelsByItemId = new Map();

	for (const make of tree.makes) {
		const needsOrderModels = new Set(
			make.modelStock.filter((row) => row.needsOrder).map((row) => row.model)
		);
		for (const part of make.parts) {
			const alertModels = part.compatibleModels.filter((model) =>
				needsOrderModels.has(model)
			);
			if (!alertModels.length) continue;
			itemIds.add(part.id);
			modelsByItemId.set(part.id, {
				make: make.make,
				models: alertModels,
			});
		}
	}

	for (const part of tree.unassigned.items) {
		if (!isLowStock(part.quantity)) continue;
		itemIds.add(part.id);
		modelsByItemId.set(part.id, { make: null, models: [] });
	}

	return { itemIds, modelsByItemId };
}

export function groupOrderAlertsByMake(alerts) {
	const groups = new Map();

	for (const alert of alerts) {
		if (alert.type === "unassigned") {
			const key = "__unassigned__";
			if (!groups.has(key)) {
				groups.set(key, { make: "Unassigned", models: [], parts: [], alerts: [] });
			}
			const group = groups.get(key);
			group.alerts.push(alert);
			group.parts.push(...alert.parts);
			continue;
		}

		if (!groups.has(alert.make)) {
			groups.set(alert.make, { make: alert.make, models: [], parts: [], alerts: [] });
		}
		const group = groups.get(alert.make);
		group.models.push({
			model: alert.model,
			totalQuantity: alert.totalQuantity,
			partCount: alert.partCount,
		});
		group.alerts.push(alert);
		for (const part of alert.parts) {
			if (!group.parts.some((row) => row.id === part.id)) {
				group.parts.push(part);
			}
		}
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			models: group.models.sort((a, b) => a.model.localeCompare(b.model)),
		}))
		.sort((a, b) => {
			if (a.make === "Unassigned") return 1;
			if (b.make === "Unassigned") return -1;
			return a.make.localeCompare(b.make);
		});
}

/** Rows for PDF export — make header + one row per part. */
export function flattenStockTreeRows(tree) {
	const rows = [];

	for (const make of tree.makes) {
		const orderModels = make.modelsNeedingOrder?.map((row) => row.model).join(", ");
		rows.push({
			type: "make",
			label: make.make,
			units: make.totalQuantity,
			fits: orderModels
				? `Order: ${orderModels}`
				: `${make.modelCount} model${make.modelCount === 1 ? "" : "s"} OK`,
			low: make.lowStockCount > 0 ? String(make.lowStockCount) : "—",
			isLowStock: make.isLowStock,
		});
		for (const part of make.parts) {
			rows.push({
				type: "part",
				label: `    ${part.name}`,
				units: part.quantity,
				fits: part.compatibleModels.join(", ") || "—",
				low: part.needsOrder ? "Order" : "—",
				isLowStock: part.needsOrder,
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
				low: part.lowStock ? "Order" : "—",
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

export function flattenModelOrderAlertRows(alerts) {
	return alerts.map((alert) => {
		if (alert.type === "unassigned") {
			return {
				vehicle: alert.parts[0]?.name || "Unassigned part",
				total: String(alert.totalQuantity),
				parts: "1 part",
				action: "Order more",
				_lowStock: true,
			};
		}
		return {
			vehicle: `${alert.make} ${alert.model}`,
			total: String(alert.totalQuantity),
			parts: `${alert.partCount} part${alert.partCount === 1 ? "" : "s"}`,
			action: "Order more",
			_lowStock: true,
		};
	});
}
