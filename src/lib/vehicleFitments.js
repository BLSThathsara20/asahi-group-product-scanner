/** Vehicle make + model fitment helpers. */

function cleanMake(value) {
	return String(value || "").trim();
}

function cleanModel(value) {
	return String(value || "").trim();
}

function normalizeFitmentEntry(entry) {
	const make = cleanMake(entry?.make);
	if (!make) return null;
	const models = [...new Set((entry?.models || []).map(cleanModel).filter(Boolean))];
	return { make, models };
}

/** Normalize fitments from Sanity doc or app item. */
export function normalizeVehicleFitments(source) {
	if (!source) return [];

	if (Array.isArray(source.vehicle_fitments)) {
		return source.vehicle_fitments.map(normalizeFitmentEntry).filter(Boolean);
	}

	if (Array.isArray(source.vehicleFitments)) {
		return source.vehicleFitments.map(normalizeFitmentEntry).filter(Boolean);
	}

	if (Array.isArray(source.vehicle_models)) {
		return source.vehicle_models
			.map((make) => normalizeFitmentEntry({ make, models: [] }))
			.filter(Boolean);
	}

	if (Array.isArray(source.vehicleModels)) {
		return source.vehicleModels
			.map((make) => normalizeFitmentEntry({ make, models: [] }))
			.filter(Boolean);
	}

	const legacyMake = source.vehicle_model || source.vehicleModel;
	if (legacyMake) {
		const entry = normalizeFitmentEntry({ make: legacyMake, models: [] });
		return entry ? [entry] : [];
	}

	return [];
}

export function formatVehicleFitments(source) {
	const fitments = normalizeVehicleFitments(source);
	if (!fitments.length) return "";

	return fitments
		.map((entry) => {
			if (!entry.models.length) return entry.make;
			return `${entry.make}: ${entry.models.join(", ")}`;
		})
		.join(" · ");
}

export function flattenVehicleFitmentLabels(source) {
	const fitments = normalizeVehicleFitments(source);
	const labels = [];
	for (const entry of fitments) {
		if (!entry.models.length) {
			labels.push(entry.make);
			continue;
		}
		for (const model of entry.models) {
			labels.push(`${entry.make} ${model}`);
		}
	}
	return labels;
}

export function itemMatchesVehicleFitmentSearch(item, query) {
	const q = String(query || "").toLowerCase();
	if (!q) return true;

	return normalizeVehicleFitments(item).some((entry) => {
		if (entry.make.toLowerCase().includes(q)) return true;
		return entry.models.some((model) => model.toLowerCase().includes(q));
	});
}

function fitmentsKey(fitments) {
	return normalizeVehicleFitments({ vehicle_fitments: fitments })
		.map((entry) => `${entry.make.toLowerCase()}=${entry.models.map((m) => m.toLowerCase()).sort().join(",")}`)
		.sort()
		.join("|");
}

export function vehicleFitmentsChanged(before, next) {
	return fitmentsKey(normalizeVehicleFitments(before)) !== fitmentsKey(next);
}

export function hasRequiredVehicleFitments(fitments) {
	return normalizeVehicleFitments({ vehicle_fitments: fitments }).some(
		(entry) => entry.make && entry.models.length > 0
	);
}

export function fitmentsToSanity(fitments) {
	return normalizeVehicleFitments({ vehicle_fitments: fitments }).map((entry) => ({
		_type: "object",
		make: entry.make,
		models: entry.models,
	}));
}
