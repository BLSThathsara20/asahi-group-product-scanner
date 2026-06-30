export default {
	name: "appUser",
	title: "App User",
	type: "document",
	fields: [
		{ name: "email", title: "Email", type: "string", validation: (R) => R.required() },
		{ name: "passwordHash", title: "Password Hash", type: "string" },
		{ name: "fullName", title: "Full Name", type: "string" },
		{
			name: "role",
			title: "Role",
			type: "string",
			options: {
				list: ["super_admin", "admin", "inventory_manager", "worker"],
			},
			initialValue: "worker",
		},
		{ name: "address", title: "Address", type: "string" },
		{ name: "phoneNumber", title: "Phone Number", type: "string" },
	],
};
