import type { Actor } from '@/core/auth/policy';
import { withRoute, type RouteHandler } from '@/core/http/with-route';
import type { Result } from '@/core/result';
import { createEntryInput, type CreateEntryInput } from '@/modules/directory';

export type DirectoryPostDeps = {
  resolveActor: () => Promise<Actor | null>;
  create: (
    actor: Actor,
    input: CreateEntryInput,
  ) => Promise<Result<{ id: string }>>;
};

export function createDirectoryPostRoute(deps: DirectoryPostDeps): RouteHandler {
  return withRoute(
    {
      operation: 'directory.create',
      schema: createEntryInput,
      resolveActor: deps.resolveActor,
      rateLimit: { limit: 30, windowMs: 60_000 },
    },
    async (input, { actor }) => deps.create(actor, input),
  );
}
