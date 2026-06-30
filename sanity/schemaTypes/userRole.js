export default {
	name: "userRole",
	title: "User Role",
	type: "document",
	fields: [
		{ name: "name", title: "Display Name", type: "string", validation: (R) => R.required() },
		{ name: "slug", title: "Role Key", type: "string", validation: (R) => R.required() },
		{ name: "sortOrder", title: "Sort Order", type: "number", initialValue: 0 },
		{
			name: "locked",
			title: "System Role (cannot delete)",
			type: "boolean",
			initialValue: false,
		},
	],
};
