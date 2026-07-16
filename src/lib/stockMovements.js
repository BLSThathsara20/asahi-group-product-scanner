import { createTransaction } from "../services/itemService";

/** Record check-in/out when quantity is changed through the edit form. */
export async function recordQuantityEditMovement(itemId, beforeQty, afterQty, userId) {
	if (!itemId) return null;
	const previous = Number(beforeQty) || 0;
	const next = Number(afterQty) || 0;
	const delta = next - previous;
	if (delta === 0) return null;

	return createTransaction({
		item_id: itemId,
		type: delta > 0 ? "in" : "out",
		quantity: Math.abs(delta),
		notes:
			delta > 0
				? "Stock added via item edit"
				: "Stock removed via item edit",
		performed_by: userId,
	});
}
