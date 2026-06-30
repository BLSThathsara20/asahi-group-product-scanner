import bcrypt from "bcryptjs";
import { sanityClient } from "../lib/sanity";
import { mapUser, mapInvite } from "../lib/sanityMappers";
import { getStoredSession } from "../lib/authStorage";

export async function hasSuperAdmin() {
	const count = await sanityClient.fetch(
		`count(*[_type == "appUser" && role == "super_admin"])`
	);
	return count > 0;
}

export async function getProfiles() {
	const docs = await sanityClient.fetch(
		`*[_type == "appUser"] | order(_createdAt desc)`
	);
	return (docs || []).map(mapUser);
}

export async function getProfilesByIds(ids) {
	const validIds = (ids || []).filter((id) => id != null && id !== "");
	if (!validIds.length) return {};
	const docs = await sanityClient.fetch(
		`*[_type == "appUser" && _id in $ids]{ _id, fullName, email }`,
		{ ids: validIds }
	);
	const map = {};
	(docs || []).forEach((p) => {
		map[p._id] = p.fullName?.trim() || p.email || "Unknown";
	});
	return map;
}

export async function updateProfileRole(id, role) {
	const roleVal = role && String(role).trim();
	if (!roleVal) throw new Error("Role is required");
	await sanityClient.patch(id).set({ role: roleVal }).commit();
	return { id };
}

const PROFILE_UPDATE_FIELDS = {
	full_name: "fullName",
	address: "address",
	phone_number: "phoneNumber",
};

export async function updateProfile(id, updates) {
	const payload = {};
	for (const [key, sanityKey] of Object.entries(PROFILE_UPDATE_FIELDS)) {
		if (key in updates) {
			const val = updates[key];
			payload[sanityKey] = val === "" || val === undefined ? null : String(val);
		}
	}
	if (Object.keys(payload).length === 0) return { id };
	await sanityClient.patch(id).set(payload).commit();
	return { id };
}

export async function deleteProfile(id) {
	await sanityClient.delete(id);
}

export async function createInvite(email, role) {
	const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
	const session = getStoredSession();
	await sanityClient.create({
		_type: "userInvite",
		email: email.trim().toLowerCase(),
		role,
		token,
		createdBy: session?.userId
			? { _type: "reference", _ref: session.userId }
			: undefined,
	});
	const baseUrl = window.location.origin;
	return `${baseUrl}/invite?invite=${token}`;
}

export async function addUser(email, fullName, role, tempPassword) {
	const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
	const tempPasswordHash = await bcrypt.hash(tempPassword, 10);
	const session = getStoredSession();
	await sanityClient.create({
		_type: "userInvite",
		email: email.trim().toLowerCase(),
		role,
		token,
		fullName: fullName || null,
		tempPasswordHash,
		createdBy: session?.userId
			? { _type: "reference", _ref: session.userId }
			: undefined,
	});
	const base =
		typeof window !== "undefined"
			? `${window.location.origin}${(import.meta.env?.BASE_URL || "").replace(/\/$/, "")}`
			: "";
	return { activationLink: `${base}/activate?token=${token}` };
}

export async function getPendingInvites() {
	const docs = await sanityClient.fetch(
		`*[_type == "userInvite"] | order(_createdAt desc)`
	);
	return (docs || []).map(mapInvite);
}

export async function deleteInvite(inviteId) {
	await sanityClient.delete(inviteId);
}

export async function getInviteByToken(token) {
	if (!token) return null;
	const doc = await sanityClient.fetch(
		`*[_type == "userInvite" && token == $token][0]`,
		{ token }
	);
	return mapInvite(doc);
}

export async function verifyInviteTempPassword(token, tempPassword) {
	const doc = await sanityClient.fetch(
		`*[_type == "userInvite" && token == $token][0]{ tempPasswordHash }`,
		{ token }
	);
	if (!doc?.tempPasswordHash) return false;
	return bcrypt.compare(tempPassword, doc.tempPasswordHash);
}

export async function getInviteByTokenPublic(token) {
	return getInviteByToken(token);
}
