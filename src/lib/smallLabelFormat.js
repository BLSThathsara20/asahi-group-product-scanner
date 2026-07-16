import { formatVehicleFitments, normalizeVehicleFitments } from "./vehicleFitments";

export function formatSmallLabelMakeQrLine(source) {
	const fitments = normalizeVehicleFitments(source);
	const makes = fitments.map((entry) => entry.make).filter(Boolean);
	const make = makes.length ? makes.join(", ") : formatVehicleFitments(source) || "—";
	const code = source?.qr_id || source?.qrId || "—";
	return `${make} | ${code}`;
}

export function getSmallLabelModelsLine(source) {
	const fitments = normalizeVehicleFitments(source);
	return fitments
		.flatMap((entry) => entry.models.map((model) => model.name))
		.filter(Boolean)
		.join(", ");
}
