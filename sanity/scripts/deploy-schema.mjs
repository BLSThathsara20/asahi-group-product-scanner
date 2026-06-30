import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env");

function loadEnvFile(path) {
	try {
		const content = readFileSync(path, "utf8");
		const env = {};
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const i = trimmed.indexOf("=");
			if (i === -1) continue;
			env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
		}
		return env;
	} catch {
		return {};
	}
}

const rootEnv = loadEnvFile(envPath);
const token =
	process.env.SANITY_AUTH_TOKEN ||
	rootEnv.SANITY_AUTH_TOKEN ||
	rootEnv.VITE_SANITY_TOKEN;

if (!token) {
	console.error(
		"Missing SANITY_AUTH_TOKEN. Add VITE_SANITY_TOKEN to ../.env or export SANITY_AUTH_TOKEN."
	);
	process.exit(1);
}

const env = {
	...process.env,
	SANITY_AUTH_TOKEN: token,
	SANITY_STUDIO_PROJECT_ID:
		process.env.SANITY_STUDIO_PROJECT_ID ||
		rootEnv.SANITY_STUDIO_PROJECT_ID ||
		rootEnv.VITE_SANITY_PROJECT_ID,
	SANITY_STUDIO_DATASET:
		process.env.SANITY_STUDIO_DATASET ||
		rootEnv.SANITY_STUDIO_DATASET ||
		rootEnv.VITE_SANITY_DATASET,
};

const result = spawnSync("npx", ["sanity", "schema", "deploy"], {
	stdio: "inherit",
	env,
	cwd: resolve(__dirname, ".."),
	shell: true,
});

process.exit(result.status ?? 1);
