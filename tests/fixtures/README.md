# Test fixtures

Fixtures back the backend's suites, split by intent:

- `tests/unit/` — pure logic (models, decoders, catalog, mapper) with no filesystem/network/container access.
- `tests/contract/` — HTTP contract tests against `contracts/openapi.json`, using injected fake stage services.
- `tests/integration/` — real filesystem/archive/sandbox behavior (store, archive security, sandbox isolation).
- `tests/generated-project/` — real end-to-end profile admission and six-gate validation against a generated Angular app.

## Fixture apps

`react-supported/` and `angular-supported/` (added in T019) are complete miniature applications used as
migration inputs, paired with `expected-inventory.json` describing the analyzer/mapper/generator outcome
that later tasks must reproduce exactly.

## Running a focused test

```sh
npx vitest run tests/unit/catalog.test.ts
npx vitest run tests/contract/migration-api.test.ts
npx vitest run tests/integration/archive-security.test.ts -t "path traversal"
```

`npm test` runs the full suite and reports failures; it never skips an unavailable
integration/container suite as a pass. Suites that require Docker or the admitted
Angular profile fail loudly (with the missing prerequisite named) rather than being
silently marked green.
