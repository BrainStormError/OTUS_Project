import { findOrCreateDemoUser } from './repository';
import { demoLoginInput } from './schema';

export async function authorizeDemoUser(credentials: unknown) {
  const parsed = demoLoginInput.safeParse(credentials);
  if (!parsed.success) {
    return null;
  }
  const user = await findOrCreateDemoUser(parsed.data.email, parsed.data.name);
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
  };
}
