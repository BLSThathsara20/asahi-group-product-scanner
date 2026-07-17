import { buildCategoryOptions } from "../services/categoryService";

const LEGACY_OPTIONAL_CATEGORIES = new Set(["tv unit"]);

export function isVehicleMakeRequiredForCategory(categoryValue, categories) {
	const value = String(categoryValue || "").trim();
	if (!value) return true;

	if (Array.isArray(categories) && categories.length > 0) {
		const options = buildCategoryOptions(categories);
		const match = options.find((option) => option.value === value);
		if (!match) return true;
		const category = categories.find((entry) => entry.id === match.id);
		return category?.require_vehicle_fitment !== false;
	}

	return !LEGACY_OPTIONAL_CATEGORIES.has(value.toLowerCase());
}
