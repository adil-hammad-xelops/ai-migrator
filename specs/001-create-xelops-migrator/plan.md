# Implementation Plan: Xelops AI Migrator

**Branch**: No Git branch created; feature identifier `001-create-xelops-migrator`.
**Date**: 2026-09-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification and user-requested Node.js/strict TypeScript architecture.
**Status**: Phase 1 design complete; package/profile activation checks remain required
before successful-generation integration. No implementation or runtime validation is claimed.

## Summary

Build one modular Node.js backend that accepts a project ZIP and persists an asynchronous
migration. Run Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter through
typed contracts. Preserve unsupported/ambiguous UI natively where safe; preserve partial
files with a separate diagnostic ZIP when required behavior cannot be migrated.

The supplied catalog is the only component/member whitelist. Its input selector conflicts
with the actual package: `xlp-input` versus `xlpInput`. Native inputs/textareas therefore
remain manual-review until an authorized catalog correction. Do not change the catalog
or infer a differently named package to overcome generation errors.

## Technical Context

**Language/Version**: Node.js 24.21.0 LTS, TypeScript 5.9.3, ESM/NodeNext. Strict mode,
noUncheckedIndexedAccess, exactOptionalPropertyTypes, useUnknownInCatchVariables.
No explicit/implicit any, unsafe assertions, or suppressions concealing violations.

**Primary Dependencies**: Fastify 5 and compatible multipart plugin; TypeScript compiler
API; @angular/compiler matched to the admitted Angular adapter; PostCSS/SCSS parser;
yauzl; Archiver 8.0.0; ESLint/typescript-eslint; Vitest for backend tests.
Implementation pins exact compatible stable patches and integrity hashes in a lockfile.
See [research.md](research.md) for verified evidence and rejected alternatives.

**Generated Toolchain**: Candidate Angular/CLI/build/compiler 20.3.x, TypeScript 5.9.3,
CDK 20.x satisfying ^20.2.14, RxJS 7.8.x, @xelops-ui/angular 0.0.5. Exact patches,
package availability, theme integration and all six consumer checks are profile
activation gates. Angular 20 profile expires no later than 2026-11-28.

**Storage**: Local persistent job directories and immutable published revisions, controlled
by one backend process with an exclusive store lock. Atomic JSON-pointer publication;
no database, Redis, external queue, or report microservice for this MVP.

**Testing**: Vitest backend unit/integration/API tests; fixture-based transformation tests;
real generated Angular compilation and browser route/form smoke tests. Use supported
Angular 20 Karma/Jasmine tooling initially, not its experimental test-builder integration.

**Target Platform**: Linux service and disposable Linux job containers. Windows development
uses a Linux container engine; no unsafe host fallback. Backend scripts/configuration
are trusted; uploaded source/configuration never becomes executable backend configuration.

**Project Type**: Asynchronous migration backend, one service with one active worker.

**Performance Goals**: On a declared 4-vCPU/8-GiB test host, status/report metadata
requests p95 <500 ms at 10 concurrent clients; durable acknowledgement within 2 s after
upload completion for accepted 10-MiB fixtures. A 100-file/1-MiB analyzer+mapper fixture
finishes within 30 s. These are acceptance targets, not measured results; registry
latency and dependency/build time are reported separately.

**Constraints**: Defaults: 50 MiB compressed upload, 500 MiB expanded bytes, 10,000 archive
entries, 20 MiB per expanded file, aggregate expansion ratio <=100:1, 120 s upload
timeout, 20 queued jobs, one active job, 2 CPU/4 GiB/256 processes per container,
1 MiB retained diagnostics per check, 30 min total job budget.
Installation 10 min, analysis 2 min, mapping/generation 2 min each, build/tests 5 min
each, typecheck/lint/compliance 2 min each, export 2 min: total budget is authoritative.
If a quota is reached, fail visibly; do not truncate source and call it migrated.

**Scale/Scope**: One trusted-team deployment; all API routes require a configured bearer
token. Default bind 127.0.0.1; TLS at a trusted reverse proxy for remote access. No
multi-tenant sharing assumptions. Limit submission to five requests/minute/token and
queue capacity; reject before acceptance with 429 when full. Retain artifacts 24 h and
reports/status 7 days, expose expiry, sweep hourly, never sweep active downloads/jobs.
Delete uploaded source/scratch after terminal publication, except files intentionally
included in a diagnostic archive. Configure a 20-GiB store budget and retain free space
for failure reports; reject intake with 503 if durable storage cannot be reserved.

## Constitution Check

Pre-research: all fifteen principles are accounted for; authority is identified, with
incomplete metadata explicitly limiting capabilities. Post-design: no exceptions requested.

| Principle | Design enforcement and review evidence |
| --- | --- |
| I. Strict TypeScript | Strict backend and generated tsconfigs, strictTemplates, real compiler gates |
| II. No any | Typed boundary decoders and typed lint across owned/generated code and tests |
| III. Separation | Stage-owned implementations; route handlers only delegate |
| IV. Ordered pipeline | Typed stage graph and failure/report recovery in pipeline contract |
| V. Catalog authority | Immutable catalog bytes/hash recorded for every job |
| VI. No inventions | Catalog allowlist plus public-export validation, no invented bindings |
| VII. Unmapped | Explicit incompatible/absent candidates with source reasons |
| VIII. Manual review | Unknown/conflicting evidence never becomes a scored guess |
| IX. Architecture | Spec FR-012 owner-approved architecture v1 and layout audit |
| X. Supported versions | Admitted locked profile, expiry and official peer/support checks |
| XI. Validation | Six required checks; no successful final ZIP on failed/skipped checks |
| XII. Reports | Both formats on all terminal outcomes, including early and export failures |
| XIII. ZIP | Reopened verified archive and published download before completed status |
| XIV. Business logic | Source-linked transform evidence, behavioral fixtures, blocker findings |
| XV. Compatible UI | Required semantics checked; safe native fallback retained where possible |

Design gate: PASS. Runtime/release readiness is NOT yet established. A conflicting
catalog entry stays disabled; unresolved registry/profile activation blocks dependent
successful-generation tests, not foundation design. Neither a plan nor a mocked test
waives those checks.

## Project Structure

### Documentation (this feature)

```text
specs/001-create-xelops-migrator/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  checklists/requirements.md
  contracts/
    openapi.json
    pipeline.md
```

The later /speckit.tasks step creates tasks.md. It is not generated during planning.

### Source Code (repository root)

Planned files below do not yet exist. Preserve the requested top-level module layout.

```text
src/
  analyzer/
    analyzer.ts
    source-inventory.ts
    react-adapter.ts
    angular-adapter.ts
    style-analyzer.ts
    models.ts
  mapper/
    mapper.ts
    compatibility.ts
    models.ts
  generator/
    generator.ts
    angular-emitter.ts
    behavior-transforms.ts
    dependency-planner.ts
    templates/angular-v1/
  validator/
    validator.ts
    sandbox-runner.ts
    profile-admission.ts
    xelops-compliance.ts
  reporter/
    reporter.ts
    report-model.ts
    markdown-renderer.ts
  exporter/
    zip-exporter.ts
    artifact-inventory.ts
  catalog/
    xelops-components.json
    catalog-loader.ts
    package-evidence.ts
  api/
    app.ts
    migration.routes.ts
    report.routes.ts
    download.routes.ts
    migration-service.ts
    migration-store.ts
    upload-intake.ts
    contracts.ts
  index.ts
tests/
  unit/
  integration/
  contract/
  fixtures/
  generated-project/
profiles/
  angular20/
scripts/
  admit-profile.mjs
  verify-artifact.mjs
```

**Structure Decision**: src/index.ts is the composition root. api/migration-service.ts
coordinates stage calls and persistence; it contains no parsing/mapping/emission rules.
Models live with their owning stage, exported as immutable types; consumers use type-only
imports. Do not introduce a generic service framework or new top-level domain folders.
HTTP files never invoke compiler or compression internals directly. Test fixtures,
trusted container recipes, profile manifests and Angular templates are versioned resources.

## Phase 0: Research Decisions

[research.md](research.md) records the actual Xelops distributable, support windows,
catalog conflict, tools, isolation and alternatives. No unresolved product choice remains.
Private registry accessibility and real package/tool smoke checks are explicit operational
activation conditions; their results have not been fabricated.

## Phase 1: Design

### Stage responsibilities and data flow

| Owner | Input → output | Boundary |
| --- | --- | --- |
| Analyzer | Immutable source inventory → NormalizedProject | No source execution; source spans, graph and coverage retained |
| Mapper | NormalizedProject + CatalogSnapshot + verified package evidence → MappingPlan | One decision per UI occurrence; unknown evidence remains manual-review |
| Generator | NormalizedProject + MappingPlan + admitted target profile → GeneratedProject | Emits architecture v1, safe transformations and explicit blockers; no ZIP logic |
| Validator | GeneratedProject + target profile → ValidationSummary | Isolated real checks, bounded diagnostics; no artifact publication |
| Reporter | Attempt snapshot + outcomes → JSON/Markdown ReportBundle | One typed report revision feeds both formats |
| ZIP Exporter | Approved file inventory + ReportBundle → staged Artifact | Stream, reopen and verify; never change generated application logic |
| API service | Submission/state/store → orchestration and HTTP DTOs | Durable intake, status, error recovery, atomic publication |

See [data-model.md](data-model.md), [pipeline contract](contracts/pipeline.md) and
[OpenAPI contract](contracts/openapi.json). Only the service coordinates state transitions.

### Publication and recovery

1. Reserve storage/queue capacity, assign UUID, stream upload to a private job directory,
   verify transport completion and fsync receipt before returning 202. Bad ZIP content
   is a later identified failure; incomplete transport is never accepted.
2. Persist stage start/end records and source/profile hashes. The accepted queue resumes
   after restart. Interrupted running jobs become failed with PROCESS_INTERRUPTED;
   preserve partial files and attempt diagnostics. Do not replay source side effects.
3. Reporter prepares a private candidate terminal bundle. A success candidate is not a
   public result. Exporter packages it and verifies the archive. Only after every gate
   and artifact check succeeds does the service atomically publish the revision pointer
   containing completed state, matching reports and final artifact.
4. An export failure discards the success candidate; Reporter produces failure reports,
   and Exporter attempts the separate diagnostic archive. Failure publication does not
   depend on diagnostics succeeding. Preserve the original cause plus diagnostic error.
5. Report files never contain their own enclosing ZIP checksum. Checksums, byte lengths,
   final commit time and artifact availability live in the published status metadata.
   Export metrics unavailable when preparing a report remain null, not invented.
6. Disk/outage errors cannot yield completed status. Keep recoverable journal data and
   retry report publication on restart; expose storage-unavailable errors while degraded.
   Retention expiry changes artifact availability, not the historically completed result.

### Security and resources

All input paths are untrusted; validate UUIDs, root containment and archive entries.
Handle files by approved inventories, not user-controlled absolute paths. Analyzer and
validation subprocesses run in per-job containers. The orchestrator may manage containers;
no job can access its management socket or another job's workspace. Install only approved
dependencies with lifecycle scripts disabled in a restricted network phase. Build/test
phases have no network or credentials. API tokens and raw uploaded source never enter logs.
Redact absolute host paths and secrets from diagnostics and generated reports.
Use original source read-only; writable output and scratch are separate mounts.

### Validation sequence

Profile preparation resolves a new target lockfile from approved dependencies; installation
gate performs clean npm ci --ignore-scripts --strict-peer-deps against it.
Run local target tsc --noEmit --project tsconfig.app.json, Angular production build,
generated lint script, non-watch headless target tests, and internal catalog/layout audit.
All six must pass. Zero required tests is failure. Capture actual exit status, duration,
tool versions, bounded/redacted diagnostics and skipped-dependency reasons.
No source-supplied npm scripts, test config or build plugins are reused.

Backend CI separately runs strict compilation, typed lint, unit/contract/integration tests,
catalog/schema checks, malicious archive cases, and full generated-project fixture tests.
See [quickstart.md](quickstart.md) for expected commands and outcomes after implementation.

### Acceptance coverage and sequencing

| Scope | Spec coverage | Proof |
| --- | --- | --- |
| Intake/detection/inventory | FR-001–006, 025–027; SC-002, 008 | Valid React/Angular, mixed frameworks, corruption, path attacks, parse gaps |
| Mapping/catalog | FR-007–011, 028–029; SC-003 | Certain/incompatible/unknown cases, real input selector conflict, no invented API |
| Target/behavior/styles/deps | FR-012–015, 030–031, 033–034; SC-001, 004 | Architecture audit, business equivalence fixtures, unsupported dependency blockers |
| Validation | FR-016, 032; SC-010 | Real six-gate builds plus per-gate failure fixtures |
| Reports/API/export | FR-017–024, 035–038; SC-005–009 | Both formats, protocol errors, final/diagnostic separation, crash/expiry recovery |

Implementation sequence: contracts/store/intake → analyzer → catalog/mapper → generator
and profile admission → validator → reporter/exporter → API integration and end-to-end
fixtures. Reporter failure handling is available before any end-to-end migration is exposed.
The detailed work breakdown belongs to /speckit.tasks, not this Phase 1 document.

## Complexity Tracking

No constitutional violations or waivers. Disposable job containers and persisted revisions
are required for untrusted-code isolation and truthful durable delivery, not microservices.
