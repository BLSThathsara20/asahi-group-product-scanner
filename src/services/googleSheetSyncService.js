/**
 * Triggers a Google Apps Script web app to pull latest inventory into Sheets.
 * Deploy doGet in Apps Script (see docs/GOOGLE_SHEETS_SYNC.md) and set:
 *   VITE_GOOGLE_SHEETS_SYNC_URL
 *   VITE_GOOGLE_SHEETS_SYNC_SECRET (optional)
 */

const DEBOUNCE_MS = 2500;
let syncTimer = null;
let warnedMisconfigured = false;

export function isGoogleSheetSyncConfigured() {
	return Boolean(import.meta.env.VITE_GOOGLE_SHEETS_SYNC_URL?.trim());
}

function warnMisconfigured(url) {
	if (warnedMisconfigured) return;
	warnedMisconfigured = true;
	if (/\/a\/[^/]+\/macros\//.test(url)) {
		console.warn(
			"[Google Sheets sync] Your URL is organization-only (script.google.com/a/...). " +
				"Redeploy the Apps Script web app with Who has access: Anyone, then use the public " +
				"script.google.com/macros/s/.../exec URL in .env."
		);
	}
}

/** Debounced — safe to call after every inventory change. */
export function triggerGoogleSheetSync() {
	if (!isGoogleSheetSyncConfigured()) return;

	clearTimeout(syncTimer);
	syncTimer = setTimeout(async () => {
		const baseUrl = import.meta.env.VITE_GOOGLE_SHEETS_SYNC_URL.trim();
		warnMisconfigured(baseUrl);

		const secret = import.meta.env.VITE_GOOGLE_SHEETS_SYNC_SECRET?.trim();
		const url = new URL(baseUrl);
		if (secret) url.searchParams.set("secret", secret);

		try {
			const res = await fetch(url.toString(), { method: "GET" });
			const text = await res.text();
			if (!text.trimStart().startsWith("{")) {
				console.warn(
					"[Google Sheets sync] Sync did not run — got a login/HTML page instead of JSON. " +
						"Redeploy Apps Script: Execute as Me, Who has access: Anyone."
				);
				return;
			}
			const data = JSON.parse(text);
			if (!data.ok) {
				console.warn("[Google Sheets sync] Apps Script error:", data.error || data);
			}
		} catch (err) {
			console.warn("[Google Sheets sync] Trigger failed:", err.message);
		}
	}, DEBOUNCE_MS);
}
