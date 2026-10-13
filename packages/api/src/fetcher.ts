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

async function send(url: string, init: RequestInit, accept: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept', accept);
  for (const [name, value] of Object.entries((await config.getHeaders?.()) ?? {})) {
    headers.set(name, value);
  }
  return fetch(`${config.baseUrl}${url}`, {
    ...init,
    headers,
    credentials: config.credentials ?? init.credentials,
  });
}

function toApiError(status: number, body: unknown): ApiError {
  const error = body as ErrorResponse | undefined;
  return new ApiError(status, error, error?.message);
}

/** The orval mutator: every generated request goes through here. */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await send(url, init, 'application/json');
  const body = parseBody(await res.text());
  if (!res.ok) throw toApiError(res.status, body);
  return body as T;
}

/**
 * The file name in a `Content-Disposition` header: the RFC 5987 `filename*=UTF-8''…` form when
 * present, else the plain `filename="…"`; undefined when there is none.
 */
export function fileNameFrom(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) return undefined;
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(contentDisposition)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim());
    } catch {
      // Malformed escapes: fall back to the plain form.
    }
  }
  const plain = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/.exec(contentDisposition);
  return (plain?.[1] ?? plain?.[2])?.trim() || undefined;
}

/** A file the backend sent as an attachment. */
export interface DownloadedFile {
  blob: Blob;
  /** From `Content-Disposition`; undefined when the backend did not name it. */
  fileName?: string;
}

/**
 * Downloads a binary response (an export) — `apiFetch` parses JSON, so generated hooks for file
 * endpoints cannot be used; build the URL with the generated `get…Url` and fetch it here.
 * Errors still arrive as the backend's JSON and throw `ApiError`.
 */
export async function apiDownload(url: string, accept = '*/*'): Promise<DownloadedFile> {
  const res = await send(url, { method: 'GET' }, `${accept}, application/json`);
  if (!res.ok) throw toApiError(res.status, parseBody(await res.text()));
  return { blob: await res.blob(), fileName: fileNameFrom(res.headers.get('Content-Disposition')) };
}
