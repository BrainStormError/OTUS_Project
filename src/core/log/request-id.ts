export const REQUEST_ID_HEADER = 'x-request-id';

const MAX_LENGTH = 128;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

function sanitize(value: string): string {
  return value.replace(CONTROL_CHARS, '').trim().slice(0, MAX_LENGTH);
}

export function getRequestId(request: Request): string {
  const incoming = request.headers.get(REQUEST_ID_HEADER);
  if (incoming) {
    const cleaned = sanitize(incoming);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }
  return crypto.randomUUID();
}
