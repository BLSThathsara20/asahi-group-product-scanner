export default {
	name: "itemDeletionLog",
	title: "Item Deletion Log",
	type: "document",
	fields: [
		{ name: "itemId", title: "Original Item ID", type: "string", validation: (R) => R.required() },
		{ name: "qrId", title: "QR / Barcode ID", type: "string" },
		{ name: "name", title: "Name", type: "string", validation: (R) => R.required() },
		{ name: "category", title: "Category", type: "string" },
		{ name: "vehicleModel", title: "Vehicle Model", type: "string" },
		{ name: "aglNumber", title: "AGL Number", type: "string" },
		{ name: "quantity", title: "Quantity at Deletion", type: "number" },
		{ name: "status", title: "Status at Deletion", type: "string" },
		{ name: "barcodes", title: "Barcodes", type: "array", of: [{ type: "string" }] },
		{
			name: "deletedBy",
			title: "Deleted By",
			type: "reference",
			to: [{ type: "appUser" }],
			validation: (R) => R.required(),
		},
		{ name: "deletedAt", title: "Deleted At", type: "datetime", validation: (R) => R.required() },
	],
};
