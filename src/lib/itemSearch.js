import { itemMatchesVehicleFitmentSearch } from "./vehicleFitments";

/** Match spare part against header/list search query. */
export function matchesItemSearch(item, query) {
	const q = String(query || "").trim().toLowerCase();
	if (!q) return true;

	const scalarFields = [
		item?.name,
		item?.qr_id,
		item?.category,
		item?.store_location,
		item?.description,
		item?.sku_code,
		item?.agl_number,
	];

	if (scalarFields.some((field) => field?.toLowerCase().includes(q))) {
		return true;
	}

	return itemMatchesVehicleFitmentSearch(item, q);
}
