export default {
	name: "itemBarcode",
	title: "Item Barcode",
	type: "document",
	fields: [
		{ name: "item", title: "Item", type: "reference", to: [{ type: "inventoryItem" }], validation: (R) => R.required() },
		{ name: "barcode", title: "Barcode", type: "string", validation: (R) => R.required() },
	],
};
