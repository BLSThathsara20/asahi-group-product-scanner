/* eslint-env node */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
	name: "asahi-inventory",
	title: "Asahi Inventory",
	projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || "your-project-id",
	dataset: process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production",
	plugins: [structureTool()],
	schema: { types: schemaTypes },
});
