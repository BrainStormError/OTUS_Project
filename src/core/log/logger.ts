import { env } from '@/core/config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY = /secret|session|token|ticket|password|credential/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

const REDACTED = '[REDACTED]';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(CONTROL_CHARS, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeFields(value as Record<string, unknown>);
  }
  return value;
}

export function sanitizeFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    output[key] = SENSITIVE_KEY.test(key) ? REDACTED : sanitizeValue(value);
  }
  return output;
}

function threshold(): number {
  return LEVEL_WEIGHT[env.LOG_LEVEL];
}

export function log(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): void {
  if (LEVEL_WEIGHT[level] < threshold()) {
    return;
  }
  const entry = {
    level,
    event,
    at: new Date().toISOString(),
    ...sanitizeFields(fields),
  };
  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}
