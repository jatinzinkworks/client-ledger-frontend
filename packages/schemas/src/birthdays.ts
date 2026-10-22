import type { ClientBirthdayResponse } from '@cl/api';

import { parseApiDate } from './companies';

// The Birthdays screen: clients whose birthday falls in a month (1 = January … 12 = December),
// starting at the current month. Copy is Title Case to match the mocks.

export const BIRTHDAYS_TITLE = 'Birthdays';

const longMonth = new Intl.DateTimeFormat('en-GB', { month: 'long' });
const shortMonth = new Intl.DateTimeFormat('en-GB', { month: 'short' });

/** The month of `now`, 1 to 12. */
export const currentMonth = (now = new Date()) => now.getMonth() + 1;

/** "July" for 7. */
export const monthName = (month: number) => longMonth.format(new Date(2000, month - 1, 1));

/** The month `delta` months on from `month`, wrapping December → January and back. */
export const shiftMonth = (month: number, delta: number) => ((((month - 1 + delta) % 12) + 12) % 12) + 1;

/** "3 Birthdays In July" / "1 Birthday In July". */
export const birthdaysEyebrow = (count: number, month: number) =>
  `${count} ${count === 1 ? 'Birthday' : 'Birthdays'} In ${monthName(month)}`;

/** The empty state for a month with no birthdays. */
export const noBirthdaysTitle = (month: number) => `No Birthdays In ${monthName(month)}`;

export const NO_BIRTHDAYS_HINT = "Add A Birthday On Onboard Client Or Edit Client To See It Here.";

/** "Jul": the short month on a card's date tile. */
export const birthdayMonthShort = (birthday: string | undefined) => {
  const date = parseApiDate(birthday);
  return date ? shortMonth.format(date) : '';
};

/** "Turns 41" in `year` (default this year); empty when the birth year is unknown. */
export function turningAgeLabel(birthday: string | undefined, year = new Date().getFullYear()): string {
  const date = parseApiDate(birthday);
  const age = date ? year - date.getFullYear() : 0;
  return age > 0 ? `Turns ${age}` : '';
}

/** Whether the client's birthday is today, whatever the year they were born. */
export function isBirthdayToday(birthday: string | undefined, now = new Date()): boolean {
  const date = parseApiDate(birthday);
  return !!date && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export const BIRTHDAY_TODAY_LABEL = 'Today';

/** A card's accessible summary: "Rohan Mehta, Birthday 23 Jul, Turns 41". */
export const birthdayCardLabel = (b: ClientBirthdayResponse, name: string) =>
  [name, `Birthday ${b.dayOfMonth ?? ''} ${birthdayMonthShort(b.birthday)}`.trim(), turningAgeLabel(b.birthday)]
    .filter(Boolean)
    .join(', ');
