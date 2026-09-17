# Tasks: Xelops AI Migrator

**Feature**: 001-create-xelops-migrator. **Date**: 2026-09-17.
**Repository**: `https://github.com/adil-hammad-xelops/ai-migrator.git` (`origin`), current
integration branch `main`.
**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [pipeline](contracts/pipeline.md),
[OpenAPI](contracts/openapi.json), [quickstart.md](quickstart.md), and
[constitution](../../.specify/memory/constitution.md).
**Tests**: Explicitly requested by the user; included alongside each implementation increment.
**Status**: Tasks only; unchecked boxes do not claim implemented or passing behavior.
Implementation commits belong in this repository. Push only through the configured remote
and normal review workflow; never commit credentials or generated migration artifacts.

## Instructions for the implementing model

Work on one task at a time in ID order unless an explicit dependency/parallel group below
permits otherwise. Read the linked contract and the relevant FR before editing. Do not
implement an entire subsystem in one response. If a task needs several turns, preserve its
unchecked state and record the exact remaining work in `implementation-notes.md` in this
feature directory. Each task names its files, behavior and acceptance condition.

After each implementation task, run strict typecheck, lint and its relevant focused tests.
For test-first tasks, record the expected failure, then make it pass with the named later
implementation task. Mark an implementation task complete only after its stated check
passes. Do not mark an unavailable registry/container test passed or replace it with a mock.
Use injected fakes for unit tests only; real integration gates remain mandatory.

Use the requested top-level directories exclusively:
`src/analyzer`, `mapper`, `generator`, `validator`, `reporter`, `exporter`,
`catalog`, `api`, and `src/index.ts`. Models belong to their owning stage.
No extra microservices, database, LLM inference dependency or frontend dashboard.

All owned and generated TypeScript is strict and contains no explicit/implicit `any`.
Decode external data from `unknown`; no unsafe double assertions, suppression comments,
empty handlers, fake success values or placeholder business logic. Never weaken a test
or compiler option to obtain a successful migration.

The catalog source is
`C:/Users/EL MAGICO/Desktop/DS/angular-xelops-ui/xelops-components.json`.
Expected snapshot: 74 entries; SHA-256
`C4FA4AAC267F51089162CB87D0087BEAE369FD027E4350130F83517C070A1640`.
Copy unchanged; do not create a new catalog or edit the original. A hash mismatch requires
identifying the newly authorized revision, not silently accepting it. The known catalog
`xlp-input` versus actual package `xlpInput` conflict means manual-review; do not emit either
as a guessed replacement. Package evidence verifies listed APIs but never adds catalog APIs.

Dependencies use exact stable compatible versions and new lockfiles. The candidate profile
is Angular 20.3.x with `@xelops-ui/angular@0.0.5`, not private workspace version 1.9.1.
Profile availability/exports/support must be verified before activation. Angular 20 profile
expires no later than 2026-11-28. If unavailable, continue independent tasks and record the
blocked real integration; do not substitute a package, version or selector.

## User's eleven work packages

The original T001–T011 are retained here as work-package labels, not executable IDs.
Executable task IDs below are finer-grained and sequential.

| Original work package | Executable tasks |
| --- | --- |
| T001 Initialize Node.js TypeScript project | T001–T005 |
| T002 Define migration domain models | T006–T008 |
| T003 Implement project analyzer | T012, T021–T027 |
| T004 Create Xelops component catalog | T009–T010, T028 |
| T005 Implement deterministic mapper | T029–T030 |
| T006 Implement Angular generator | T031–T038 |
| T007 Implement validator | T014–T015, T039–T042 |
| T008 Implement migration reporter | T016, T046–T050 |
| T009 Implement ZIP exporter | T051–T055, T059 |
| T010 Implement REST API | T011, T013, T017, T020, T043–T044, T050, T056, T060–T062 |
| T011 Add tests | T018–T020, T028, T045–T047, T051–T052, T057–T058, T063–T067 |

## Phase 1: Setup

Goal: reproducible backend toolchain; no source project execution.

- [X] T001 Initialize `package.json`, `package-lock.json`, `.node-version` and `.gitignore` for Node 24.21.0, TypeScript 5.9.3 and ESM/NodeNext; resolve exact compatible stable Fastify 5/multipart, parser, ZIP, lint and Vitest packages from plan/research and create the requested `src/` directories. Verify clean install and record actual versions; no floating latest dependency.
- [X] T002 Configure `tsconfig.json` and `tsconfig.build.json` with strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes and useUnknownInCatchVariables; cover source/tests with typecheck and emit only backend source into `dist/`. Acceptance: a deliberate unchecked nullable access fails compilation.
- [X] T003 Configure `eslint.config.mjs` for typed lint, no-explicit-any/no-unsafe rules and prohibition of bypass suppressions; add `typecheck`, `lint`, `build`, `test`, `start` scripts to `package.json`. Acceptance: a temporary explicit-any probe fails lint and is then removed.
- [X] T004 Configure `vitest.config.ts` and `tests/fixtures/README.md` with separate unit, contract, integration and real generated-project suites; default test command must report failures, not skip unavailable integration as passing. Document how to run a focused test.
- [X] T005 Document environment names/defaults in `.env.example` and `README.md`: token, absolute store root, container runtime, admitted profile, host 127.0.0.1 and port 3000; use no real credentials. Acceptance: scripts and expected configuration are unambiguous.

## Phase 2: Foundation

Goal: typed boundaries, safe workspaces, durable state and failure reporting before orchestration.
All story implementation depends on this phase; profile admission itself is completed later.

- [X] T006 Define readonly analysis/catalog/mapping/generation models in `src/analyzer/models.ts`, `src/catalog/models.ts`, `src/mapper/models.ts`, `src/generator/models.ts` from data-model.md. Preserve the exact constraints: “Each detected UI occurrence has exactly one decision”; “Only mapped decisions select an emitted Xelops target”; source-file disposition is `analyzed | excluded | failed`; coverage is `complete | partial | unknown`. Include every listed field and source span, not just UI tags.
- [X] T007 Define `src/validator/models.ts`, `src/reporter/report-model.ts`, `src/exporter/models.ts` and `src/api/contracts.ts`; model “accepted → running → completed | failed”, stage “pending | running | completed | failed | skipped”, gate `passed | failed | skipped`, artifact `final | diagnostic`, and preservation `preserved | adapted | manual-review | unsupported`. Mirror all required/nullable fields in OpenAPI; dependency decisions are `preserved | removed | replaced | manual-review`, separate from preservation outcomes.
- [X] T008 Implement validated JSON decoders and invariant checks in `src/api/contract-decoders.ts` and `src/reporter/report-decoders.ts`; reuse stage-owned types and reject malformed persisted/API data without assertions. Check nonnegative counts, exactly six distinct validation gates, UUIDs, source-relative POSIX paths and mapping-count reconciliation; quote and enforce “Report contents do not embed their enclosing ZIP checksum”.
- [X] T009 Copy the authorized catalog bytes to `src/catalog/xelops-components.json`; implement `src/catalog/catalog-loader.ts` to validate structure, duplicate identities, listed imports/members and immutable revision/hash. Acceptance: 74 entries and expected hash; malformed catalogs fail startup and incomplete metadata produces explicit diagnostics.
- [X] T010 Implement `src/catalog/package-evidence.ts` and `profiles/angular20/candidate.json` to verify actual package integrity, public exports and typed member contracts against the catalog whitelist. Record selector conflicts and missing composition/ARIA evidence; never enrich the whitelist from package discovery. Acceptance: input conflict is reproducibly disabled.
- [X] T011 Implement `src/api/migration-store.ts` with exclusive process lock, `jobs/<uuid>/{receipt.json,journal/,source/,work/,revisions/}`, fsynced temporary writes/rename and atomic publication pointer. Acceptance: a partial write exposes no partial report or completed job; output directory existence is not success.
- [X] T012 Implement safe extraction in `src/analyzer/archive-reader.ts` using yauzl lazy entries; reject traversal, absolute/drive/UNC paths, symlinks/special files, duplicate/case-colliding paths and encryption. Enforce actual bytes: 50 MiB compressed, 500 MiB expanded, 20 MiB/file, 10,000 entries, ratio <=100:1. Acceptance: every destination remains under the private root, including malicious ZIPs.
- [X] T013 Implement `src/api/config.ts` and `src/api/upload-intake.ts`: validate configuration, reserve 20-GiB store capacity with failure-report headroom, stream one project file with 120-second limit, queue limit 20 and one active job. Receipt is durable before 202; truncated transport is rejected, while fully received corrupt ZIP gets an identified attempt.
- [X] T014 Implement `src/validator/sandbox-runner.ts` and `profiles/angular20/Dockerfile` with disposable unprivileged Linux containers, read-only root/source, separate writable work/scratch, dropped capabilities, 2 CPU/4 GiB/256 processes and no management socket. Use executable/argument arrays, shell disabled. Acceptance: host execution fallback is impossible and path/network isolation is tested.
- [X] T015 Add phase execution policies to `src/validator/sandbox-runner.ts`: registry-only install access, no network/credentials for build/tests, process-tree cancellation, 1-MiB retained redacted diagnostics/check, authoritative 30-minute job budget and per-stage limits from plan.md. Acceptance: timeout kills descendants and returns a typed failure.
- [X] T016 Implement early failure report construction in `src/reporter/reporter.ts` and `src/reporter/markdown-renderer.ts` using one typed report record; unknown framework/coverage stays unknown and unrun gates are skipped with reasons. Acceptance: corrupt archive and analyzer exception yield both report formats without generated files.
- [X] T017 Implement `src/api/app.ts` factory with Fastify schemas, bearer auth on every route, five submissions/minute/token, bounded request handling and redacted errors; keep listening/wiring in `src/index.ts` for later T044. Acceptance: unauthorized requests cannot read status, reports or archives.
- [X] T018 Add foundation tests in `tests/unit/contracts.test.ts`, `tests/integration/store.test.ts`, `tests/integration/archive-security.test.ts` and `tests/integration/sandbox.test.ts`; cover malformed JSON, count invariants, atomic writes, ZIP attacks and forbidden host access. Run actual container isolation tests, not only command-string assertions.

Checkpoint: strict compilation/lint and foundation tests pass; no external migrations exposed yet.

## Phase 3: US1 — Migrate a complete frontend application (P1)

Goal: reconstruct supported React/Angular behavior through real validation.
Independent test: compare two complete fixture applications against predetermined inventories,
routes, forms/state/API outcomes and real generated-project gates. Public completion also
depends on US2 reports and US3 publication; do not expose a fake intermediate success.

- [X] T019 [P] [US1] Create `tests/fixtures/react-supported/`, `tests/fixtures/angular-supported/` and `tests/fixtures/expected-inventory.json` with two routes, shared component, typed model, API service, form validation/reset, state and scoped styles. Specify expected behavior before generation; add analyzer/generator acceptance tests in `tests/integration/migration-core.test.ts` that initially fail.
- [X] T020 [P] [US1] Add POST/status contract tests in `tests/contract/migration-api.test.ts` from OpenAPI: durable 202/Location, distinct IDs, 400/401/413/415/429/503, pending status and cross-job isolation. Use injected services here; real end-to-end tests remain T064.
- [X] T021 [US1] Implement `src/analyzer/source-inventory.ts` for all owned roots/extensions/assets in FR-026, evidence-based exclusions, lockfile-only dependency evidence and source hashes. Acceptance: owned files outside src and required generated imports are accounted for; .gitignore or a folder name cannot silently hide source.
- [X] T022 [US1] Implement `src/analyzer/framework-detector.ts` using manifest, reachable bootstrap and configuration corroboration; support verified React 18/19 and Angular 20 browser adapters. Acceptance: both dependencies with one bootstrap selects that framework; mixed roots, no root, SSR/server dependencies and unsupported versions yield explicit findings, not guessed conversion.
- [X] T023 [US1] Implement `src/analyzer/import-graph.ts` using TypeScript compiler API for local imports/aliases, active versus unused code and source spans; inspect tests/stories as behavior evidence without counting their UI. Acceptance: cycles terminate, aliases stay in root, unresolved/dynamic imports produce findings.
- [X] T024 [US1] Implement `src/analyzer/react-adapter.ts` to identify component declarations/JSX, supported React Router 6/7 routes, handlers, forms, state/reducers, effects/context/refs, API calls and models from syntax/use. Acceptance: full fixture inventory matches; uncertain dynamic routes and hook timing are source-linked review findings. **VERIFIED**: Strict typecheck/lint and fixture inventory pass; components/routes carry source spans, and focused tests verify source-linked dynamic-route and conditional-hook findings.
- [X] T025 [US1] Implement `src/analyzer/angular-adapter.ts` with version-matched Angular template parser and TypeScript metadata analysis for standalone/NgModule apps, routes/providers, bindings, forms/signals/observables and lifecycle dependencies. Acceptance: inline/external templates and provider scopes are represented; unsupported syntax is reported with coverage gaps. **VERIFIED**: Strict typecheck/lint and fixture checks pass; `@angular/compiler` 20.3 parses inline/external templates into source-linked elements/bindings/events, while dynamic, unavailable and malformed templates produce explicit findings.
- [X] T026 [US1] Implement `src/analyzer/style-analyzer.ts` for CSS/SCSS, CSS Modules, inline styles, utilities and asset URLs using trusted parsers only. Acceptance: record ownership, dynamic bindings and dependencies without executing uploaded style plugins; unresolved utilities/assets are findings. **VERIFIED**: PostCSS, SCSS, selector and value AST parsers handle nested rules, declarations, utilities, custom properties and asset URLs without uploaded plugins; malformed styles and unresolved assets produce findings.
- [X] T027 [US1] Compose `src/analyzer/analyzer.ts` in the isolated analysis workspace; assign deterministic occurrence IDs by relative path/span and retain parse successes alongside errors. Acceptance: expected inventory matches, every file has a disposition/reason, and unparsed regions never become a falsely complete zero-UI result. **VERIFIED**: Six-stage composition emits canonical UI occurrences with stable path/span IDs and semantic roles; both fixture inventories pass as complete, while unresolved dynamic-route evidence remains available under partial coverage.
- [X] T028 [US1] Add `tests/unit/catalog.test.ts` and `tests/unit/mapper.test.ts` covering every FR-028 native category, unknown event payloads, incompatible required features, multiple candidates and the actual input conflict. Acceptance: tests distinguish mapped/unmapped/manual-review and reject invented selectors, inputs, outputs and tokens. **VERIFIED**: Seven focused tests cover all eight native categories, concrete input selector evidence, all three outcomes, payload ambiguity, incompatibility and prohibited invented APIs/tokens.
- [X] T029 [US1] Implement `src/mapper/compatibility.ts`: classify checkbox/radio before generic input, use only FR-028 catalog candidates, verify required properties/events/form semantics/composition/accessibility with evidence. Acceptance: known incompatibility rejects a candidate; unknown evidence makes it uncertain; visual similarity never proves compatibility. **VERIFIED**: Role-specific allowlists, package member evidence, CVA/form checks and explicit composition/service gaps produce compatible, incompatible or uncertain results without visual substitution.
- [X] T030 [US1] Implement `src/mapper/mapper.ts`: one verified compatible candidate with no unresolved ambiguity is mapped; no compatible candidate is unmapped; conflicting/unknown/multiple plausible candidates are manual-review. Emit reasons, source links and translations; no confidence scores or guessed replacements. Acceptance: exactly one decision per occurrence and reconciled counts. **VERIFIED**: Mapping plans emit one source-linked decision per unique occurrence, select targets only for compatible evidence, retain translations/reasons, and reject duplicate occurrence IDs.
- [X] T031 [US1] Create `src/generator/templates/angular-v1/` with trusted Angular/package/TypeScript/lint/test configuration and architecture: core/{api,guards,interceptors,services,models}, shared/{components,directives,pipes,utils,models}, features/<feature>/{pages,components,services,models,feature.routes.ts}, layouts and root app.component/config/routes. Acceptance: template has strict/strictTemplates, standalone shell and lazy feature routes; no arbitrary source layout copying. **VERIFIED**: Versioned Angular 20 template includes strict compiler/template settings, standalone bootstrap/shell, eager layout, lazy home feature, production build, lint/headless-test configuration and every architecture-v1 ownership directory; structural tests pass.
- [ ] T032 [US1] Implement `src/generator/dependency-planner.ts` using actual imports/build needs and admitted versions; emit preserved/removed/replaced/manual-review decisions and source/target versions. Acceptance: React-only runtimes/source plugins/scripts/lockfiles are not copied; unresolved required dependency behavior blocks completion.
- [ ] T033 [US1] Implement `src/generator/angular-emitter.ts` for deterministic path ownership, name collisions, imports, route parameters/guards and source-to-target associations. Acceptance: routed pages live within features, reusable code in shared, global services in core, shells in layouts; repeated input/profile produces stable source output.
- [ ] T034 [US1] Implement React transforms in `src/generator/react-transforms.ts` for resolvable JSX/bindings, pure typed functions, explicit handlers and proven local state/reducers; preserve evaluation/event order. Acceptance: fixture actions give specified outcomes; unproven effects/closures/context/refs/stores create blockers, never empty translated handlers.
- [ ] T035 [US1] Implement Angular transforms in `src/generator/angular-transforms.ts` preserving provider scope, lifecycle, streams, event bindings and standalone conversion. Acceptance: fixtures prove subscription cleanup, service lifetime and route behavior; unsupported NgModule/provider transformations remain findings.
- [ ] T036 [US1] Implement `src/generator/behavior-transforms.ts` for typed reactive forms and API calls; preserve nullability/reset/touched/dirty/disabled/validation timing and methods/URLs/headers/serialization/error/cancellation/order. Acceptance: meaningful form and network-fixture tests prove equivalent outcomes; secrets become configurable references, never copied credentials.
- [ ] T037 [US1] Implement `src/generator/style-emitter.ts` for owned CSS/SCSS, resolvable CSS Module scoping, inline bindings, approved utility styles and asset rewriting. Acceptance: scope/cascade/responsive/pseudo-state behavior remains; no invented tokens or undocumented internal Xelops overrides; unsafe unresolved styles are reported.
- [ ] T038 [US1] Compose `src/generator/generator.ts` to apply mapped decisions only, retain safe native/custom elements and collect generated inventory/preservation blockers. Generate meaningful smoke/behavior tests from supported transform contracts. Acceptance: no arbitrary copied React runtime, fabricated model types or function stubs claimed as preserved.
- [ ] T039 [US1] Implement `src/validator/profile-admission.ts` and `scripts/admit-profile.mjs` to resolve exact compatible profile versions/integrities, verify official support expiry and package exports/themes, prepare new lockfiles and expose an injected six-gate consumer-validation interface. Normal migrations require admitted status. Acceptance: focused admission-policy tests reject expired/incompatible profiles and failed/skipped gates; real activation is deferred to T042, not claimed by this task.
- [ ] T040 [US1] Implement `src/validator/xelops-compliance.ts` auditing actual emitted Angular imports/templates/members/compositions, architecture, strict/no-any settings, source-linked accessibility obligations and verified tokens against the pinned evidence. Acceptance: an invented component/binding or disabled strict option fails independently of compiler success.
- [ ] T041 [US1] Implement `src/validator/validator.ts` gates: isolated npm ci --ignore-scripts --strict-peer-deps, local tsc --noEmit --project tsconfig.app.json, production Angular build, trusted lint, headless non-watch tests and compliance. Acceptance: exactly six results with real evidence; zero required tests, timeout/missing tooling or skipped gate prevents success; safe independent checks still run.
- [ ] T042 [US1] Add `tests/generated-project/validation.test.ts` by wiring T039 admission to T040/T041, running the minimal real consumer fixture and activating the profile only after all six gates pass; then run real admitted-profile builds and separate failure fixtures for each gate, including no-any/template errors and zero tests. Acceptance: failed or skipped gates never yield a success candidate; no mocked process result counts as integration evidence.
- [ ] T043 [US1] Implement `src/api/migration-service.ts` single-worker queue and ordered stage orchestration with typed injectable stage interfaces, checkpointing and early-failure Reporter path. Acceptance: Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter order is recorded; no completed state until T055 publication is wired.
- [ ] T044 [US1] Implement `src/api/migration.routes.ts` for POST/status and wire dependencies in `src/index.ts`; routes delegate to the service and follow exact OpenAPI DTOs. Acceptance: T020 passes, listener starts only with valid config/store/catalog/isolation, and requests cannot choose executable paths or framework overrides.
- [ ] T045 [US1] Complete `tests/integration/migration-core.test.ts` against T019 expected inventories and supported business scenarios for both frameworks; run all six real gates. Record blocked external prerequisites honestly in `specs/001-create-xelops-migrator/implementation-notes.md`; acceptance requires both representative generated apps passing, not a shell-only app.

Checkpoint: core transformation is independently verified. Finish US2/US3 before claiming delivery.

## Phase 4: US2 — Understand mapping decisions and migration results (P1)

Goal: complete and consistent JSON/Markdown reports, including remaining intervention.
Independent test: reconcile a mixed-status fixture with catalog/inventory in both formats.

- [ ] T046 [P] [US2] Add `tests/contract/report-api.test.ts` for JSON/default and format=md, pending 202, terminal 200, invalid format 400, authentication and unknown/expired 404. Acceptance: schema validation uses contracts/openapi.json rather than duplicated unchecked payload assumptions.
- [ ] T047 [P] [US2] Add `tests/unit/reporter.test.ts` with mapped/unmapped/manual-review, parse gaps, dependency decisions and behavior blockers; assert exact source/reason traceability and identical counts/findings across formats, including escaping source-supplied Markdown/HTML.
- [ ] T048 [US2] Complete `src/reporter/reporter.ts` for all report fields, catalog/profile/architecture revisions, analyzed/generated files, validation evidence and stages; reconcile counts and retain unknown coverage. Acceptance: every detected occurrence appears once; behavior findings never inflate UI mapping counts; no ZIP checksum is embedded.
- [ ] T049 [US2] Complete `src/reporter/markdown-renderer.ts` from the same report record with readable mapping tables, warnings/errors, validation and action reasons; bound/redact diagnostics and escape untrusted source text. Acceptance: T047 passes without maintaining a separate Markdown data model.
- [ ] T050 [US2] Implement `src/api/report.routes.ts` and register it in `src/api/app.ts` to serve only published reports in requested format or pending/error DTOs. Acceptance: T046 passes and private candidate report revisions cannot leak before publication.

Checkpoint: reporter/service tests prove both formats independently using typed attempt fixtures.

## Phase 5: US3 — Download and use the validated target project (P1)

Goal: verified archives atomically published with matching terminal reports.
Independent test: download a final archive, inspect exclusions and rebuild/exercise it in isolation.

- [ ] T051 [P] [US3] Add `tests/contract/download-api.test.ts` for authenticated final ZIP 200, active/failed 409, unknown/expired 404, correct media/disposition and cross-job isolation.
- [ ] T052 [P] [US3] Add `tests/integration/export.test.ts` for approved entries, unsafe path/secret exclusions, interrupted streams and tampered archive verification; require both report files and new target lockfile.
- [ ] T053 [US3] Implement `src/exporter/artifact-inventory.ts` with explicit approved file/hash list: one project root, source/assets/config/lockfile/README/reports; exclude node_modules/build/cache/tmp/logs/VCS/credentials. Acceptance: no unrestricted workspace walk determines ZIP contents.
- [ ] T054 [US3] Implement `src/exporter/zip-exporter.ts` and `scripts/verify-artifact.mjs` with Archiver streaming, awaited completion, reopened entry/hash validation and byte/SHA metadata. Acceptance: corruption, extra/missing entries and stream errors reject the artifact.
- [ ] T055 [US3] Complete success publication in `src/api/migration-service.ts` and `src/api/migration-store.ts`: require no required-behavior blocker, six passed gates, two reports and verified final ZIP before atomic terminal pointer. Acceptance: kill/fault injection before publication never exposes completed or a success candidate report.
- [ ] T056 [US3] Implement `src/api/download.routes.ts` final streaming with download leases and safe ID-to-artifact lookup; register in `src/api/app.ts`. Acceptance: T051/T052 pass; response starts only for verified available artifacts and cleanup cannot delete a leased file.

Checkpoint: US1+US2+US3 success path is usable; US4 remains required for production readiness.

## Phase 6: US4 — Diagnose failed and incomplete attempts (P2)

Goal: truthful failed outcomes with useful partial output and durable recovery.
Independent test: force each failure class, retrieve both reports, reject final download,
and obtain a labeled diagnostic archive whenever recoverable files/storage allow it.

- [ ] T057 [P] [US4] Add `tests/integration/failure-recovery.test.ts` for parse failure, required-behavior blocker, each gate failure, final-export failure, restart and report-storage outage; preserve original cause and prohibit false success.
- [ ] T058 [P] [US4] Add `tests/contract/diagnostic-api.test.ts` for diagnostic 200, unavailable 409, unknown/expired 404, auth and required INCOMPLETE-MIGRATION.md/partial-project/reports entries; final download of the same failed attempt remains 409.
- [ ] T059 [US4] Extend `src/exporter/zip-exporter.ts` for labeled diagnostic inventory and identical path/credential exclusions. Acceptance: recoverable partial files are packaged with both failed reports; diagnostics never share the final artifact path or change failed state.
- [ ] T060 [US4] Complete failure publication/restart in `src/api/migration-service.ts` and `src/api/migration-store.ts`: resume accepted queue; fail interrupted running jobs with PROCESS_INTERRUPTED; regenerate failed reports after export failure, attempt diagnostics and persist original plus secondary errors. Acceptance: T057 passes; diagnostic failure cannot block failure reports; storage outages retain recoverable journal for retry.
- [ ] T061 [US4] Add diagnostic endpoint in `src/api/download.routes.ts` and actual availability/checksums/expiry projection in `src/api/migration.routes.ts`. Acceptance: T058 passes and historical report outcome is not inferred from current artifact existence.
- [ ] T062 [US4] Implement `src/api/retention.ts`: hourly cleanup, artifacts after 24 hours, reports/status after seven days; skip active jobs/download leases, remove source/scratch after terminal publication and preserve intentional diagnostic contents. Acceptance: expiration changes availability, not historical completion; T057 includes fake-clock and active-download cleanup cases.
- [ ] T063 [US4] Run the complete failure matrix in `tests/integration/failure-recovery.test.ts` using real filesystem/container failures where applicable. Acceptance: every accepted attempt reaches retrievable honest reports after recovery; every recoverable failed partial attempt with working archive storage yields diagnostics.

## Phase 7: Integration, documentation and cross-cutting checks

- [ ] T064 Add `tests/integration/end-to-end.test.ts` and fixture ZIP creation in `tests/fixtures/create-archives.ts`; exercise all five API paths for both source frameworks, clean isolated rebuild and business scenarios. Acceptance: SC-001–SC-010 pass including native fallback, ambiguous mapping, unique IDs and no falsely available final ZIP.
- [ ] T065 Add `tests/integration/operational-limits.test.ts` and `tests/integration/performance.test.ts` for queue/rate/storage/byte/time limits and plan targets (metadata p95 <500 ms at 10 clients; post-upload ack <2 s for 10-MiB fixture; analyzer+mapper <30 s for 100 files/1 MiB on declared 4-vCPU/8-GiB host). Record host and results; do not report unmeasured targets as achieved.
- [ ] T066 Add `.github/workflows/ci.yml` and `tests/contract/architecture.test.ts` enforcing backend strict/lint/tests, module ownership, catalog hash/schema and real generated-project gates with securely provided prerequisites. Acceptance: missing required CI prerequisites fail the required job instead of silently bypassing it.
- [ ] T067 Update `README.md`, `specs/001-create-xelops-migrator/quickstart.md` and `specs/001-create-xelops-migrator/implementation-notes.md` with verified versions, commands, API examples, limits, supported adapters, catalog restrictions and measured checks. Run quickstart end-to-end and check all fifteen constitution principles; document any still-blocked task without checking it off.
- [ ] T068 Commit the completed implementation and documentation changes on the repository branch, push to `origin`, and record the commit SHA and validation summary in the pull request or review notes; do not mark unverified tasks complete merely because they were pushed.

## Dependencies and safe parallelism

Default: increasing ID order. Every story depends on T001–T018. Test-first tasks may be
red until their implementation dependencies land; all phase checkpoint tests must be green.

Critical chain:
T001–T018 → US1 (T019–T045) → US2 (T046–T050) → US3 (T051–T056)
→ US4 (T057–T063) → T064–T067.

Key prerequisites: catalog T009/T010 before mapper T029/T030; analysis T027 and mapper T030
before generator integration T038; sandbox T014/T015 before any untrusted processing;
generator template T031, admission policy T039 and compliance T040/validator T041 before
T042 executes real profile admission. T039 completes the policy/interface only; T042 owns
actual activation. T043 may use injected stage interfaces for tests; final wiring waits
for T050/T055/T060. US1 is not publicly completed at its checkpoint.

[P] means only the following disjoint test-authoring pairs may run concurrently once the
preceding foundation/phase is ready; production implementations remain sequential:

| Story | Parallel pair | Prerequisite | Independent completion check |
| --- | --- | --- | --- |
| US1 | T019 + T020 | T018 | Expected app inventory/behavior and HTTP contract tests defined |
| US2 | T046 + T047 | T045 | Report transport and format/count tests defined |
| US3 | T051 + T052 | T050 | Download contract and archive integrity tests defined |
| US4 | T057 + T058 | T056 | Recovery matrix and diagnostic transport tests defined |

Do not parallelize edits to package.json, shared domain models, app.ts, migration-service.ts,
migration-store.ts or the same fixtures. Tests using private per-test directories may run
concurrently; real acceptance jobs must respect declared container/resource limits.

## Requirement coverage

| Requirements | Tasks |
| --- | --- |
| FR-001–006, FR-025–027 | T006–T018, T019–T027, T043–T044 |
| FR-007–011, FR-028–029 | T009–T010, T028–T030, T038, T040 |
| FR-012–015, FR-030–031, FR-033–034 | T001–T003, T031–T040 |
| FR-016, FR-032 | T014–T015, T039–T042, T045 |
| FR-017–019 | T007–T008, T016, T046–T050 |
| FR-020–022, FR-035 | T051–T056, T064 |
| FR-023–024, FR-037–038 | T043, T055, T057–T063 |
| FR-036 | T020, T044, T046, T050–T051, T056, T058, T061 |
| SC-001–010 | T045, T047, T052, T057–T058, T063–T067 |

## Incremental delivery and handoff

First internal milestone: US1 core conversion against representative fixtures. The smallest
user-deliverable MVP includes US1+US2+US3 and mandatory US4 failure safeguards: the constitution
requires reports for every attempt and a downloadable ZIP for every success. Do not ship
a happy-path-only service while labeling failure handling optional.

For a lower-cost model, provide this prompt with the next task ID:

> Read tasks.md and the documents linked by the selected task. Implement only the selected
> task and any explicitly unfinished prerequisite. Preserve existing contracts and the catalog.
> Run its acceptance checks, then report changed files, exact tests/results and remaining
> blockers. Check the task only when its acceptance criteria pass. Do not broaden scope.

A blocked profile/catalog capability is not permission to invent an API or weaken validation.
Finish unrelated tasks, record the unavailable evidence precisely, and keep dependent tasks
unchecked. No task list can guarantee arbitrary-framework conversion; the supported fixtures,
conservative findings and real gates define what can honestly be delivered.
