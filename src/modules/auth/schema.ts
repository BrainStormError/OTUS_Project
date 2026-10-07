import { z } from 'zod';

export const demoLoginInput = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(200).optional(),
});

export type DemoLoginInput = z.infer<typeof demoLoginInput>;

export const registerInput = z.object({
  ticket: z.string().min(1).max(4096),
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(200),
});

export type RegisterInput = z.infer<typeof registerInput>;

export const privacyInput = z
  .object({
    profileHidden: z.boolean().optional(),
    statsHidden: z.boolean().optional(),
  })
  .refine(
    (value) => value.profileHidden !== undefined || value.statsHidden !== undefined,
    { message: 'At least one privacy field is required' },
  );

export type PrivacyInput = z.infer<typeof privacyInput>;
