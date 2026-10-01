export interface ChangelogEntry {
  version: string
  /** Date and time including seconds, e.g. "19 Aug 2026, 19:10:42". */
  date: string
  highlights: string[]
}

/** User-facing changes across the web and mobile apps, newest first. */
export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '01 Oct 2026, 15:54:05',
    highlights: ['Services are now in the mobile app too: browse, search and filter the catalog, and add, edit or delete services.'],
  },
  {
    version: '0.1.0',
    date: '01 Oct 2026, 14:23:31',
    highlights: ['Fixed the Services page failing to load when the catalog contains an annual service.'],
  },
  {
    version: '0.1.0',
    date: '01 Oct 2026, 14:09:48',
    highlights: [
      'Added Services: browse the service catalog by name and category, and add, edit or delete services with their fees, GST and invoice schedules.',
    ],
  },
  {
    version: '0.1.0',
    date: '30 Sep 2026, 11:23:52',
    highlights: ['Firm Details can now be viewed and edited in the mobile app, under Settings.'],
  },
  {
    version: '0.1.0',
    date: '29 Sep 2026, 17:34:10',
    highlights: [
      'Added Firm Details to Settings — firm name, GSTIN, registration number, email, phone and address, as printed on invoices and exports. Save Settings now saves whichever sections you changed.',
    ],
  },
  {
    version: '0.1.0',
    date: '29 Sep 2026, 16:35:45',
    highlights: [
      'Mark Overdue After is now counted from the payment due date, so it no longer has to be longer than the payment due period.',
    ],
  },
  {
    version: '0.1.0',
    date: '29 Sep 2026, 16:00:17',
    highlights: [
      'Redesigned Settings and the sidebar to match the Zinkworks design: Payment Terms now shows a worked due-date example, a reminder picker, and page-level Save and Discard.',
    ],
  },
  {
    version: '0.1.0',
    date: '29 Sep 2026, 15:30:08',
    highlights: [
      'First release of the Client Ledger web and mobile apps, with light and dark themes and payment terms (invoicing, overdue and reminder rules) under Settings.',
    ],
  },
]
