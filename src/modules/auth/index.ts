export { handlers, auth, signIn, signOut } from './auth';
export {
  buildSessionCookieConfig,
  buildSessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from './session-cookie';
export { getActor } from './session';
export { resolveActor } from './actor';
export { authorizeDemoUser } from './demo';
export { getPrivacy, updatePrivacy } from './privacy';
export type { PrivacyFlags } from './privacy';
export { registerInput, demoLoginInput, privacyInput } from './schema';
export type { RegisterInput, DemoLoginInput, PrivacyInput } from './schema';
export { issueTicket, verifyTicket, DEFAULT_TICKET_TTL_SECONDS } from './ticket';
export type { TicketPayload } from './ticket';
export type { Actor, Role, UserRow } from './types';
