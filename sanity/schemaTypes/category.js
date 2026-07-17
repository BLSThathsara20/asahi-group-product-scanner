export default {
	name: "category",
	title: "Category",
	type: "document",
	fields: [
		{ name: "name", title: "Name", type: "string", validation: (R) => R.required() },
		{ name: "parent", title: "Parent Category", type: "reference", to: [{ type: "category" }] },
		{
			name: "requireVehicleFitment",
			title: "Require vehicle make & model",
			type: "boolean",
			description: "When off, parts in this category do not need a vehicle make/model.",
			initialValue: true,
		},
		{ name: "sortOrder", title: "Sort Order", type: "number", initialValue: 0 },
	],
};
