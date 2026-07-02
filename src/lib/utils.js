import { v4 as uuidv4 } from 'uuid';

export function generateQrId() {
  return `AGL-INV-${uuidv4().slice(0, 8).toUpperCase()}`;
}

/** Build URL that encodes in QR - when scanned with phone camera, opens product in app */
export function getQrCodeUrl(qrId) {
  if (typeof window === 'undefined') return qrId;
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, '');
  return `${base}/scan?barcode=${encodeURIComponent(qrId)}`;
}

/** Format amount in British pounds */
export function formatGbp(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(amount));
}
