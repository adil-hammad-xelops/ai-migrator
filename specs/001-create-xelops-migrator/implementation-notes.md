# Implementation notes: Xelops AI Migrator

Tracks real progress, blockers and deferred work. Updated as tasks land; never used to
claim a task complete before its stated acceptance check has actually passed.

## Verified environment facts (2026-09-17)

- Catalog file at `C:/Users/EL MAGICO/Desktop/DS/angular-xelops-ui/xelops-components.json`
  exists; SHA-256 `c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640` matches
  the pinned hash in `tasks.md`/`research.md`.
- Node installed in this environment is currently `24.11.1`, below both the
  `>=24.15.0 <25.0.0` package engine floor and the `24.21.0` named in
  `research.md`/`plan.md`. Dependency installation currently emits `EBADENGINE`;
  upgrade Node and re-run all gates before treating this host as the verified baseline.
- Public npm registry (`https://registry.npmjs.org/`) is reachable; all backend
  (non-Xelops) dependencies installed cleanly with 0 reported vulnerabilities.
- Private registry `https://nexus.xelops.ma/repository/npm_repo` (hosts
  `@xelops-ui/angular@0.0.5`) is now reachable via a local `.npmrc` (scoped registry +
  `_auth` + `always-auth=true`, `strict-ssl=false`). Verified `npm view @xelops-ui/angular@0.0.5`
  resolves versions `0.0.1`-`0.0.5`; version 0.0.5 peers
  (`@angular/common@^20.3.15`, `@angular/core@^20.3.15`, `@angular/cdk@^20.2.14`,
  `tslib@^2.3.0`) match research.md exactly. Real profile admission (T010, T039, T042)
  and generated-project validation (T045, T064) can now be attempted for real.
  `.npmrc` is gitignored — it embeds a live credential and must never be committed.
  `strict-ssl=false` disables TLS certificate validation for **all** npm registry
  traffic, not just nexus; this is a real security trade-off, not just a nexus fix,
  and should be narrowed (e.g. a trusted CA bundle) once nexus's certificate chain is
  fixed on the registry side.
- Docker is installed (`29.3.1`), available for sandboxed validation (T014/T015), not yet
  exercised by an implementation task.

## Completed tasks

- [x] T001 — package.json/lockfile created; `npm install` clean, 0 vulnerabilities;
  `.node-version` and `.gitignore` added; requested `src/`, `tests/`, `profiles/`,
  `scripts/` directories created.
- [x] T002 — `tsconfig.json`/`tsconfig.build.json` with strict + noUncheckedIndexedAccess +
  exactOptionalPropertyTypes + useUnknownInCatchVariables; probe (`obj[0].a` without a
  guard) failed compilation as required, then was removed; real source compiles clean.
- [x] T003 — `eslint.config.mjs` typed flat config with no-explicit-any/no-unsafe/no
  double-assertion/no-disable-comment rules; probe (`(x: any) => x`) failed lint as
  required, then was removed; `npm run lint` is clean on current source.
- [x] T004 — `vitest.config.ts` with separate unit/contract/integration/generated-project
  suites; `passWithNoTests: false` confirmed — running with no test files exits 1, not 0.
- [x] T005 — `.env.example` and `README.md` document all required env vars (no defaults for
  secrets/paths), scripts, and the focused-test invocation pattern.

## Blocked / not yet started

- Phase 2 (Foundation, T001-T018) is now fully implemented. US1 (T019+) has not started.
- Real profile *activation* (installing `@xelops-ui/angular` into a generated project and
  running the six gates) remains separate from the *evidence verification* done in T010 and
  is still pending T039/T042.
- **`npm test` currently reports 2 failed files / 50 passed tests / 4 skipped tests.** One
  expected-red contract suite cannot import `src/api/migration.routes.ts` until T044. The
  other failure is intentional and by design: `tests/integration/sandbox.test.ts` fails
  loudly because the Docker daemon is not reachable, per the rule that an unavailable
  container prerequisite must fail rather than silently pass. Starting Docker Desktop
  will exercise the 4 skipped isolation tests (read-only root, network=none, resource
  limits, timeout process-tree kill) instead of skipping them.

## T014/T015 real status (2026-09-17)

- `docker` CLI is installed (`29.3.1`) but **Docker Desktop's daemon is not running** in
  this environment (`com.docker.service` is `Stopped`; no `Docker Desktop` process).
  Verified: `runSandboxPhase` correctly fails closed (`exitCode 1`, daemon-connection
  error surfaced verbatim, **no host execution occurred** — the requested `node --version`
  never actually ran on the host).
  - **Not yet verified for real**: read-only root fs, `--network=none` isolation,
    `--cap-drop=ALL`/non-root enforcement, CPU/memory/pids limits, and timeout-triggered
    `docker kill` process-tree cancellation. These require a running daemon. Start Docker
    Desktop and re-run before trusting T014/T015's isolation guarantees in production.
  - `profiles/angular20/Dockerfile` is written (Node 24.15.0, non-root `sandbox` user,
    no entrypoint/shell) but has not been built or pulled/tested in this session.

## T009/T010 real findings (2026-09-17)

- Catalog loader (`src/catalog/catalog-loader.ts`): 74 entries, hash verified, 7 entries
  flagged `CATALOG_NO_MEMBERS` (e.g. `kbd`) since they declare no inputs/outputs.
- Package evidence (`src/catalog/package-evidence.ts`), built by parsing the real pinned
  `profiles/angular20/xelops-ui-angular-0.0.5.d.ts` (captured via `npm pack` through the
  authenticated nexus registry): 90 real exports found. The declaration parser is
  quote-aware so commas inside compound selectors do not split generic arguments.
  - Confirmed the known conflict: catalog `input` (`xlp-input`) differs from the real
    directive selector `input[xlpInput], textarea[xlpInput], select[xlpInput]`
    (`XlpInputDirective`). Both concrete selectors are recorded in the conflict; the
    mapper does not silently remap them.
  - Also discovered (not previously called out in research.md) that `dialog`,
    `data-table`, `virtual-list` and `sortable-list` catalog entries have **no matching
    real selector** either — the real package implements dialogs via
    `XlpDialogService` + structural directives, not a `xlp-dialog` component, and the
    other three use different real selectors/APIs. These four are recorded as
    selector conflicts alongside `input`; mapper (T029/T030) must treat all five as
    manual-review rather than guessing a replacement.
  - 4 catalog members have no real counterpart: `divider.label`, `progress.label`,
    `metric-bar.max`, `code-block.showCopy` — recorded as unverified, not removed from
    the catalog (catalog stays authoritative and unedited).

## T024-T027 Status: Core analyzer pipeline (2026-09-17)

**T024 (React Adapter)**: Complete
- Implemented: component/JSX/hook/page detection, React Router JSX routes with source files, state hooks, enclosing-component form evidence, services and models.
- Verified: strict typecheck and lint pass; fixture routes, pages, shared components, models, services, form fields, styles and native UI role counts are asserted.
- Verified: real component/route spans plus source-linked findings for dynamic route paths and conditional/nested hook timing.

**T025 (Angular Adapter)**: Complete
- Implemented: decorator/standalone/service analysis, lazy routes including the empty root path with source files, `FormBuilder.group` controls/validators, signals/observables, lifecycle hooks and DI.
- Verified: strict typecheck and lint pass; fixture routes/pages/shared components/models/services/forms are asserted.
- Verified: exact Angular 20.3 compiler parser handles inline/external templates with elements, bindings, events and spans; dynamic/unavailable/malformed templates produce source-linked coverage findings. Component providers and injectable scope remain represented.

**T026 (Style Analyzer)**: Complete
- Implemented: CSS Module detection, class/selector/property parsing, asset/font extraction, Tailwind/Bootstrap/Material detection, CSS variables, validation
- Verified: strict typecheck/lint pass and fixture CSS Module/global-style inventory is retained.
- Verified: exact PostCSS/SCSS/selector/value parsers replace structural regex parsing; nested SCSS, declaration lists, custom-property usage, URLs and parse failures have focused tests, with no uploaded plugin execution.

**T027 (Analyzer Composition)**: Complete
- Implemented: 6-stage pipeline (inventory→framework→imports→adapters→styles→composition), deterministic occurrence IDs, statistics, finding aggregation
- Verified: strict typecheck/lint pass; analyzed-file and unparsed-region accounting now use disposition/roles correctly; route source files and Angular routed pages survive composition.
- Verified: canonical React/Angular UI occurrences include semantic roles and source evidence, IDs derive from path/span rather than traversal order, complete fixtures are stable across repeated runs, and unresolved dynamic routes force partial coverage without discarding parsed UI.

**Overall**: T024-T027 are complete. Strict typecheck, full lint, build, focused adapter tests, complete fixture inventories and partial-coverage failure behavior all pass.

## T028-T030 Status: Evidence-gated mapper (2026-09-17)

- Added catalog and mapper unit coverage for all FR-028 source intents, the concrete
  input selector conflict, unknown event payloads, incompatible required behavior and
  ambiguous package evidence. Assertions prohibit invented selectors, members and tokens.
- Compatibility uses only the eight FR-028 catalog candidates. Checkbox/radio roles are
  determined before generic inputs; member translations require verified package evidence;
  CVA, radio grouping, select option composition, dialog service behavior, semantic card
  intent and accessibility/state requirements stay explicit.
- Mapping emits exactly one deterministic decision per unique UI occurrence. Only a fully
  compatible result selects a target; known incompatibility is unmapped, while conflicts
  and unknowns are manual-review. There are no confidence scores or visual substitutions.
- Verification: 29 unit tests, strict typecheck, full lint and production build all pass.

## T031 Status: Angular architecture v1 template (2026-09-17)

- Added a versioned Angular 20.3 target under `src/generator/templates/angular-v1`
  with exact package/tool versions, production Angular build configuration, strict
  TypeScript, `strictTemplates`, Angular ESLint and a non-watch Jasmine/Karma smoke test.
- The standalone root composes an eager application layout and lazy `home` feature routes.
  All required `core`, `shared`, `features/<feature>` and `layouts` ownership directories
  are present; later emitters populate these fixed destinations rather than copying source
  folder layout.
- Template assets are excluded from backend TypeScript/lint compilation and are checked by
  focused structural tests. Backend strict typecheck, lint, build and all 31 unit tests pass.
- Real target dependency installation and Angular compilation remain intentionally owned by
  profile admission and generated-project validation tasks T039-T042.
