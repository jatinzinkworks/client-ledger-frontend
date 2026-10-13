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
    date: '13 Oct 2026, 14:52:51',
    highlights: ["On a company page the Services section starts collapsed, showing its count; click its heading to open it. The Services and Ledger headings are more compact."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 14:48:30',
    highlights: ["A client's Companies table shows each company's Billed, Received and Pending for the selected financial year, with a status: Overdue, Settled or In Credit."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 14:45:28',
    highlights: [
      'Client and company pages now wait for the latest data instead of briefly showing an older copy.',
      "Client and company page buttons sit to the right of the name; on the client page they read Refresh, Edit Client, Record Payment, Add Company.",
    ],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 14:42:26',
    highlights: ["Payments can now be edited: open one from the company's ledger to change its amount, date, method, reference or comment. Edit panels open without jumping into the first field."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 14:29:19',
    highlights: ["Client pages show the selected financial year's Billed, Received, Pending and Discount across all of the client's companies."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 14:24:25',
    highlights: ["Company pages show the selected financial year's Billed, Received, Pending, Last Payment and Discount at the top."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 13:52:16',
    highlights: ["A Financial Year picker in the sidebar (the current Indian financial year and the four before it) filters each company's ledger; it starts at the current year."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 13:47:43',
    highlights: [
      "Payments can now be recorded from a company's page or its client's page, showing what the company still owes; they appear in the company's ledger.",
      'Ledger entries can be corrected (fee, discount and GST rate) or deleted; payments can be deleted.',
    ],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 13:25:59',
    highlights: ["Company pages have a Record Payment panel for the amount, date, method, reference and comment."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 13:15:16',
    highlights: ["Each company page now has a Ledger: Generate Service Entries bills the services that are due, and the entries are listed 20 per page."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 11:18:31',
    highlights: ['The Managers list now shows how many clients each manager looks after, and Edit Manager shows it too.'],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 11:08:31',
    highlights: ['Service cards now show a pointer cursor on hover, and their company count and billing schedule are easier to read.'],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 10:45:29',
    highlights: ["Adding, editing and listing a company's services now shows the GST amount and the total with GST, and the due dates show the total per invoice."],
  },
  {
    version: '0.1.0',
    date: '13 Oct 2026, 10:42:47',
    highlights: ["A company's services list now shows each service's GST rate."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 18:36:56',
    highlights: ["A client's companies list now shows how many services each company has; a company with services can't be deleted until they are removed."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 18:18:35',
    highlights: ["A company's services can now be deleted, from the services list or the Edit Service panel, after confirming."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 18:16:43',
    highlights: ['The upcoming due dates in the service panels now look like read-only information rather than input fields.'],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 18:10:57',
    highlights: ["A company's services can now be edited from its page: change the delivery date, discount or note of a service."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:59:28',
    highlights: ["A company's services list now shows each service's net charge after its discount."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:53:23',
    highlights: ["A company's services list now shows each service's fee."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:49:34',
    highlights: ["A company's services list now shows the billing cycle, delivery date and next due date in their own columns."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:43:46',
    highlights: ["Add Service now previews the service's next 5 due dates from the delivery date, each with its net charge."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:34:28',
    highlights: ["Add Service now shows the chosen service's billing cycle as a label beside its standard fee."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:32:19',
    highlights: ['Help and error text under form fields is larger and easier to read.'],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:29:12',
    highlights: ["Add Company on a client's page is now a primary button, matching Onboard Client and Add Service."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:25:26',
    highlights: [
      "Services from the catalog can now be added to a company, with the delivery date, an optional discount and a note, showing the net charge before saving. Companies can also be deleted from the Edit Company panel.",
    ],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:13:39',
    highlights: ["A company's name, type, address and discount can now be edited from its page."],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:11:09',
    highlights: [
      "Companies can now have their own discount when onboarding a client or adding a company; left blank, a company takes the client's discount.",
    ],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 17:04:37',
    highlights: [
      "Companies can now be added to an existing client and deleted from the client's page, after confirming.",
    ],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 16:56:18',
    highlights: [
      'Clients can now be deleted from Edit Client, after confirming a warning that their companies go too.',
      'Every page now uses the full width of the window instead of a narrow centred column, and delete confirmations show a red button.',
    ],
  },
  {
    version: '0.1.0',
    date: '11 Oct 2026, 16:51:22',
    highlights: [
      "Clients can now be edited from their page: name, phone, email, assigned manager and discount. Their companies are left as they are.",
    ],
  },
  {
    version: '0.1.0',
    date: '05 Oct 2026, 13:17:53',
    highlights: [
      "Clicking a company on a client's page now opens the company, showing its type, discount, address and the services recorded for it.",
    ],
  },
  {
    version: '0.1.0',
    date: '05 Oct 2026, 13:12:55',
    highlights: [
      "Clicking a client now opens their page with contact details, manager, discount and companies, and the client list can be filtered by manager.",
    ],
  },
  {
    version: '0.1.0',
    date: '05 Oct 2026, 12:24:54',
    highlights: [
      'Added a Refresh button to Clients, Managers, Services and Settings to reload the latest data. On Settings it waits until unsaved changes are saved or discarded.',
    ],
  },
  {
    version: '0.1.0',
    date: '05 Oct 2026, 12:23:12',
    highlights: [
      'Onboarding a client can now record an optional discount, and Onboard Client stays disabled until every required field and at least one company are filled in.',
    ],
  },
  {
    version: '0.1.0',
    date: '05 Oct 2026, 12:19:00',
    highlights: [
      'Added Clients: see every client with their companies and manager, search by client or company, and onboard a new client with one or more companies.',
    ],
  },
  {
    version: '0.1.0',
    date: '05 Oct 2026, 11:42:43',
    highlights: [
      'Fixed Save Settings doing nothing when only one section (Payment Terms or Firm Details) had changes; the "Settings Saved" confirmation now appears straight away.',
    ],
  },
  {
    version: '0.1.0',
    date: '01 Oct 2026, 18:52:49',
    highlights: [
      'Managers are now in the mobile app too, and in both apps they are listed by name from A to Z and sit right after Overview in the menu.',
    ],
  },
  {
    version: '0.1.0',
    date: '01 Oct 2026, 18:23:37',
    highlights: ['Added Managers: see your team with their roles and phone numbers, and add, edit or remove managers.'],
  },
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
