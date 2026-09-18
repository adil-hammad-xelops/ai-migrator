# Xelops AI Migrator

Backend service that migrates a React or Angular frontend application into an
Angular application built on the Xelops component library (`@xelops-ui/angular`).
See [specs/001-create-xelops-migrator](specs/001-create-xelops-migrator/spec.md) for
the full specification, plan, data model and API contracts.

## Requirements

- Node.js `24.15.0` (see `.node-version`; pinned in CI to this exact patch, not floating latest)
- npm `9.x` or later
- Docker (or another OCI-compatible container runtime) for sandboxed validation

## Setup

```sh
npm install
cp .env.example .env   # then fill in MIGRATOR_AUTH_TOKEN and MIGRATOR_STORE_ROOT
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Strict TypeScript compile check (`tsc --noEmit`), no emit |
| `npm run lint` | Typed ESLint across `src/` and `tests/` |
| `npm run build` | Emit backend source to `dist/` via `tsconfig.build.json` |
| `npm start` | Run the compiled server (`dist/index.js`) |
| `npm run dev` | Run the server from source with `tsx watch` |
| `npm test` | Run the full Vitest suite (unit, contract, integration, generated-project) |
| `npm run test:unit` \| `test:contract` \| `test:integration` \| `test:generated-project` | Run one focused suite |

Run a single test file or case directly, e.g.:

```sh
npx vitest run tests/unit/catalog.test.ts
npx vitest run tests/contract/migration-api.test.ts -t "returns 401"
```

## Environment variables

See `.env.example`. All variables are required in production; there is no insecure
default token, store root, host, or port beyond `127.0.0.1:3000`, which is deliberately
loopback-only. Put TLS termination and remote access behind a trusted reverse proxy.

## Private registry access

`@xelops-ui/angular@0.0.5` is published to `https://nexus.xelops.ma/repository/npm_repo`.
Access requires a local `.npmrc` (not committed — see `.gitignore`) with a scoped registry,
`_auth` credential and `always-auth=true`. That registry's TLS certificate is not trusted by
default; `.npmrc` currently sets `strict-ssl=false` to work around it, which disables
certificate validation for all npm registry traffic system-wide for this project. Prefer
narrowing this (e.g. `cafile`/`ca` pointing at nexus's actual CA) once available, rather than
leaving TLS validation off long term.

See `specs/001-create-xelops-migrator/implementation-notes.md` for current task status.
See [PROJECT-TRACKER.md](PROJECT-TRACKER.md) for the current progress and a simple explanation
of each backend module.

## Verified Versions (T067)

| Component | Version | Channel | Stability |
| --- | --- | --- | --- |
| **Node.js** | 24.21.0 LTS | nodejs.org | Stable |
| **TypeScript** | 5.9.3 | npm | Stable |
| **Fastify** | 5.x | npm | Stable |
| **Angular** | 20.3.x | npm | Stable (candidate profile) |
| **@xelops-ui/angular** | 0.0.5 | nexus.xelops.ma | Private |
| **Docker** | 24+ | docker.io | Stable |

Angular 20 profile expires no later than 2026-11-28. See
[implementation-notes.md](specs/001-create-xelops-migrator/implementation-notes.md) for any
expired profile alerts.

## Supported Adapters (T067)

| Framework | Version | Status | Notes |
| --- | --- | --- | --- |
| **React** | 18.x–19.x | Supported | Bootstrap, routes, hooks, forms, state, API calls |
| **Angular** | 20.x | Supported | Standalone, providers, templates, forms, RxJS |
| **Angular** | <20.x | Not supported | Upgrade required; NgModule/aot compilation issues |
| **Vue** | — | Not supported | Out of scope for MVP |
| **Svelte** | — | Not supported | Out of scope for MVP |

## Operational Limits (T067)

| Limit | Value | Policy |
| --- | --- | --- |
| **Compressed Upload** | 50 MiB | Rejected if exceeded; 413 Payload Too Large |
| **Expanded Archive** | 500 MiB | Rejected if exceeded; expansion bomb detection |
| **Per-File Expanded** | 20 MiB | Individual files rejected if larger |
| **Archive Entries** | 10,000 | Rejected if entry count exceeded |
| **Expansion Ratio** | ≤100:1 | Rejected if ratio exceeded (compression bomb) |
| **Upload Timeout** | 120 seconds | Rejected if stream times out; 408 Request Timeout |
| **Queued Jobs** | 20 maximum | Accepted queue depth; oldest purged if full |
| **Active Jobs** | 1 | Single-worker process; others queued |
| **Rate Limit** | 5 requests/min/token | Rejected with 429 Too Many Requests when exceeded |
| **Store Capacity** | 20 GiB | Total storage budget; reserved for all jobs |
| **Store Headroom** | 5 GiB | Reserved for failure reports/diagnostics |
| **Diagnostics** | 1 MiB/check | Truncated if check produces >1 MiB output |
| **Job Timeout** | 30 minutes | Total budget; job fails if exceeded |
| **Artifact Retention** | 24 hours | Files deleted after 24h; status remains 7d |
| **Report Retention** | 7 days | JSON/Markdown reports kept 7d; then deleted |
| **Sandbox CPU** | 2 vCPU | Per container resource limit |
| **Sandbox Memory** | 4 GiB | Per container resource limit |
| **Sandbox Processes** | 256 | Per container process limit |

## Catalog Restrictions (T067)

The authorized Xelops component catalog (`src/catalog/xelops-components.json`) contains
exactly 74 component entries.

**Hash**: `C4FA4AAC267F51089162CB87D0087BEAE369FD027E4350130F83517C070A1640`

**Restrictions**:
- Catalog is immutable and recorded per migration job
- Only components listed in the catalog are eligible for code generation
- Input/textarea native mapping conflicts (`xlp-input` vs `xlpInput`) require manual review;
  not guessed or substituted
- Package evidence must verify actual exports before candidate eligibility
- Unmatched components preserved as native HTML with manual-review findings

## Constitution Principles (T067)

Implementation enforces all fifteen principles from
[.specify/memory/constitution.md](.specify/memory/constitution.md):

| # | Principle | Evidence |
| --- | --- | --- |
| I | Strict TypeScript | `tsconfig.json` strict mode; `src/`, `tests/` must compile |
| II | No any | ESLint `no-explicit-any`, `no-unsafe-*` rules enforced |
| III | Separation | Stage-owned models; route handlers delegate only |
| IV | Ordered Pipeline | Typed stage graph; Analyzer → Mapper → Generator → Validator → Reporter → Exporter |
| V | Catalog Authority | Immutable catalog hash recorded per job; no invented components |
| VI | No Inventions | Package member evidence required; catalog allowlist enforced |
| VII | Unmapped | Explicit incompatible/absent candidates with source reasons retained |
| VIII | Manual Review | Unknown/conflicting evidence never becomes scored guess |
| IX | Architecture | Generated projects follow owner-approved architecture-v1 |
| X | Supported Versions | Admitted locked profile with expiry check; official peer/support verified |
| XI | Validation | Six required gates (installation, typecheck, build, lint, tests, compliance); no success on skip/fail |
| XII | Reports | Both JSON and Markdown on all terminal outcomes including early/export failures |
| XIII | ZIP | Reopened verified archive (SHA-256); published download before completed status |
| XIV | Business Logic | Source-linked evidence; behavioral fixtures prove generation |
| XV | Compatible UI | Required semantics checked; safe native fallback retained where possible |

## API Examples (T067)

### Submit a Migration

```bash
curl -X POST http://127.0.0.1:3000/api/migrations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/zip" \
  --data-binary @project.zip

# Response: 202 Accepted
# Location: /api/migrations/{migrationId}
# { "migrationId": "...", "state": "accepted" }
```

### Check Migration Status

```bash
curl http://127.0.0.1:3000/api/migrations/{migrationId} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: 200 OK
# { "migrationId": "...", "state": "running|completed|failed", "outcome": "success|failed" }
```

### Retrieve Report (JSON)

```bash
curl http://127.0.0.1:3000/api/migrations/{migrationId}/report \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: 200 OK (JSON report) or 202 Pending
# { "migrationId": "...", "state": "...", "analysis": { ... } }
```

### Retrieve Report (Markdown)

```bash
curl "http://127.0.0.1:3000/api/migrations/{migrationId}/report?format=md" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: 200 OK (Markdown text)
# # Migration Report: ...
```

### Download Final Artifact

```bash
curl http://127.0.0.1:3000/api/migrations/{migrationId}/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o generated-project.zip

# Response: 200 OK (ZIP stream) for completed successful migration
# Response: 409 Conflict for failed or active migration
# Response: 404 Not Found or 410 Gone if expired
```

### Download Diagnostic Archive (Failed Migrations)

```bash
curl http://127.0.0.1:3000/api/migrations/{migrationId}/diagnostic \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o diagnostic.zip

# Response: 200 OK (ZIP stream) for failed migration with recoverable files
# Response: 409 Conflict if migration succeeded (no diagnostics)
# Response: 404 Not Found if no diagnostic available
# Response: 410 Gone if diagnostic expired
```

## Performance Targets (T067)

These targets are aspirational; actual results depend on host configuration.
Measurements must record host CPU, memory and network conditions.

| Target | Value | Host Requirement | Status |
| --- | --- | --- | --- |
| Metadata requests (p95) | <500 ms | 4 vCPU / 8 GiB | Placeholder |
| Upload acknowledgement | <2 s | 4 vCPU / 8 GiB (10 MiB fixture) | Placeholder |
| Analyzer + Mapper | <30 s | 4 vCPU / 8 GiB (100 files / 1 MiB) | Placeholder |

See [tests/integration/performance.test.ts](tests/integration/performance.test.ts) for
measurement methodology and [implementation-notes.md](specs/001-create-xelops-migrator/implementation-notes.md)
for latest measured results.

## Troubleshooting

### Common Errors

**`ENOENT: cannot find module '@xelops-ui/angular'`**
- Ensure `.npmrc` is configured with nexus.xelops.ma registry credentials
- Run `npm install` to fetch from private registry
- Check `npm config list` to verify scoped registry is active

**`EACCES: permission denied` on store directory**
- Ensure `MIGRATOR_STORE_ROOT` directory exists and is writable
- Check file ownership: `ls -ld $MIGRATOR_STORE_ROOT`
- Grant write permission: `chmod 755 $MIGRATOR_STORE_ROOT`

**Docker socket not accessible**
- Ensure Docker daemon is running: `docker ps`
- Check Docker socket permissions: `ls -la /var/run/docker.sock`
- On Windows/macOS, Docker Desktop must be running

**`413 Payload Too Large`**
- Uploaded ZIP exceeds 50 MiB compressed limit
- Reduce project size or split into smaller modules
- Check actual compressed size: `ls -lh project.zip`

**`429 Too Many Requests`**
- Rate limit (5 requests/minute) exceeded for your token
- Wait 60 seconds and retry
- Use a separate token for concurrent submissions if needed

### Getting Help

1. Check the specification: [specs/001-create-xelops-migrator/spec.md](specs/001-create-xelops-migrator/spec.md)
2. Review the implementation plan: [specs/001-create-xelops-migrator/plan.md](specs/001-create-xelops-migrator/plan.md)
3. See current blockers: [specs/001-create-xelops-migrator/implementation-notes.md](specs/001-create-xelops-migrator/implementation-notes.md)
4. Run test suite: `npm test` (use `-t` flag to filter by test name)

## Continuous Integration (T067)

The `.github/workflows/ci.yml` pipeline enforces:

✅ **Catalog hash verification** — Exact match required  
✅ **TypeScript strict mode** — All compilation errors fail the build  
✅ **ESLint with no suppressions** — No workarounds permitted  
✅ **Unit/contract/integration tests** — All must pass  
✅ **Module ownership** — Cross-stage imports prevented  
✅ **Architecture compliance** — Generated projects validated  
✅ **Prerequisites check** — Docker/Node availability verified  

Missing prerequisites fail the CI pipeline; not silently bypassed.
