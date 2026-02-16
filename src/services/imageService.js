import imageCompression from "browser-image-compression";
import { supabase } from "../lib/supabase";

const COMPRESSION_OPTIONS = {
	maxSizeMB: 0.5,
	maxWidthOrHeight: 1200,
	useWebWorker: true,
	initialQuality: 0.8,
};

/**
 * Compress image for performance, then upload to Supabase Storage.
 * Returns public URL. No base64 - uses File upload.
 */
export async function compressAndUploadImage(file) {
	if (!file || !file.type?.startsWith("image/")) return null;

	const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
	const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
	const path = `items/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

	const { data, error } = await supabase.storage
		.from("item-photos")
		.upload(path, compressed, { cacheControl: "3600", upsert: false });

	if (error) {
		console.warn("Image upload failed:", error.message);
		return null;
	}

	const { data: urlData } = supabase.storage
		.from("item-photos")
		.getPublicUrl(data.path);
	return urlData.publicUrl;
}
