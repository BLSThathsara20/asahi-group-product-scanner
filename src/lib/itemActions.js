/** Labels and styling for spare-part action history entries. */

import { vehicleFitmentsChanged } from "./vehicleFitments";

export const ACTION_TYPE_LABELS = {
	in: "Check in",
	out: "Check out",
	created: "Item created",
	updated: "Item updated",
	status: "Status changed",
};

export const ACTION_TYPE_STYLES = {
	in: "bg-emerald-100 text-emerald-800",
	out: "bg-amber-100 text-amber-800",
	created: "bg-blue-100 text-blue-800",
	updated: "bg-violet-100 text-violet-800",
	status: "bg-slate-100 text-slate-800",
};

const FIELD_LABELS = {
	name: "Name",
	description: "Description",
	category: "Category",
	quantity: "Quantity",
	status: "Status",
	store_location: "Location",
	vehicle_fitments: "Vehicle compatibility",
	agl_number: "AGL number",
	unit_price: "Unit price",
	reminder_count: "Low stock alert",
	photo_url: "Photo",
};

function normalizeBarcodes(arr) {
	return [...(arr || [])]
		.map((b) => String(b).trim())
		.filter(Boolean)
		.sort()
		.join("|");
}

export function buildItemEditSummary(before, updates, options = {}) {
	const { beforeBarcodes } = options;
	const parts = [];
	for (const [key, val] of Object.entries(updates || {})) {
		if (key === "barcodes" || key === "vehicle_fitments") continue;
		const label = FIELD_LABELS[key] || key;
		const prev = before?.[key];
		const next = val;
		if (String(prev ?? "") === String(next ?? "")) continue;
		if (key === "status") {
			parts.push(`${label}: ${prev || "—"} → ${next}`);
		} else if (next === null || next === "") {
			parts.push(`${label} cleared`);
		} else {
			parts.push(`${label} updated`);
		}
	}
	if (Array.isArray(updates?.barcodes) && beforeBarcodes !== undefined) {
		if (normalizeBarcodes(updates.barcodes) !== normalizeBarcodes(beforeBarcodes)) {
			parts.push("Barcodes updated");
		}
	}
	if (Array.isArray(updates?.vehicle_fitments)) {
		if (vehicleFitmentsChanged(before, updates.vehicle_fitments)) {
			parts.push("Vehicle compatibility updated");
		}
	}
	return parts.length ? parts.join(" · ") : "Details updated";
}

export function formatActionSummary(tx) {
	if (tx.type === "out") {
		const bits = [];
		if (tx.recipient_name) bits.push(`To: ${tx.recipient_name}`);
		if (tx.purpose) bits.push(tx.purpose);
		if (tx.vehicle_model) bits.push(`Vehicle: ${tx.vehicle_model}`);
		return bits.join(" · ") || "Checked out";
	}
	if (tx.type === "in") {
		const qty = tx.quantity ?? 1;
		const qtyText = qty === 1 ? "1 unit checked in" : `${qty} units checked in`;
		if (tx.notes && tx.notes !== "Item returned to spare parts") {
			return `${qtyText} · ${tx.notes}`;
		}
		return qtyText;
	}
	return tx.notes || ACTION_TYPE_LABELS[tx.type] || tx.type;
}
