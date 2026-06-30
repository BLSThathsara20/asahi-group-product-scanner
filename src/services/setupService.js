import { hasSuperAdmin } from "./userService";

/**
 * Returns true if a super_admin already exists. Used to hide setup link on Login.
 */
export async function isSetupComplete() {
	try {
		return await hasSuperAdmin();
	} catch {
		return true;
	}
}
