export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function buildSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function buildSessionCookieConfig(secure: boolean) {
  return {
    name: secure ? '__Secure-authjs.session-token' : 'authjs.session-token',
    options: buildSessionCookieOptions(secure),
  };
}
