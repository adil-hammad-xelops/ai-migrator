# Quickstart validation guide

This is the execution guide for the planned implementation. Commands below become available
when its package scripts, profile tooling and fixtures are implemented; no build has yet run.

## Prerequisites and setup

Use the pinned Node/TypeScript versions in [plan.md](plan.md), a Linux container engine
(including on Windows), and access to the verified Xelops registry. Keep credentials outside
the repository, reports and containers used for builds/tests. Copy the authorized catalog
unchanged to `src/catalog/xelops-components.json`; verify its hash against the specification.

Resolve and commit compatible exact dependency versions and integrity-bearing lockfiles.
The target profile admission script must verify actual package exports, peer constraints,
support window, theme integration and all six consumer gates before activating the profile.
The known input selector conflict remains manual-review without an authorized catalog update.

From the repository root, after implementation:

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run build
node scripts/admit-profile.mjs profiles/angular20
```

Set `MIGRATOR_API_TOKEN`, `MIGRATOR_STORE_DIR` and the admitted profile/container configuration
documented by the implementation. Start with `npm start`; the planned default address is
`http://127.0.0.1:3000`. Startup must fail clearly for invalid catalog/store/security config.
An unavailable target profile must never silently fall back to unsupported versions.

## API walkthrough

Use a trusted-team bearer token. In Windows PowerShell invoke `curl.exe` instead of `curl`.
Replace TOKEN and ID with the configured token and the returned migration ID.

```sh
curl -H "Authorization: Bearer TOKEN" -F "project=@tests/fixtures/react-supported.zip" http://127.0.0.1:3000/api/migrations
curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:3000/api/migrations/ID
curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:3000/api/migrations/ID/report
curl -H "Authorization: Bearer TOKEN" "http://127.0.0.1:3000/api/migrations/ID/report?format=md"
curl -H "Authorization: Bearer TOKEN" -o project.zip http://127.0.0.1:3000/api/migrations/ID/download
node scripts/verify-artifact.mjs project.zip
```

Submission returns 202 only after durable acceptance. Poll until completed/failed; report
returns 202 while pending. Successful fixture output has six passed gates, both reports,
architecture v1, a new lockfile and a verified final ZIP. Extract into a clean isolated
workspace, rerun install/typecheck/build/lint/tests/compliance, and exercise expected route,
form, validation and API behavior. Do not execute it directly on the API host.

## Required acceptance scenarios

| Fixture/scenario | Expected result |
| --- | --- |
| Supported React and Angular applications | Complete inventory, behavior assertions preserved, six gates passed, final ZIP downloadable |
| Missing catalog equivalent with safe native fallback | Unmapped with reason; native behavior retained; success only if all gates and behavior pass |
| Input selector conflict or multiple candidates | Manual-review, no guessed Xelops binding; report identifies exact occurrence |
| Required behavior cannot be preserved | Failed, final download 409, separate diagnostic ZIP with partial files and reports |
| Parse error or mixed/unsupported framework | Coverage gap/framework evidence reported, no silent omission or false success |
| Each validation gate fails separately | Failed; real evidence in both reports; skipped dependent checks explained |
| Malicious paths, symlinks, expansion quotas | Rejected safely; accepted archives still receive identified failure reports |
| Export failure, restart, storage outage | No false completion; durable recovery and original failure retained |
| Report/ZIP expiry and concurrent downloads | Correct 404/availability metadata, no cleanup of active download |

For a failed job with recoverable files, GET `/api/migrations/ID/diagnostic-download` returns
the clearly labeled diagnostic ZIP. Verify normal `/download` returns 409. Compare JSON
and Markdown reasons/counts, confirm every detected occurrence has one mapping decision,
and confirm neither archive contains credentials, host paths, node_modules or scratch files.

Protocol assertions and payload shapes are defined in [OpenAPI](contracts/openapi.json).
Acceptance tests must use independently specified source behavior, not only snapshots of
the generator's own output. Report measured performance against plan targets separately.

## Constitutional Validation (T067)

Before final delivery, verify all fifteen constitution principles against the running implementation.
Use the checklist below and document results in [implementation-notes.md](implementation-notes.md).

### I. Strict TypeScript

- [ ] Backend source compiles with `npm run typecheck` (no errors, not warnings-as-errors)
- [ ] Generated projects compile with `tsc --noEmit`
- [ ] `tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- [ ] No `// @ts-ignore`, `// @ts-expect-error` or `as any` suppressions in `src/`

### II. No Implicit `any`

- [ ] `npm run lint` passes with zero ESLint violations
- [ ] No `no-explicit-any` suppressions
- [ ] No unsafe TypeScript assertions (`as unknown as Type`)
- [ ] All catch variables are explicitly typed (from `useUnknownInCatchVariables`)

### III. Separation of Concerns

- [ ] Analyzer stage only imports from foundation (models, config, contracts)
- [ ] Mapper stage imports from analyzer and foundation only
- [ ] Generator imports from prior stages but not validator/reporter/exporter
- [ ] Validator, reporter, exporter follow DAG order; no circular imports
- [ ] Route handlers in `src/api/` only call through service interfaces

### IV. Ordered Pipeline

- [ ] Six-stage order enforced: Analyzer → Mapper → Generator → Validator → Reporter → Exporter
- [ ] No out-of-order stage execution possible
- [ ] Each stage produces typed output consumed by next
- [ ] Early failure (parse/required-behavior) bypasses remaining stages

### V. Catalog Authority

- [ ] Catalog file exists at `src/catalog/xelops-components.json`
- [ ] SHA-256 hash matches expected: `C4FA4AAC267F51089162CB87D0087BEAE369FD027E4350130F83517C070A1640`
- [ ] Exactly 74 component entries (no more, no fewer)
- [ ] Catalog is immutable; copy preserved from authorized source unchanged
- [ ] Job metadata records catalog hash with each migration

### VI. No Inventions

- [ ] Only catalog-listed components eligible for generation
- [ ] Package member evidence verified before candidate selection
- [ ] No invented selectors, inputs, outputs or ARIA tokens
- [ ] Unmatched components preserved as native HTML with manual-review findings
- [ ] Input selector conflict (`xlp-input` vs `xlpInput`) not guessed; remains manual-review

### VII. Explicit Unmapped

- [ ] All incompatible evidence documented with source spans
- [ ] Absent or unknown candidates retained with reason
- [ ] No silent omissions
- [ ] Manual-review findings include exact location in source

### VIII. No Guessing

- [ ] Conflicting evidence never becomes a scored guess
- [ ] Unknown event payloads marked as findings, not invented
- [ ] Multiple plausible candidates remain manual-review
- [ ] No confidence scores or probability-based selection

### IX. Architecture Enforcement

- [ ] Generated projects use owner-approved architecture-v1
- [ ] File ownership rules: `core/`, `shared/`, `features/`, `layouts/`
- [ ] Generated code respects ownership; no cross-module imports
- [ ] `architecture.test.ts` passes all module ownership checks

### X. Supported Versions & Expiry

- [ ] Node.js 24.21.0 LTS pinned (not floating)
- [ ] TypeScript 5.9.3 pinned
- [ ] Angular 20.3.x candidate profile with expiry ≤ 2026-11-28
- [ ] Admitted profile verified for actual package exports and peer constraints
- [ ] Expired profile fails startup with clear error message

### XI. Validation Gates

- [ ] Exactly six gates required: installation, typecheck, build, lint, tests, compliance
- [ ] No successful final ZIP without all six gates passing
- [ ] Skipped gates documented with reasons
- [ ] Failed gate prevents success transition
- [ ] Each gate produces ≤1 MiB diagnostics

### XII. Reports on All Outcomes

- [ ] Both JSON and Markdown reports for every migration
- [ ] Reports include: job ID, framework, analysis, mapping, generation, validation results
- [ ] Early failures (parse, required-behavior) produce reports
- [ ] Export failures produce reports with error cause
- [ ] No ZIP checksum embedded in reports

### XIII. ZIP Verification

- [ ] Final artifact reopened for verification before publication
- [ ] SHA-256 hash checked against expected value
- [ ] Entry count and file list match artifact inventory
- [ ] Download only served after verified publication
- [ ] No partial/corrupted ZIPs exposed to API

### XIV. Business Logic Grounded

- [ ] Analyzer behavior proved against fixture inventory
- [ ] Mapper decisions linked to source spans
- [ ] Generator output matches mapping plan
- [ ] Behavior transforms proved by fixture tests
- [ ] No placeholder stubs claimed as real behavior
- [ ] All transform evidence traceable to source

### XV. Compatible UI

- [ ] Required React/Angular semantics preserved
- [ ] Safe native fallback retained where generation unsafe
- [ ] No invented bindings
- [ ] Accessibility obligations honored
- [ ] Source-linked findings document why unmapped
