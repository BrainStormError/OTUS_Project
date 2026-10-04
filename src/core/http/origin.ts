function normalize(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(request: Request, allowedOrigin: string): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');

  if (fetchSite === 'same-origin') {
    return true;
  }

  if (!origin) {
    return false;
  }

  const normalizedOrigin = normalize(origin);
  const normalizedAllowed = normalize(allowedOrigin);
  if (!normalizedOrigin || !normalizedAllowed) {
    return false;
  }

  return normalizedOrigin === normalizedAllowed;
}
