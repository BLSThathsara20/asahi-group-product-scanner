export default {
	name: "passwordReset",
	title: "Password Reset",
	type: "document",
	fields: [
		{
			name: "user",
			title: "User",
			type: "reference",
			to: [{ type: "appUser" }],
			validation: (R) => R.required(),
		},
		{ name: "token", title: "Token", type: "string", validation: (R) => R.required() },
		{ name: "tempPasswordHash", title: "Temp Password Hash", type: "string", validation: (R) => R.required() },
		{ name: "createdBy", title: "Created By", type: "reference", to: [{ type: "appUser" }] },
	],
};
