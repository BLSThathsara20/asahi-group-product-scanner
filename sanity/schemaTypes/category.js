export default {
	name: "category",
	title: "Category",
	type: "document",
	fields: [
		{ name: "name", title: "Name", type: "string", validation: (R) => R.required() },
		{ name: "parent", title: "Parent Category", type: "reference", to: [{ type: "category" }] },
		{ name: "sortOrder", title: "Sort Order", type: "number", initialValue: 0 },
	],
};
