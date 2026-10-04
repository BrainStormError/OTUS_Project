-- Up Migration
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL,
  name              text,
  role              text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  provider          text,
  provider_subject  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_subject_key ON users (provider, provider_subject);

-- Down Migration
DROP TABLE IF EXISTS users;
