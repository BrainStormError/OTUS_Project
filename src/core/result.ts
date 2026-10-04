export type Ok<T> = { ok: true; value: T };

export type ErrCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export type Err = { ok: false; code: ErrCode; message: string };

export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

export const err = (code: ErrCode, message: string): Err => ({
  ok: false,
  code,
  message,
});

export const isOk = <T>(result: Result<T>): result is Ok<T> => result.ok;
export const isErr = <T>(result: Result<T>): result is Err => !result.ok;
