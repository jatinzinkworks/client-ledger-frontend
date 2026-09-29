// Refreshes openapi.json from a running backend. The snapshot is committed so that
// `pnpm api:generate` (and CI) never needs the backend up; run this, then regenerate,
// whenever the backend contract changes.
//
//   pnpm api:fetch-spec                                   # http://localhost:8080
//   API_SPEC_URL=https://dev.example/v3/api-docs pnpm api:fetch-spec
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const url = process.env.API_SPEC_URL ?? 'http://localhost:8080/v3/api-docs';
const out = fileURLToPath(new URL('../openapi.json', import.meta.url));

const res = await fetch(url);
if (!res.ok) {
  console.error(`GET ${url} → ${res.status} ${res.statusText}`);
  process.exit(1);
}
const spec = await res.json();

// springdoc emits `in` on HTTP bearer schemes (OpenApiConfig sets `in = HEADER`), but OpenAPI
// only allows it on apiKey schemes and orval rejects the spec. Strip it here, loudly, until the
// backend drops it — then this block becomes a no-op.
for (const [name, scheme] of Object.entries(spec.components?.securitySchemes ?? {})) {
  if (scheme.type !== 'apiKey' && 'in' in scheme) {
    delete scheme.in;
    console.warn(`warning: removed invalid "in" from securitySchemes.${name} (type ${scheme.type})`);
  }
}

writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`wrote ${out} (${Object.keys(spec.paths ?? {}).length} paths) from ${url}`);
