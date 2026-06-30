export default {
	name: "inventoryTransaction",
	title: "Inventory Transaction",
	type: "document",
	fields: [
		{ name: "item", title: "Item", type: "reference", to: [{ type: "inventoryItem" }], validation: (R) => R.required() },
		{ name: "type", title: "Type", type: "string", options: { list: ["in", "out"] }, validation: (R) => R.required() },
		{ name: "quantity", title: "Quantity", type: "number", initialValue: 1 },
		{ name: "recipientName", title: "Recipient Name", type: "string" },
		{ name: "purpose", title: "Purpose", type: "string" },
		{ name: "responsiblePerson", title: "Responsible Person", type: "string" },
		{ name: "vehicleModel", title: "Vehicle Model", type: "string" },
		{ name: "notes", title: "Notes", type: "text" },
		{ name: "performedBy", title: "Performed By", type: "reference", to: [{ type: "appUser" }] },
		{ name: "createdAt", title: "Created At", type: "datetime" },
	],
};
