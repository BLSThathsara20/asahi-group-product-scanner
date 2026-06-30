/** Map Sanity documents to app-friendly shapes (Supabase-like field names) */

function refId(ref) {
	if (!ref) return null;
	if (typeof ref === "string") return ref;
	return ref._ref || ref._id || null;
}

function imageUrl(image) {
	if (!image) return null;
	if (typeof image === "string") return image;
	return image.asset?.url || image.url || null;
}

export function mapUser(doc) {
	if (!doc) return null;
	return {
		id: doc._id,
		email: doc.email,
		full_name: doc.fullName || "",
		role: doc.role || "worker",
		address: doc.address || null,
		phone_number: doc.phoneNumber || null,
		created_at: doc._createdAt,
		updated_at: doc._updatedAt,
	};
}

export function mapItem(doc) {
	if (!doc) return null;
	return {
		id: doc._id,
		qr_id: doc.qrId,
		name: doc.name,
		description: doc.description || null,
		category: doc.category || null,
		photo_url: imageUrl(doc.photo) || doc.photoUrl || null,
		quantity: doc.quantity ?? 1,
		status: doc.status || "in_stock",
		added_date: doc.addedDate || doc._createdAt,
		last_used_date: doc.lastUsedDate || null,
		vehicle_model: doc.vehicleModel || null,
		store_location: doc.storeLocation || null,
		model_name: doc.modelName || null,
		sku_code: doc.skuCode || null,
		agl_number: doc.aglNumber || null,
		reminder_count: doc.reminderCount ?? 1,
		added_by: refId(doc.addedBy),
		last_used_by: refId(doc.lastUsedBy),
		created_at: doc._createdAt,
		updated_at: doc._updatedAt,
	};
}

export function mapTransaction(doc) {
	if (!doc) return null;
	return {
		id: doc._id,
		item_id: refId(doc.item),
		type: doc.type,
		quantity: doc.quantity ?? 1,
		recipient_name: doc.recipientName || null,
		purpose: doc.purpose || null,
		responsible_person: doc.responsiblePerson || null,
		vehicle_model: doc.vehicleModel || null,
		notes: doc.notes || null,
		performed_by: refId(doc.performedBy),
		created_at: doc.createdAt || doc._createdAt,
	};
}

export function mapCategory(doc) {
	if (!doc) return null;
	return {
		id: doc._id,
		name: doc.name,
		parent_id: refId(doc.parent),
		sort_order: doc.sortOrder ?? 0,
		created_at: doc._createdAt,
	};
}

export function mapInvite(doc) {
	if (!doc) return null;
	return {
		id: doc._id,
		email: doc.email,
		role: doc.role,
		token: doc.token,
		full_name: doc.fullName || null,
		temp_password: doc.tempPasswordHash || null,
		created_by: refId(doc.createdBy),
		created_at: doc._createdAt,
	};
}

export function itemToSanity(item) {
	const doc = {
		_type: "inventoryItem",
	};
	if (item.qr_id != null) doc.qrId = item.qr_id;
	if (item.name != null) doc.name = item.name;
	if (item.description !== undefined) doc.description = item.description;
	if (item.category !== undefined) doc.category = item.category;
	if (item.photo_url !== undefined) doc.photoUrl = item.photo_url;
	if (item.quantity != null) doc.quantity = item.quantity;
	if (item.status != null) doc.status = item.status;
	if (item.added_date != null) doc.addedDate = item.added_date;
	if (item.last_used_date !== undefined) doc.lastUsedDate = item.last_used_date;
	if (item.vehicle_model !== undefined) doc.vehicleModel = item.vehicle_model;
	if (item.store_location !== undefined) doc.storeLocation = item.store_location;
	if (item.model_name !== undefined) doc.modelName = item.model_name;
	if (item.sku_code !== undefined) doc.skuCode = item.sku_code;
	if (item.agl_number !== undefined) doc.aglNumber = item.agl_number;
	if (item.reminder_count != null) doc.reminderCount = item.reminder_count;
	if (item.added_by) doc.addedBy = { _type: "reference", _ref: item.added_by };
	if (item.last_used_by) doc.lastUsedBy = { _type: "reference", _ref: item.last_used_by };
	if (item.photo) doc.photo = item.photo;
	return doc;
}

export function transactionToSanity(tx) {
	return {
		_type: "inventoryTransaction",
		item: tx.item_id ? { _type: "reference", _ref: tx.item_id } : undefined,
		type: tx.type,
		quantity: tx.quantity ?? 1,
		recipientName: tx.recipient_name || null,
		purpose: tx.purpose || null,
		responsiblePerson: tx.responsible_person || null,
		vehicleModel: tx.vehicle_model || null,
		notes: tx.notes || null,
		performedBy: tx.performed_by
			? { _type: "reference", _ref: tx.performed_by }
			: undefined,
		createdAt: tx.created_at || new Date().toISOString(),
	};
}
