import { ApiError } from './fetcher';
import type { ErrorResponse } from './generated/model';

/** A user-presentable message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/** The backend's field-level validation failures, keyed by field name. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const body = error.body as ErrorResponse | undefined;
  return Object.fromEntries(
    (body?.errors ?? [])
      .filter((e): e is { field: string; message: string } => !!e.field && !!e.message)
      .map((e) => [e.field, e.message]),
  );
}

/** True when the resource simply does not exist yet (e.g. payment terms before first save). */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
