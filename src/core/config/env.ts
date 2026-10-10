import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  APP_ORIGIN: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  REGISTRATION_TICKET_SECRET: z.string().min(32),
  OAUTH_CLIENT_ID: z.string().min(1),
  OAUTH_CLIENT_SECRET: z.string().min(1),
  TMDB_ACCESS_TOKEN: z.string().min(1),
  DEMO_LOGIN: z.enum(['0', '1']).default('0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const names = Array.from(
      new Set(parsed.error.issues.map((issue) => issue.path.join('.') || '(root)')),
    );
    throw new Error(
      `Configuration error: invalid or missing variables: ${names.join(', ')}`,
    );
  }
  return parsed.data;
}

export function readNodeEnv(): string | undefined {
  return process.env.NODE_ENV;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv === null) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, property) {
    return getEnv()[property as keyof Env];
  },
  has(_target, property) {
    return property in getEnv();
  },
  ownKeys() {
    return Reflect.ownKeys(getEnv());
  },
  getOwnPropertyDescriptor(_target, property) {
    return {
      enumerable: true,
      configurable: true,
      value: getEnv()[property as keyof Env],
    };
  },
});
