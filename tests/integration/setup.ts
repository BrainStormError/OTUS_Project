import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const URL_FILE = resolve(process.cwd(), 'tests/integration/.db-url.json');
const { databaseUrl } = JSON.parse(readFileSync(URL_FILE, 'utf8')) as {
  databaseUrl: string;
};

const env = process.env as Record<string, string>;
env.DATABASE_URL = databaseUrl;
env.NODE_ENV = 'test';
env.APP_ORIGIN = 'http://localhost:3000';
env.SESSION_SECRET = 'test-session-secret-0123456789abcdef';
env.REGISTRATION_TICKET_SECRET = 'test-ticket-secret-0123456789abcdef';
env.OAUTH_CLIENT_ID = 'test-client-id';
env.OAUTH_CLIENT_SECRET = 'test-client-secret';
env.DEMO_LOGIN = '0';
env.LOG_LEVEL = 'error';
