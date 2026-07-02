const SAFE_PATH = /^\/(?!\/)/;

export function getAppLoginUrl() {
  if (typeof window === 'undefined') return '/login';
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, '');
  return `${base}/login`;
}

export function inventoryPathForShareId(shareId) {
  if (!shareId) return null;
  return `/inventory/${shareId}`;
}

export function loginPathWithRedirect(redirectPath) {
  if (!redirectPath || !SAFE_PATH.test(redirectPath)) return '/login';
  return `/login?redirect=${encodeURIComponent(redirectPath)}`;
}

export function rememberShareRedirect(shareId) {
  if (typeof sessionStorage === 'undefined' || !shareId) return;
  const path = inventoryPathForShareId(shareId);
  if (path) sessionStorage.setItem('postLoginRedirect', path);
}

export function resolvePostLoginPath(location, searchParams) {
  const queryRedirect = searchParams?.get?.('redirect');
  if (queryRedirect && SAFE_PATH.test(queryRedirect)) {
    return queryRedirect;
  }

  const from = location?.state?.from;
  if (from?.pathname && from.pathname !== '/login') {
    return `${from.pathname}${from.search || ''}`;
  }

  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem('postLoginRedirect');
    if (stored && SAFE_PATH.test(stored)) return stored;
  }

  return '/';
}

export function clearPostLoginRedirect() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('postLoginRedirect');
  }
}
