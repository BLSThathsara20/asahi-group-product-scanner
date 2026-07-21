const DEFAULT_CHECK_IN_NOTE = "item returned to spare parts";

/** Words/phrases that indicate a returned item may be faulty. */
const FAULT_KEYWORDS = [
	"faulty",
	"fault",
	"fauly",
	"falt",
	"defect",
	"defective",
	"defekt",
	"broken",
	"broke",
	"damaged",
	"damage",
	"malfunction",
	"failed",
	"failure",
	"not working",
	"doesn't work",
	"doesnt work",
	"won't work",
	"wont work",
	"needs repair",
	"repair needed",
	"need repair",
	"dead",
	"burnt",
	"burned",
	"short circuit",
	"short-circuit",
];

/** True when check-in notes suggest the item was returned as faulty. */
export function noteIndicatesFault(notes) {
	const text = String(notes || "")
		.trim()
		.toLowerCase();
	if (!text || text === DEFAULT_CHECK_IN_NOTE) return false;
	return FAULT_KEYWORDS.some((keyword) => text.includes(keyword));
}
