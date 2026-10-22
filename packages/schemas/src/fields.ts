import { z } from 'zod';

// Field builders shared by the form schemas. Copy is Title Case to match the mocks.

export const tooLong = (max: number) => `Must Not Exceed ${max} Characters.`;

/**
 * A mandatory trimmed string. `abort` stops at "required" for a blank field, so pattern /
 * email checks chained after it don't add a second, misleading message.
 */
export const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, { message, abort: true }).max(max, tooLong(max));

/** A mandatory email address. */
export const requiredEmail = (max: number) =>
  requiredText(max, 'Enter The Email Address.').pipe(z.email('Enter A Valid Email Address.'));

/** An optional email address: blank means "not set", anything else must be valid. */
export const optionalEmail = (max: number) =>
  z
    .string()
    .trim()
    .max(max, tooLong(max))
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter A Valid Email Address.');

/** A mandatory phone number matching the backend's `^[+]?[0-9 ()-]{min,max}$` pattern. */
export const requiredPhone = (max: number, pattern: RegExp, message = 'Enter The Phone Number.') =>
  requiredText(max, message).regex(pattern, `Use 6 To ${max} Digits, Spaces, Brackets Or Hyphens, With An Optional Leading +.`);

/** Blank text fields mean "not set"; everything else must be a finite number. */
export const blankToUndefined = (v: unknown) =>
  v === '' || v == null ? undefined : typeof v === 'string' ? Number(v) : v;

export const hasAtMostTwoDecimals = (n: number) => Math.round(n * 100) === n * 100;

/** An optional percentage from 0 to `max` with up to 2 decimals; blank means "not set". */
export const optionalPercent = (max: number, message = `Enter A Percentage From 0 To ${max}.`) =>
  z.preprocess(
    blankToUndefined,
    z
      .number({ error: message })
      .min(0, message)
      .max(max, message)
      .refine(hasAtMostTwoDecimals, 'Use At Most 2 Decimal Places.')
      .optional(),
  );
