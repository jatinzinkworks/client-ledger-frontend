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

// springdoc emits `defaultValue = "18.00"` on BigDecimal fields as a *string* default on a
// number schema, which orval turns into `.default(\`18.00\`)` on a zod number — a type error.
// Coerce such defaults to numbers, loudly, until the backend declares them numerically.
for (const [schemaName, schema] of Object.entries(spec.components?.schemas ?? {})) {
  for (const [prop, def] of Object.entries(schema.properties ?? {})) {
    const numeric = def.type === 'number' || def.type === 'integer';
    if (numeric && typeof def.default === 'string' && def.default.trim() !== '' && !Number.isNaN(Number(def.default))) {
      def.default = Number(def.default);
      console.warn(`warning: coerced string default of ${schemaName}.${prop} to number ${def.default}`);
    }
  }
}

writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`wrote ${out} (${Object.keys(spec.paths ?? {}).length} paths) from ${url}`);
