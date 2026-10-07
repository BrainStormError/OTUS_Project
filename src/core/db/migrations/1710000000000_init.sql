-- Up Migration
-- Compact baseline. The schema no longer depends on extensions (no pgcrypto);
-- identifiers are numeric identity columns. This migration intentionally
-- creates nothing so that reversibility and ordering stay simple.

-- Down Migration
