import { createClient } from "@sanity/client";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || "production";
const token = import.meta.env.VITE_SANITY_TOKEN;
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || "2024-01-01";

if (!projectId) {
	console.warn(
		"Sanity project ID missing. Add VITE_SANITY_PROJECT_ID to .env"
	);
}

export const sanityClient = createClient({
	projectId: projectId || "missing",
	dataset,
	apiVersion,
	token,
	useCdn: false,
});

export function isSanityConfigured() {
	return Boolean(projectId && token);
}
