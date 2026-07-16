const TYPE_ALIASES = {
	"check in": "in",
	"check-in": "in",
	checkin: "in",
	"check out": "out",
	"check-out": "out",
	checkout: "out",
};

export function normalizeTransactionType(type) {
	const raw = String(type || "").trim().toLowerCase();
	return TYPE_ALIASES[raw] || raw;
}

export function isCheckInTransaction(tx) {
	return normalizeTransactionType(tx?.type) === "in";
}

export function isCheckOutTransaction(tx) {
	return normalizeTransactionType(tx?.type) === "out";
}

export function isStockMovementTransaction(tx) {
	const type = normalizeTransactionType(tx?.type);
	return type === "in" || type === "out";
}
