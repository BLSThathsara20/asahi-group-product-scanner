import { describe, it, expect } from 'vitest';
import { normalizeRepeatedBarcode, sanitizeBarcodeInput, wasBarcodeCorrected } from './barcodeUtils';

describe('normalizeRepeatedBarcode', () => {
	it('returns empty for empty input', () => {
		expect(normalizeRepeatedBarcode('')).toBe('');
	});

	it('leaves a single scan unchanged', () => {
		expect(normalizeRepeatedBarcode('932322299992')).toBe('932322299992');
	});

	it('collapses two identical scans concatenated', () => {
		expect(normalizeRepeatedBarcode('45678901284567890128')).toBe('4567890128');
		expect(normalizeRepeatedBarcode('932322299992932322299992')).toBe('932322299992');
	});

	it('collapses triple repeat pattern', () => {
		expect(normalizeRepeatedBarcode('ABCABCABC')).toBe('ABC');
	});

	it('extracts barcode from scan URL', () => {
		expect(normalizeRepeatedBarcode('http://localhost/scan?barcode=932322299992')).toBe('932322299992');
	});
});

describe('wasBarcodeCorrected', () => {
	it('detects when repeat scan was cleaned', () => {
		expect(wasBarcodeCorrected('932322299992932322299992')).toBe(true);
		expect(wasBarcodeCorrected('932322299992')).toBe(false);
	});
});

describe('sanitizeBarcodeInput', () => {
	it('matches normalizeRepeatedBarcode', () => {
		const raw = '89411540314778941154031477';
		expect(sanitizeBarcodeInput(raw)).toBe('8941154031477');
	});
});
