import { sanityClient, isSanityConfigured } from "../lib/sanity";
import { getStoredSession } from "../lib/authStorage";

const CHECK_TIMEOUT_MS = 5000;

async function withTimeout(promise, ms = CHECK_TIMEOUT_MS) {
	const timeout = new Promise((_, reject) =>
		setTimeout(() => reject(new Error("Timeout")), ms)
	);
	return Promise.race([promise, timeout]);
}

export async function checkSanityConnection() {
	const start = Date.now();
	if (!isSanityConfigured()) {
		return {
			ok: false,
			latencyMs: 0,
			error: "Sanity not configured. Set VITE_SANITY_PROJECT_ID and VITE_SANITY_TOKEN in .env",
		};
	}
	try {
		await withTimeout(
			sanityClient.fetch(`count(*[_type == "inventoryItem"])`)
		);
		return {
			ok: true,
			latencyMs: Date.now() - start,
		};
	} catch (err) {
		return {
			ok: false,
			latencyMs: Date.now() - start,
			error: err.message || "Connection failed",
		};
	}
}

export async function checkAuth() {
	try {
		const session = getStoredSession();
		return {
			ok: true,
			authenticated: !!session?.userId,
		};
	} catch (err) {
		return {
			ok: false,
			authenticated: false,
			error: err.message || "Auth check failed",
		};
	}
}

export async function getContentStats() {
	try {
		const stats = await withTimeout(
			sanityClient.fetch(`{
				"items": count(*[_type == "inventoryItem"]),
				"transactions": count(*[_type == "inventoryTransaction"]),
				"users": count(*[_type == "appUser"]),
				"categories": count(*[_type == "category"])
			}`)
		);
		return { ok: true, data: stats };
	} catch (err) {
		return {
			ok: false,
			data: null,
			error: err.message || "Failed to fetch content stats",
		};
	}
}

export async function runHealthCheck() {
	const [sanityResult, authResult, contentStatsResult] = await Promise.all([
		checkSanityConnection(),
		checkAuth(),
		getContentStats(),
	]);

	return {
		healthy: sanityResult.ok,
		timestamp: new Date().toISOString(),
		version: "1.0.0",
		checks: {
			sanity: sanityResult,
			auth: authResult,
			contentStats: contentStatsResult,
		},
	};
}

// Backward-compatible alias
export const checkSupabaseConnection = checkSanityConnection;
