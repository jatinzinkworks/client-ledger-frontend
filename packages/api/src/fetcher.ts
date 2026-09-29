import type { ErrorResponse } from './generated/model';

export interface ApiConfig {
  /** Backend origin, e.g. `http://localhost:8080`. Empty string = same origin (web only). */
  baseUrl: string;
  /** Extra headers per request — the hook for attaching an auth token later. */
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Forwarded to fetch; web behind IAP needs `include` to send the session cookie. */
  credentials?: RequestCredentials;
}

let config: ApiConfig = { baseUrl: '' };

/** Called once at app start-up by each app, with its own env-derived settings. */
export function configureApi(next: ApiConfig): void {
  config = { ...next, baseUrl: next.baseUrl.replace(/\/+$/, '') };
}

/** Thrown for every non-2xx response; `body` is the backend's standard error payload. */
export class ApiError<TBody = ErrorResponse> extends Error {
  readonly status: number;
  readonly body?: TBody;

  constructor(status: number, body?: TBody, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Read by orval: generated hooks type their `error` as this rather than the raw payload. */
export type ErrorType<TBody> = ApiError<TBody>;

function parseBody(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** The orval mutator: every generated request goes through here. */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  for (const [name, value] of Object.entries((await config.getHeaders?.()) ?? {})) {
    headers.set(name, value);
  }

  const res = await fetch(`${config.baseUrl}${url}`, {
    ...init,
    headers,
    credentials: config.credentials ?? init.credentials,
  });
  const body = parseBody(await res.text());

  if (!res.ok) {
    const error = body as ErrorResponse | undefined;
    throw new ApiError(res.status, error, error?.message);
  }
  return body as T;
}
