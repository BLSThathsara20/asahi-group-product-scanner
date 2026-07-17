import { normalizeVehicleFitments, NOT_SPECIFIED_MODEL } from "./vehicleFitments";

function itemSearchHaystack(item) {
	const fitments = normalizeVehicleFitments(item);
	const fitmentText = fitments.flatMap((entry) => [
		entry.make,
		...entry.models.map((model) => model.name),
	]);

	return [
		item?.name,
		item?.qr_id,
		item?.category,
		item?.store_location,
		item?.description,
		item?.sku_code,
		item?.agl_number,
		...fitmentText,
	]
		.filter(Boolean)
		.map((value) => String(value).toLowerCase());
}

function parseSearchKeywords(query) {
	return String(query || "")
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean);
}

/** Match spare part against header/list search query (supports multi-keyword AND). */
export function matchesItemSearch(item, query) {
	const keywords = parseSearchKeywords(query);
	if (!keywords.length) return true;

	const haystack = itemSearchHaystack(item);
	return keywords.every((keyword) => haystack.some((field) => field.includes(keyword)));
}

/** Subtitle for search results: make | models, or null when no fitment make. */
export function getItemSearchSubtitle(item) {
	const fitments = normalizeVehicleFitments(item);
	if (!fitments.length) return item?.category?.trim() || null;

	const lines = fitments
		.map((entry) => {
			const models = entry.models
				.map((model) => model.name)
				.filter((name) => name && name !== NOT_SPECIFIED_MODEL);
			if (models.length) return `${entry.make} | ${models.join(", ")}`;
			return entry.make;
		})
		.filter(Boolean);

	return lines.length ? lines.join(" · ") : item?.category?.trim() || null;
}
