const SESSION_KEY = "asahi_auth_session";

export function getStoredSession() {
	try {
		const raw = localStorage.getItem(SESSION_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function setStoredSession(session) {
	if (session) {
		localStorage.setItem(SESSION_KEY, JSON.stringify(session));
	} else {
		localStorage.removeItem(SESSION_KEY);
	}
}
