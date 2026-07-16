import { sanityClient } from "../lib/sanity";

function normalizeMake(make) {
	return String(make || "").trim();
}

function normalizeModel(model) {
	if (typeof model === "string") return String(model || "").trim();
	return String(model?.name || model?.model || "").trim();
}

/** Saved model names for a vehicle make (for select suggestions). */
export async function getVehicleModelsForMake(make) {
	const normalizedMake = normalizeMake(make);
	if (!normalizedMake) return [];

	const docs = await sanityClient.fetch(
		`*[_type == "vehicleModelCatalog" && make == $make].modelName | order(modelName asc)`,
		{ make: normalizedMake }
	);

	return [...new Set((docs || []).map(normalizeModel).filter(Boolean))];
}

/** Persist newly typed models so they appear next time. */
export async function ensureVehicleCatalogEntries(fitments) {
	const entries = (fitments || []).flatMap((fitment) => {
		const make = normalizeMake(fitment?.make);
		if (!make) return [];
		return (fitment?.models || []).map((model) => ({
			make,
			model: normalizeModel(model),
		}));
	}).filter((entry) => entry.model);

	for (const { make, model } of entries) {
		const existing = await sanityClient.fetch(
			`*[_type == "vehicleModelCatalog" && make == $make && modelName == $model][0]._id`,
			{ make, model }
		);
		if (existing) continue;
		await sanityClient.create({
			_type: "vehicleModelCatalog",
			make,
			modelName: model,
		});
	}
}
