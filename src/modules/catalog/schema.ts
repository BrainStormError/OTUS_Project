import { z } from 'zod';

export const catalogKinds = ['film', 'series'] as const;

export const catalogSearchQuery = z.object({
  kind: z.enum(catalogKinds),
  q: z.string().trim().max(200).optional(),
  genre: z.string().trim().max(200).optional(),
  year: z.coerce.number().int().min(1800).max(2200).optional(),
});

export type CatalogSearchQuery = z.infer<typeof catalogSearchQuery>;

export const catalogDetailQuery = z.object({
  kind: z.enum(catalogKinds),
  id: z.string().trim().min(1).max(128),
});

export type CatalogDetailQuery = z.infer<typeof catalogDetailQuery>;
