import { cache } from 'react';

import type { Actor } from '@/core/auth/policy';

import { auth } from './auth';
import { resolveActor } from './actor';

export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth();
  return resolveActor(session?.user?.id);
});
