import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { envSchema, parseEnv } from '../src/core/config/env';

const examplePath = resolve(process.cwd(), '.env.example');
const content = readFileSync(examplePath, 'utf8');

const exampleKeys = content
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'))
  .map((line) => line.split('=')[0]?.trim() ?? '')
  .filter((key) => key.length > 0);

const schemaKeys = Object.keys(envSchema.shape);

const missing = schemaKeys.filter((key) => !exampleKeys.includes(key));
if (missing.length > 0) {
  throw new Error(`.env.example is missing variables: ${missing.join(', ')}`);
}

const dummy: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  APP_ORIGIN: 'http://localhost:3000',
  SESSION_SECRET: 'dummy-session-secret-0123456789abcdef',
  REGISTRATION_TICKET_SECRET: 'dummy-ticket-secret-0123456789abcdef',
  OAUTH_CLIENT_ID: 'dummy-client-id',
  OAUTH_CLIENT_SECRET: 'dummy-client-secret',
  TMDB_ACCESS_TOKEN: 'dummy-tmdb-token',
  TRUSTED_PROXIES: '127.0.0.1',
  DEMO_LOGIN: '0',
  LOG_LEVEL: 'info',
};

parseEnv(dummy);

console.log('Environment schema matches .env.example and parses dummy values.');
