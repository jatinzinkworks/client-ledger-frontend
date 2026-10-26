import { describe, expect, it } from 'vitest';

import { IDLE_TIMEOUT_MS, isIdle } from './auth';

describe('isIdle', () => {
  it('is not idle before the timeout', () => {
    expect(isIdle(0, IDLE_TIMEOUT_MS - 1)).toBe(false);
  });

  it('is idle at and after the timeout', () => {
    expect(isIdle(0, IDLE_TIMEOUT_MS)).toBe(true);
    expect(isIdle(0, IDLE_TIMEOUT_MS + 60_000)).toBe(true);
  });

  it('takes a custom timeout', () => {
    expect(isIdle(1_000, 2_000, 1_000)).toBe(true);
  });
});
