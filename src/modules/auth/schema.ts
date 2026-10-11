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

export const RESERVED_HANDLES = ['admin', 'root'] as const;

export const identityUpdateInput = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    handle: z
      .string()
      .trim()
      .regex(/^[a-z0-9_-]{1,50}$/, 'Тэг: только строчные латинские буквы, цифры, «_» и «-»')
      .refine(
        (value) => !RESERVED_HANDLES.includes(value as (typeof RESERVED_HANDLES)[number]),
        { message: 'Этот тэг зарезервирован' },
      )
      .optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.handle !== undefined,
    { message: 'Укажите имя или тэг' },
  );

export type IdentityUpdateInput = z.infer<typeof identityUpdateInput>;
