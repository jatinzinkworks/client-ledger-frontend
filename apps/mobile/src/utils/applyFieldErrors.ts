import { fieldErrors } from '@cl/api';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/** Shows the backend's field-level rejections next to the fields they belong to. */
export function applyFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): void {
  for (const [field, message] of Object.entries(fieldErrors(error))) {
    setError(field as Path<T>, { message });
  }
}
