import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
	maxSizeMB: 0.5,
	maxWidthOrHeight: 1200,
	useWebWorker: true,
	initialQuality: 0.8,
};

const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

function getImgbbApiKey() {
	const key = import.meta.env.VITE_IMGBB_API_KEY;
	if (!key) {
		throw new Error(
			"ImgBB API key missing. Add VITE_IMGBB_API_KEY to your .env file."
		);
	}
	return key;
}

/** Convert File/Blob to base64 string (no data-URI prefix). */
function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("Failed to read image"));
				return;
			}
			const base64 = result.includes(",") ? result.split(",")[1] : result;
			resolve(base64);
		};
		reader.onerror = () => reject(new Error("Failed to read image"));
		reader.readAsDataURL(file);
	});
}

/**
 * Compress image, upload to ImgBB, return public URL.
 * https://api.imgbb.com/
 */
export async function compressAndUploadImage(file) {
	if (!file || !file.type?.startsWith("image/")) return null;

	const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
	const base64 = await fileToBase64(compressed);

	const body = new URLSearchParams();
	body.append("key", getImgbbApiKey());
	body.append("image", base64);
	body.append("name", file.name || `item-${Date.now()}`);

	const res = await fetch(IMGBB_UPLOAD_URL, {
		method: "POST",
		body,
	});

	const json = await res.json().catch(() => ({}));

	if (!res.ok || !json?.success) {
		const msg =
			json?.error?.message ||
			json?.status_txt ||
			`ImgBB upload failed (${res.status})`;
		throw new Error(msg);
	}

	return json.data?.url || json.data?.display_url || json.data?.image?.url || null;
}
