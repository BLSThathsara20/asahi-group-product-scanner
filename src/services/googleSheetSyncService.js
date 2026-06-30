/**
 * Triggers a Google Apps Script web app to pull latest inventory into Sheets.
 * Deploy doGet in Apps Script (see docs/GOOGLE_SHEETS_SYNC.md) and set:
 *   VITE_GOOGLE_SHEETS_SYNC_URL
 *   VITE_GOOGLE_SHEETS_SYNC_SECRET (optional)
 */

const DEBOUNCE_MS = 2500;
let syncTimer = null;

export function isGoogleSheetSyncConfigured() {
	return Boolean(import.meta.env.VITE_GOOGLE_SHEETS_SYNC_URL?.trim());
}

/** Debounced — safe to call after every inventory change. */
export function triggerGoogleSheetSync() {
	if (!isGoogleSheetSyncConfigured()) return;

	clearTimeout(syncTimer);
	syncTimer = setTimeout(async () => {
		const baseUrl = import.meta.env.VITE_GOOGLE_SHEETS_SYNC_URL.trim();
		const secret = import.meta.env.VITE_GOOGLE_SHEETS_SYNC_SECRET?.trim();
		const url = new URL(baseUrl);
		if (secret) url.searchParams.set("secret", secret);

		try {
			await fetch(url.toString(), { method: "GET", keepalive: true });
		} catch (err) {
			console.warn("[Google Sheets sync] Trigger failed:", err.message);
		}
	}, DEBOUNCE_MS);
}
