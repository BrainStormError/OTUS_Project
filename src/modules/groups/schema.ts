import { z } from 'zod';

export const joinGroupInput = z.object({
  groupId: z.string().uuid(),
});

export type JoinGroupInput = z.infer<typeof joinGroupInput>;
