import bcrypt from "bcryptjs";
import { sanityClient } from "../lib/sanity";
import { mapUser } from "../lib/sanityMappers";
import {
	getInviteByToken,
	deleteInvite,
	hasSuperAdmin,
} from "./userService";

import { getStoredSession, setStoredSession } from "../lib/authStorage";

export async function getUserById(id) {
	if (!id) return null;
	const doc = await sanityClient.fetch(`*[_type == "appUser" && _id == $id][0]`, {
		id,
	});
	return mapUser(doc);
}

export async function getUserByEmail(email) {
	const normalized = String(email || "").trim().toLowerCase();
	if (!normalized) return null;
	const doc = await sanityClient.fetch(
		`*[_type == "appUser" && lower(email) == $email][0]`,
		{ email: normalized }
	);
	return doc ? { ...mapUser(doc), passwordHash: doc.passwordHash } : null;
}

export async function signIn(email, password) {
	const user = await getUserByEmail(email);
	if (!user?.passwordHash) {
		throw new Error("Invalid email or password");
	}
	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) throw new Error("Invalid email or password");
	const session = { userId: user.id, email: user.email };
	setStoredSession(session);
	const profile = mapUser(await sanityClient.fetch(`*[_type == "appUser" && _id == $id][0]`, { id: user.id }));
	return { user: { id: user.id, email: user.email }, profile };
}

export async function signUp(email, password, fullName = "", extra = {}) {
	const normalizedEmail = String(email || "").trim().toLowerCase();
	if (!normalizedEmail || !password) throw new Error("Email and password required");

	const existing = await getUserByEmail(normalizedEmail);
	if (existing) throw new Error("An account with this email already exists");

	let role = "worker";
	let invite = null;

	if (extra.invite_token) {
		invite = await getInviteByToken(extra.invite_token);
		if (!invite) throw new Error("Invalid or expired invite");
		if (invite.email.toLowerCase() !== normalizedEmail) {
			throw new Error("Email does not match invite");
		}
		role = invite.role;
	} else {
		const setupDone = await hasSuperAdmin();
		if (!setupDone) role = "super_admin";
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const doc = await sanityClient.create({
		_type: "appUser",
		email: normalizedEmail,
		passwordHash,
		fullName: fullName?.trim() || normalizedEmail,
		role,
	});

	if (invite?.id) {
		await deleteInvite(invite.id);
	}

	const profile = mapUser(doc);
	const session = { userId: doc._id, email: normalizedEmail };
	setStoredSession(session);
	return { user: { id: doc._id, email: normalizedEmail }, profile };
}

export function signOut() {
	setStoredSession(null);
}

export async function updatePassword(userId, newPassword) {
	if (!userId || !newPassword) throw new Error("Password required");
	const passwordHash = await bcrypt.hash(newPassword, 10);
	await sanityClient.patch(userId).set({ passwordHash }).commit();
}

export async function loadSession() {
	const session = getStoredSession();
	if (!session?.userId) return { user: null, profile: null };
	const profile = await getUserById(session.userId);
	if (!profile) {
		setStoredSession(null);
		return { user: null, profile: null };
	}
	return {
		user: { id: profile.id, email: profile.email },
		profile,
	};
}
