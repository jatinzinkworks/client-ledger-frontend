import { defineConfig } from 'orval';

// Generates from the committed openapi.json snapshot (refresh it with `pnpm api:fetch-spec`).
// Output under src/generated/ is overwritten on every run — never edit it by hand.
export default defineConfig({
  client: {
    input: { target: './openapi.json' },
    output: {
      target: './src/generated/endpoints.ts',
      schemas: './src/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: { path: './src/fetcher.ts', name: 'apiFetch' },
        // Hooks resolve to the response body and throw ApiError on non-2xx, rather than
        // returning a { data, status } union the caller has to narrow.
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
  zod: {
    input: { target: './openapi.json' },
    output: {
      target: './src/generated/zod.ts',
      client: 'zod',
      mode: 'single',
    },
  },
});
