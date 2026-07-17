import { sanityClient } from "../lib/sanity";
import { mapCategory } from "../lib/sanityMappers";

export async function getCategories() {
	const docs = await sanityClient.fetch(
		`*[_type == "category"] | order(sortOrder asc, name asc)`
	);
	return (docs || []).map(mapCategory);
}

export function buildCategoryOptions(categories) {
	const byParent = {};
	(categories || []).forEach((c) => {
		const pid = c.parent_id ?? "root";
		if (!byParent[pid]) byParent[pid] = [];
		byParent[pid].push(c);
	});
	const options = [];
	(byParent["root"] || []).forEach((p) => {
		options.push({ value: p.name, label: p.name, id: p.id });
		(byParent[p.id] || []).forEach((c) => {
			options.push({
				value: `${p.name} > ${c.name}`,
				label: `${p.name} > ${c.name}`,
				id: c.id,
			});
		});
	});
	return options;
}

export async function createCategory(name, parentId = null, options = {}) {
	const { requireVehicleFitment = true } = options;
	const doc = await sanityClient.create({
		_type: "category",
		name: name.trim(),
		parent: parentId
			? { _type: "reference", _ref: parentId }
			: undefined,
		requireVehicleFitment: requireVehicleFitment !== false,
		sortOrder: 0,
	});
	return mapCategory(doc);
}

export async function updateCategory(id, updates) {
	const patch = sanityClient.patch(id);
	if ("name" in updates) patch.set({ name: (updates.name || "").trim() });
	if ("parent_id" in updates) {
		patch.set({
			parent: updates.parent_id
				? { _type: "reference", _ref: updates.parent_id }
				: null,
		});
	}
	if ("sort_order" in updates) patch.set({ sortOrder: updates.sort_order ?? 0 });
	if ("require_vehicle_fitment" in updates) {
		patch.set({ requireVehicleFitment: updates.require_vehicle_fitment !== false });
	}
	const doc = await patch.commit();
	return mapCategory(doc);
}

export async function deleteCategory(id) {
	await sanityClient.delete(id);
}
