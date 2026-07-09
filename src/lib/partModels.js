/** Normalize part model names from Sanity doc or app item shape. */
export function normalizePartModels(source) {
	if (!source) return [];
	if (Array.isArray(source.model_names)) {
		return source.model_names.map((m) => String(m).trim()).filter(Boolean);
	}
	if (Array.isArray(source.modelNames)) {
		return source.modelNames.map((m) => String(m).trim()).filter(Boolean);
	}
	const single = source.model_name || source.modelName;
	if (single) {
		const trimmed = String(single).trim();
		return trimmed ? [trimmed] : [];
	}
	return [];
}

export function formatPartModels(models) {
	const list = Array.isArray(models) ? models : normalizePartModels(models);
	return list.join(", ");
}

export function itemMatchesPartModelSearch(item, query) {
	const q = String(query || "").toLowerCase();
	if (!q) return true;
	return normalizePartModels(item).some((model) => model.toLowerCase().includes(q));
}

function normalizePartModelsKey(models) {
	return [...(models || [])]
		.map((m) => String(m).trim())
		.filter(Boolean)
		.sort()
		.join("|");
}

export function partModelsChanged(before, next) {
	return normalizePartModelsKey(normalizePartModels(before)) !== normalizePartModelsKey(next);
}
