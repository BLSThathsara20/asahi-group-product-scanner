/** Vehicle make + model fitment helpers. Models are compatibility tags; stock is shared on the item. */

export const NOT_SPECIFIED_MODEL = "Not specified";

function cleanMake(value) {
	return String(value || "").trim();
}

function cleanModelName(value) {
	return String(value || "").trim();
}

function cleanQuantity(value) {
	const n = Number(value);
	if (!Number.isFinite(n) || n < 0) return 0;
	return Math.floor(n);
}

/** Normalize a model entry from legacy string or { name }. */
export function normalizeModelEntry(entry) {
	if (typeof entry === "string") {
		const name = cleanModelName(entry);
		return name ? { name } : null;
	}
	if (entry && typeof entry === "object") {
		const name = cleanModelName(entry.name ?? entry.model ?? entry.modelName);
		return name ? { name } : null;
	}
	return null;
}

function normalizeFitmentEntry(entry) {
	const make = cleanMake(entry?.make);
	if (!make) return null;

	const rawModels = entry?.models || [];
	const models = [...rawModels].map((model) => normalizeModelEntry(model)).filter(Boolean);

	const deduped = [];
	const seen = new Set();
	for (const model of models) {
		const key = model.name.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(model);
	}

	return { make, models: deduped };
}

/** Normalize fitments from Sanity doc or app item. */
export function normalizeVehicleFitments(source) {
	if (!source) return [];

	let raw = [];
	if (Array.isArray(source.vehicle_fitments)) {
		raw = source.vehicle_fitments;
	} else if (Array.isArray(source.vehicleFitments)) {
		raw = source.vehicleFitments;
	} else if (Array.isArray(source.vehicle_models)) {
		raw = source.vehicle_models.map((make) => ({ make, models: [] }));
	} else if (Array.isArray(source.vehicleModels)) {
		raw = source.vehicleModels.map((make) => ({ make, models: [] }));
	} else {
		const legacyMake = source.vehicle_model || source.vehicleModel;
		if (legacyMake) raw = [{ make: legacyMake, models: [] }];
	}

	return raw.map((entry) => normalizeFitmentEntry(entry)).filter(Boolean);
}

/** Shared stock count for an item (all compatible models use the same pool). */
export function getSharedItemQuantity(source) {
	if (!source) return 0;
	return cleanQuantity(source.quantity ?? 0);
}

/** Apply defaults before save — make-only fitments get "Not specified". */
export function finalizeVehicleFitments(fitments) {
	return normalizeVehicleFitments({ vehicle_fitments: fitments }).map((entry) => {
		if (entry.models.length > 0) return entry;
		return {
			...entry,
			models: [{ name: NOT_SPECIFIED_MODEL }],
		};
	});
}

export function fitmentSelectionKey(make, modelName) {
	return `${cleanMake(make)}|${cleanModelName(modelName)}`;
}

export function parseFitmentSelectionKey(value) {
	const text = String(value || "").trim();
	if (!text) return { make: "", model: "" };
	const idx = text.indexOf("|");
	if (idx >= 0) {
		return {
			make: text.slice(0, idx),
			model: text.slice(idx + 1),
		};
	}
	return parseFitmentSelection(text);
}

export function modelDisplayName(model) {
	if (typeof model === "string") return model;
	return model?.name || "";
}

export function modelLabel(make, modelName) {
	return `${cleanMake(make)} ${cleanModelName(modelName)}`.trim();
}

export function parseFitmentSelection(value) {
	const text = String(value || "").trim();
	if (!text) return { make: "", model: "" };

	const parts = text.split(/\s+/);
	if (parts.length === 1) return { make: parts[0], model: NOT_SPECIFIED_MODEL };

	const model = parts.pop();
	const make = parts.join(" ");
	return { make: make || "", model: model || NOT_SPECIFIED_MODEL };
}

/** Checkout/check-in options — each compatible model shares item.quantity. */
export function listFitmentStockOptions(source) {
	const fitments = normalizeVehicleFitments(source);
	const sharedQty = getSharedItemQuantity(source);
	const options = [];

	for (const entry of fitments) {
		if (!entry.models.length) {
			options.push({
				key: fitmentSelectionKey(entry.make, NOT_SPECIFIED_MODEL),
				make: entry.make,
				model: NOT_SPECIFIED_MODEL,
				label: modelLabel(entry.make, NOT_SPECIFIED_MODEL),
				quantity: sharedQty,
			});
			continue;
		}
		for (const model of entry.models) {
			options.push({
				key: fitmentSelectionKey(entry.make, model.name),
				make: entry.make,
				model: model.name,
				label: modelLabel(entry.make, model.name),
				quantity: sharedQty,
			});
		}
	}

	return options;
}

export function formatVehicleFitments(source) {
	const fitments = normalizeVehicleFitments(source);
	if (!fitments.length) return "";

	return fitments
		.map((entry) => {
			if (!entry.models.length) return entry.make;
			const models = entry.models.map((model) => model.name).join(", ");
			return `${entry.make}: ${models}`;
		})
		.join(" · ");
}

export function flattenVehicleFitmentLabels(source) {
	return listFitmentStockOptions(source).map((option) => option.label);
}

export function itemMatchesVehicleFitmentSearch(item, query) {
	const q = String(query || "").toLowerCase();
	if (!q) return true;

	return normalizeVehicleFitments(item).some((entry) => {
		if (entry.make.toLowerCase().includes(q)) return true;
		return entry.models.some((model) => model.name.toLowerCase().includes(q));
	});
}

function fitmentsKey(source) {
	return normalizeVehicleFitments(source)
		.map((entry) =>
			`${entry.make.toLowerCase()}=${entry.models
				.map((m) => m.name.toLowerCase())
				.sort()
				.join(",")}`
		)
		.sort()
		.join("|");
}

export function vehicleFitmentsChanged(before, next) {
	const beforeSource = Array.isArray(before) ? { vehicle_fitments: before } : before;
	const nextSource = Array.isArray(next) ? { vehicle_fitments: next } : { vehicle_fitments: next };
	return fitmentsKey(beforeSource) !== fitmentsKey(nextSource);
}

export function hasRequiredVehicleFitments(fitments) {
	return normalizeVehicleFitments({ vehicle_fitments: fitments }).some((entry) => entry.make);
}

export function fitmentsToSanity(fitments) {
	return normalizeVehicleFitments({ vehicle_fitments: fitments }).map((entry) => ({
		_type: "object",
		make: entry.make,
		models: entry.models.map((model) => ({
			_type: "object",
			name: model.name,
		})),
	}));
}
