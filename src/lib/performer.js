/** Display name for who performed an action (full name, then email, then fallback). */
export function displayPerformer(tx, namesMap = {}) {
	const fromTx = tx?.performer_name?.trim();
	if (fromTx) return fromTx;

	const userId = tx?.performed_by;
	if (userId && namesMap[userId]) return namesMap[userId];

	return userId ? "Unknown user" : null;
}
