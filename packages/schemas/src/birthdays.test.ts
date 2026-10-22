import { describe, expect, it } from 'vitest';

import {
  birthdayCardLabel,
  birthdayMonthShort,
  birthdaysEyebrow,
  currentMonth,
  isBirthdayToday,
  monthName,
  noBirthdaysTitle,
  shiftMonth,
  turningAgeLabel,
} from './birthdays';

describe('months', () => {
  it('starts at the current month and names it', () => {
    expect(currentMonth(new Date(2026, 9, 22))).toBe(10);
    expect(monthName(7)).toBe('July');
  });

  it('steps between months, wrapping at the year end', () => {
    expect(shiftMonth(7, 1)).toBe(8);
    expect(shiftMonth(12, 1)).toBe(1);
    expect(shiftMonth(1, -1)).toBe(12);
  });
});

describe('birthday copy', () => {
  it('counts the month', () => {
    expect(birthdaysEyebrow(1, 7)).toBe('1 Birthday In July');
    expect(birthdaysEyebrow(3, 7)).toBe('3 Birthdays In July');
    expect(noBirthdaysTitle(7)).toBe('No Birthdays In July');
  });

  it('shows the month and the age turned this year', () => {
    expect(birthdayMonthShort('1985-07-23')).toBe('Jul');
    expect(turningAgeLabel('1985-07-23', 2026)).toBe('Turns 41');
    expect(turningAgeLabel(undefined, 2026)).toBe('');
  });

  it('knows a birthday that is today, whatever the year', () => {
    expect(isBirthdayToday('1985-10-22', new Date(2026, 9, 22))).toBe(true);
    expect(isBirthdayToday('1985-10-23', new Date(2026, 9, 22))).toBe(false);
  });

  it('summarises a card for screen readers', () => {
    expect(birthdayCardLabel({ birthday: '1985-07-23', dayOfMonth: 23 }, 'Rohan Mehta')).toMatch(/^Rohan Mehta, Birthday 23 Jul, Turns \d+$/);
  });
});
