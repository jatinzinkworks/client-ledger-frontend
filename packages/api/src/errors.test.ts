import { describe, expect, it } from 'vitest';

import { errorMessage, fieldErrors, isNotFound } from './errors';
import { ApiError } from './fetcher';

const validationError = new ApiError(
  400,
  {
    status: 400,
    code: 'VALIDATION_FAILED',
    message: 'One or more fields are invalid',
    errors: [
      { field: 'markOverdueAfterDays', message: 'must be at least 1 day' },
      { field: undefined, message: 'dropped: no field' },
    ],
  },
  'One or more fields are invalid',
);

describe('errors', () => {
  it('uses the backend message when there is one', () => {
    expect(errorMessage(validationError)).toBe('One or more fields are invalid');
    expect(errorMessage(new ApiError(502))).toBe('Request failed with status 502');
    expect(errorMessage('nope')).toBe('Something went wrong');
  });

  it('maps field errors by name and skips entries without a field', () => {
    expect(fieldErrors(validationError)).toEqual({ markOverdueAfterDays: 'must be at least 1 day' });
    expect(fieldErrors(new Error('x'))).toEqual({});
  });

  it('recognises a 404', () => {
    expect(isNotFound(new ApiError(404))).toBe(true);
    expect(isNotFound(validationError)).toBe(false);
  });
});
