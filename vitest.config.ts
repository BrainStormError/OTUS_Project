import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      APP_ORIGIN: 'http://localhost:3000',
      SESSION_SECRET: 'test-session-secret-0123456789abcdef',
      REGISTRATION_TICKET_SECRET: 'test-ticket-secret-0123456789abcdef',
      OAUTH_CLIENT_ID: 'test-client-id',
      OAUTH_CLIENT_SECRET: 'test-client-secret',
      TMDB_ACCESS_TOKEN: 'test-tmdb-token',
      DEMO_LOGIN: '0',
      LOG_LEVEL: 'info',
    },
  },
});
