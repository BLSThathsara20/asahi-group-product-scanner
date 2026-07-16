/** Fixed low-stock threshold — alerts when quantity is below this value. */
export const LOW_STOCK_THRESHOLD = 2;

export function isLowStock(quantity) {
	return (quantity ?? 0) < LOW_STOCK_THRESHOLD;
}
