import { sanityClient } from "../lib/sanity";
import { DEFAULT_USER_ROLES, slugifyRoleName, SYSTEM_ROLE_SLUGS } from "../lib/roles";

function mapRole(doc) {
	if (!doc) return null;
	return {
		id: doc._id,
		name: doc.name,
		slug: doc.slug,
		sort_order: doc.sortOrder ?? 0,
		locked: Boolean(doc.locked),
		created_at: doc._createdAt,
	};
}

async function seedDefaultRolesIfEmpty() {
	const count = await sanityClient.fetch(`count(*[_type == "userRole"])`);
	if (count > 0) return;

	await Promise.all(
		DEFAULT_USER_ROLES.map((role) =>
			sanityClient.create({
				_type: "userRole",
				name: role.name,
				slug: role.slug,
				sortOrder: role.sort_order,
				locked: role.locked,
			})
		)
	);
}

export async function getUserRoles() {
	await seedDefaultRolesIfEmpty();
	const docs = await sanityClient.fetch(
		`*[_type == "userRole"] | order(sortOrder asc, name asc)`
	);
	return (docs || []).map(mapRole);
}

export async function createUserRole(name) {
	const trimmed = String(name || "").trim();
	if (!trimmed) throw new Error("Role name is required");

	const slug = slugifyRoleName(trimmed);
	if (!slug) throw new Error("Invalid role name");
	if (slug === "super_admin") throw new Error("Cannot create super admin role");

	const existing = await sanityClient.fetch(
		`count(*[_type == "userRole" && slug == $slug])`,
		{ slug }
	);
	if (existing > 0) throw new Error("A role with this name already exists");

	const maxOrder = await sanityClient.fetch(
		`*[_type == "userRole"] | order(sortOrder desc)[0].sortOrder`
	);

	const doc = await sanityClient.create({
		_type: "userRole",
		name: trimmed,
		slug,
		sortOrder: (maxOrder ?? 0) + 1,
		locked: false,
	});
	return mapRole(doc);
}

export async function updateUserRole(id, name) {
	const trimmed = String(name || "").trim();
	if (!trimmed) throw new Error("Role name is required");

	const role = await sanityClient.fetch(
		`*[_type == "userRole" && _id == $id][0]{ slug, locked }`,
		{ id }
	);
	if (!role) throw new Error("Role not found");
	if (role.slug === "super_admin") throw new Error("Cannot rename super admin");

	await sanityClient.patch(id).set({ name: trimmed }).commit();
	return { id };
}

export async function deleteUserRole(id) {
	const role = await sanityClient.fetch(
		`*[_type == "userRole" && _id == $id][0]{ slug, locked }`,
		{ id }
	);
	if (!role) throw new Error("Role not found");
	if (role.locked || SYSTEM_ROLE_SLUGS.has(role.slug)) {
		throw new Error("System roles cannot be deleted");
	}

	const usersWithRole = await sanityClient.fetch(
		`count(*[_type == "appUser" && role == $slug])`,
		{ slug: role.slug }
	);
	if (usersWithRole > 0) {
		throw new Error("Cannot delete — users are assigned to this role");
	}

	const invitesWithRole = await sanityClient.fetch(
		`count(*[_type == "userInvite" && role == $slug])`,
		{ slug: role.slug }
	);
	if (invitesWithRole > 0) {
		throw new Error("Cannot delete — pending invites use this role");
	}

	await sanityClient.delete(id);
}

export async function countUsersWithRole(slug) {
	return sanityClient.fetch(`count(*[_type == "appUser" && role == $slug])`, { slug });
}
