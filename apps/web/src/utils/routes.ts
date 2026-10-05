// Links to detail pages. Ids are URL-encoded, as every path param must be.

export const clientPath = (clientId: string) => `/clients/${encodeURIComponent(clientId)}`

export const companyPath = (clientId: string, companyId: string) =>
  `${clientPath(clientId)}/companies/${encodeURIComponent(companyId)}`
