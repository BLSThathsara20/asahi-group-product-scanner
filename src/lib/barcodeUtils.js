/** Extract barcode from URL or raw scan text. */
export function extractBarcode(value) {
	const trimmed = String(value || '').trim();
	if (!trimmed) return trimmed;
	try {
		const url = new URL(trimmed);
		const b = url.searchParams.get('barcode');
		return (b || trimmed).trim();
	} catch {
		return trimmed;
	}
}

export const BARCODE_MIN_LENGTH = 4;
export const BARCODE_MAX_LENGTH = 128;

/**
 * Collapse accidental repeat scans (e.g. 89411540314778941154031477 → 8941154031477).
 * Handles exact chunk repeats and back-to-back duplicate scans.
 */
export function normalizeRepeatedBarcode(value) {
	let s = extractBarcode(value);
	if (!s) return s;

	let changed = true;
	while (changed && s.length > 1) {
		changed = false;

		if (s.length % 2 === 0) {
			const half = s.length / 2;
			if (s.slice(0, half) === s.slice(half)) {
				s = s.slice(0, half);
				changed = true;
				continue;
			}
		}

		for (let len = Math.floor(s.length / 2); len >= 1; len -= 1) {
			if (s.length % len !== 0) continue;
			const chunk = s.slice(0, len);
			if (chunk.repeat(s.length / len) === s) {
				s = chunk;
				changed = true;
				break;
			}
		}
	}

	if (s.length > BARCODE_MAX_LENGTH) {
		s = s.slice(0, BARCODE_MAX_LENGTH);
	}

	return s;
}

export function sanitizeBarcodeInput(value) {
	return normalizeRepeatedBarcode(value);
}

export function wasBarcodeCorrected(raw) {
	const rawTrim = String(raw || '').trim();
	if (!rawTrim) return false;
	return rawTrim !== sanitizeBarcodeInput(rawTrim);
}

export function barcodeLengthError(value) {
	const s = String(value || '').trim();
	if (!s) return null;
	if (s.length < BARCODE_MIN_LENGTH) return `Barcode must be at least ${BARCODE_MIN_LENGTH} characters`;
	if (s.length > BARCODE_MAX_LENGTH) return `Barcode must be ${BARCODE_MAX_LENGTH} characters or less`;
	return null;
}
