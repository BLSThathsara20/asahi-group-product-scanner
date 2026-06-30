export default {
	name: "userInvite",
	title: "User Invite",
	type: "document",
	fields: [
		{ name: "email", title: "Email", type: "string", validation: (R) => R.required() },
		{
			name: "role",
			title: "Role",
			type: "string",
		},
		{ name: "token", title: "Token", type: "string", validation: (R) => R.required() },
		{ name: "fullName", title: "Full Name", type: "string" },
		{ name: "tempPasswordHash", title: "Temp Password Hash", type: "string" },
		{ name: "createdBy", title: "Created By", type: "reference", to: [{ type: "appUser" }] },
	],
};
