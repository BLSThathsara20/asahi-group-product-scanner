import bcrypt from "bcryptjs";
import { sanityClient } from "../lib/sanity";
import { mapUser, mapInvite, mapPasswordReset } from "../lib/sanityMappers";
import { getStoredSession } from "../lib/authStorage";

const TEMP_PASSWORD_CHARS =
	"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateTempPassword(length = 10) {
	let value = "";
	for (let i = 0; i < length; i += 1) {
		value += TEMP_PASSWORD_CHARS[Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length)];
	}
	return value;
}

/** Whether the signed-in admin may reset the target user's password. */
export function canResetUserPassword({ isSuperAdmin, isAdmin, actorId, target }) {
	if (!isAdmin || !target || target.type !== "profile") return false;
	if (target.id === actorId) return false;
	if (target.role === "super_admin" && !isSuperAdmin) return false;
	return true;
}

function appBaseUrl() {
	if (typeof window === "undefined") return "";
	return `${window.location.origin}${(import.meta.env?.BASE_URL || "").replace(/\/$/, "")}`;
}

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

export async function updateProfileRole(id, role, options = {}) {
	const roleVal = role && String(role).trim();
	if (!roleVal) throw new Error("Role is required");
	if (roleVal === "super_admin") throw new Error("Cannot assign super admin role");
	if (roleVal === "admin" && !options.actorIsSuperAdmin) {
		throw new Error("Only super admin can assign admin role");
	}
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

export async function addUser(email, fullName, role, tempPassword, options = {}) {
	if (role === "super_admin") throw new Error("Cannot invite super admin");
	if (role === "admin" && !options.actorIsSuperAdmin) {
		throw new Error("Only super admin can create admin users");
	}
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

export async function createPasswordReset(userId, tempPassword) {
	const trimmed = String(tempPassword || "").trim();
	if (!userId) throw new Error("User is required");
	if (trimmed.length < 6) {
		throw new Error("Temporary password must be at least 6 characters");
	}

	const user = await sanityClient.fetch(
		`*[_type == "appUser" && _id == $id][0]{ _id, email, role }`,
		{ id: userId }
	);
	if (!user) throw new Error("User not found");

	const existing = await sanityClient.fetch(
		`*[_type == "passwordReset" && user._ref == $userId]._id`,
		{ userId }
	);
	await Promise.all((existing || []).map((id) => sanityClient.delete(id)));

	const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
	const tempPasswordHash = await bcrypt.hash(trimmed, 10);
	const session = getStoredSession();

	await sanityClient.create({
		_type: "passwordReset",
		user: { _type: "reference", _ref: userId },
		token,
		tempPasswordHash,
		createdBy: session?.userId
			? { _type: "reference", _ref: session.userId }
			: undefined,
	});

	return {
		resetLink: `${appBaseUrl()}/reset-password?token=${token}`,
		tempPassword: trimmed,
		email: user.email,
	};
}

export async function getPasswordResetByToken(token) {
	if (!token) return null;
	const doc = await sanityClient.fetch(
		`*[_type == "passwordReset" && token == $token][0]{
			_id,
			token,
			tempPasswordHash,
			"user_id": user._ref,
			"email": user->email,
			"full_name": user->fullName
		}`,
		{ token }
	);
	return mapPasswordReset(doc);
}

export async function verifyPasswordResetTempPassword(token, tempPassword) {
	const doc = await sanityClient.fetch(
		`*[_type == "passwordReset" && token == $token][0]{ tempPasswordHash }`,
		{ token }
	);
	if (!doc?.tempPasswordHash) return false;
	return bcrypt.compare(tempPassword, doc.tempPasswordHash);
}

export async function completePasswordReset(token, tempPassword, newPassword) {
	const reset = await getPasswordResetByToken(token);
	if (!reset?.user_id) throw new Error("Invalid or expired reset link");

	const valid = await verifyPasswordResetTempPassword(token, tempPassword);
	if (!valid) throw new Error("Incorrect temporary password");

	if (!newPassword || newPassword.length < 6) {
		throw new Error("Password must be at least 6 characters");
	}

	await sanityClient
		.patch(reset.user_id)
		.set({ passwordHash: await bcrypt.hash(newPassword, 10) })
		.commit();
	await sanityClient.delete(reset.id);
	return { email: reset.email };
}
