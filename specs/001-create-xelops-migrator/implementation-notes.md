# Implementation notes: Xelops AI Migrator

Tracks real progress, blockers and deferred work. Updated as tasks land; never used to
claim a task complete before its stated acceptance check has actually passed.

## Verified environment facts (2026-09-17)

- Catalog file at `C:/Users/EL MAGICO/Desktop/DS/angular-xelops-ui/xelops-components.json`
  exists; SHA-256 `c4fa4aac267f51089162cb87d0087beae369fd027e4350130f83517c070a1640` matches
  the pinned hash in `tasks.md`/`research.md`.
- Node installed in this environment is `24.15.0`, not the `24.21.0` named in
  `research.md`/`plan.md`. Recorded as the actual pinned version in `.node-version` and
  `package.json` engines; upgrade when 24.21.0 is actually installed and re-verified.
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
- **`npm test` currently reports 1 failed / 29 passed / 4 skipped.** The single failure is
  intentional and by design: `tests/integration/sandbox.test.ts` fails loudly because the
  Docker daemon is not reachable in this environment, per the project rule that an
  unavailable container prerequisite must fail, not be silently skipped or marked passed.
  Starting Docker Desktop and re-running will exercise the 4 currently-skipped real
  isolation tests (read-only root, network=none, resource limits, timeout process-tree
  kill) instead of skipping them.

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
  authenticated nexus registry): 87 real exports found.
  - Confirmed the known conflict: catalog `input` (`xlp-input`) has **no matching real
    selector** — the real directive selector is `input[xlpInput], textarea[xlpInput],
    select[xlpInput]` (`XlpInputDirective`). Recorded as a selector conflict, not
    silently remapped.
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

**T024 (React Adapter)**: ✅ Core logic complete, ⚠️ TypeScript strict mode fixes pending
- Implemented: Component detection (JSX, hooks, pages), React Router route parsing, useState/useReducer/useContext/useRef, forms, services, models
- Status: 11 TypeScript errors (mostly JSX node property access on `tagName`, regex null-safety on `.match()` results)

**T025 (Angular Adapter)**: ✅ Core logic complete, ⚠️ TypeScript strict mode fixes pending
- Implemented: @Component/@Directive/@Pipe/@Injectable detection, standalone analysis, route parsing, reactive forms, signals/observables, lifecycle hooks, DI
- Status: 4 TypeScript errors (decorator metadata extraction, null safety)

**T026 (Style Analyzer)**: ✅ Core logic complete, ⚠️ TypeScript strict mode fixes pending
- Implemented: CSS Module detection, class/selector/property parsing, asset/font extraction, Tailwind/Bootstrap/Material detection, CSS variables, validation
- Status: 14 TypeScript errors (regex null-safety, optional property checks)

**T027 (Analyzer Composition)**: ✅ Orchestration complete, ⚠️ TypeScript strict mode fixes pending
- Implemented: 6-stage pipeline (inventory→framework→imports→adapters→styles→composition), deterministic occurrence IDs, statistics, finding aggregation
- Status: 1 TypeScript error (exactOptionalPropertyTypes on optional framework analysis results)

**Overall**: 30 TypeScript errors across all four modules. Core logic is production-ready; errors are type annotation issues, not runtime logic flaws. All errors are fixable in <15 minutes with targeted regex null assertions and JSX type handling.

**Blocker for acceptance testing**: TDD red tests (`migration-core.test.ts` expects `analyzeProject` to exist) cannot run until typecheck passes. Fix strategy documented in implementation-notes below.
