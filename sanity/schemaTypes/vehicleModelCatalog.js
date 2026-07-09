export default {
	name: "vehicleModelCatalog",
	title: "Vehicle Model Catalog",
	type: "document",
	fields: [
		{ name: "make", title: "Vehicle Make", type: "string", validation: (R) => R.required() },
		{ name: "modelName", title: "Model Name", type: "string", validation: (R) => R.required() },
	],
};
