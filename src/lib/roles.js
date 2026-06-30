/** Default assignable roles — seeded when none exist in Sanity. */
export const SYSTEM_ROLE_SLUGS = new Set(["super_admin", "admin", "worker", "inventory_manager"]);

export const DEFAULT_USER_ROLES = [
	{ name: "Mechanic", slug: "worker", sort_order: 1, locked: true },
	{ name: "Inventory Manager", slug: "inventory_manager", sort_order: 2, locked: true },
	{ name: "Admin", slug: "admin", sort_order: 3, locked: true },
];

export function slugifyRoleName(name) {
	return String(name || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 48);
}

export function getRoleLabel(slug, roles = []) {
	if (slug === "super_admin") return "Super Admin";
	const match = roles.find((r) => r.slug === slug);
	return match?.name || slug?.replace(/_/g, " ") || "User";
}

export function isAdminRole(slug) {
	return slug === "super_admin" || slug === "admin";
}

/** Roles shown when creating/editing users (excludes super_admin). */
export function assignableRoles(roles) {
	return (roles || []).filter((r) => r.slug !== "super_admin");
}
