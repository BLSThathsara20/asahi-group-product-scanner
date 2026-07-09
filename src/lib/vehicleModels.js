/** Normalize vehicle models from Sanity doc or app item shape. */
export function normalizeVehicleModels(source) {
	if (!source) return [];
	if (Array.isArray(source.vehicle_models)) {
		return source.vehicle_models.map((m) => String(m).trim()).filter(Boolean);
	}
	if (Array.isArray(source.vehicleModels)) {
		return source.vehicleModels.map((m) => String(m).trim()).filter(Boolean);
	}
	const single = source.vehicle_model || source.vehicleModel;
	if (single) {
		const trimmed = String(single).trim();
		return trimmed ? [trimmed] : [];
	}
	return [];
}

export function formatVehicleModels(models) {
	const list = Array.isArray(models) ? models : normalizeVehicleModels(models);
	return list.join(", ");
}

export function itemMatchesVehicleSearch(item, query) {
	const q = String(query || "").toLowerCase();
	if (!q) return true;
	return normalizeVehicleModels(item).some((model) => model.toLowerCase().includes(q));
}

function normalizeVehicleModelsKey(models) {
	return [...(models || [])]
		.map((m) => String(m).trim())
		.filter(Boolean)
		.sort()
		.join("|");
}

export function vehicleModelsChanged(before, next) {
	return normalizeVehicleModelsKey(normalizeVehicleModels(before)) !== normalizeVehicleModelsKey(next);
}
