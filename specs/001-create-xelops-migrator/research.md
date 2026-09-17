# Research: Xelops AI Migrator

Date: 2026-09-17. Feature: [spec.md](spec.md). Scope: Phase 0 design decisions;
no backend implementation, dependency installation, or generated-project build has run.

## 1. Runtime and compiler

**Decision:** Node.js 24.21.0 LTS and TypeScript 5.9.3 for the backend, native ESM,
strict compiler options, typed lint, and explicit boundary decoding from unknown.
The generated application's compiler is installed in its own workspace, never taken
implicitly from the backend executable search path.

**Rationale:** Both exact releases are verified. TypeScript 5.9.3 fits the Angular 20.3
compiler range and typescript-eslint support range. Compiler API availability is needed
for analysis and AST emission. Runtime and package locks must be refreshed at admission
if support/security evidence invalidates this baseline.

**Alternatives:** Node 22 has a shorter support runway; Node 26 is not the chosen LTS.
Node 20 is EOL even though an Angular version range admits it. TypeScript 6 requires a
separate target compiler; TypeScript 7 is not selected because its release announcement
states that the programmatic API is not available.

Evidence: [Node 24.21.0 release](https://nodejs.org/en/blog/release/v24.21.0),
[Node lifecycles](https://nodejs.org/en/about/previous-releases),
[TypeScript 5.9.3](https://github.com/microsoft/TypeScript/releases/tag/v5.9.3),
[typescript-eslint compatibility](https://typescript-eslint.io/users/dependency-versions/),
[TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

## 2. Real Xelops package and admitted target profile

**Decision:** Candidate target profile: Angular/CLI/compiler/build 20.3.x (framework
packages at least 20.3.15), CDK 20.x satisfying ^20.2.14, TypeScript 5.9.3,
RxJS 7.8.x, Node 24.21.0, and candidate @xelops-ui/angular 0.0.5.
Resolve exact mutually compatible stable patches and integrity hashes into a reviewed
profile lock before enabling successful generation. Do not use floating latest at runtime.

**Evidence:** The sibling library's private root manifest says 1.9.1. Its
[distributable manifest](../../../../DS/angular-xelops-ui/projects/xelops-ui/package.json)
and [built manifest](../../../../DS/angular-xelops-ui/dist/xelops-ui/package.json)
instead identify @xelops-ui/angular 0.0.5, with common/core peers ^20.3.15,
CDK ^20.2.14 and tslib ^2.3.0. The declared publishing registry is
https://nexus.xelops.ma/repository/npm_repo. A local dist directory does not prove the
package is available from that registry. No registry credentials were inspected.

**Rationale:** The [Angular compatibility table](https://angular.dev/reference/versions)
admits Node 24 and TypeScript >=5.8 <6 for Angular 20.3. Angular 20 LTS ends
2026-11-28 according to the [support schedule](https://angular.dev/reference/releases).
Profile admission must expire by that date unless a supported replacement is verified.

**Activation evidence required:** registry availability and integrity, actual package peer
resolution, public-export audit, a clean consumer build, and all six target checks.
A supplied local package can support developer diagnostics but cannot stand in for a
reproducibly downloadable final project's approved distribution.

**Alternatives:** Angular 22 is outside the verified package peer range. Workspace version
1.9.1 cannot be used as the distributable version. Guessing a package named ng-xelops is
forbidden; ng-xelops is the product label, while catalog imports are @xelops-ui/angular.

## 3. Catalog authority and an observed conflict

**Decision:** Pin the supplied 74-entry catalog by SHA-256
C4FA4AAC267F51089162CB87D0087BEAE369FD027E4350130F83517C070A1640.
During implementation, copy its unchanged bytes into src/catalog/xelops-components.json.
The external catalog is never edited by migration execution.

The catalog says input.selector = xlp-input and describes an attribute directive.
The built declaration at dist/xelops-ui/index.d.ts:173 instead declares
input[xlpInput], textarea[xlpInput], select[xlpInput].
Therefore input/textarea candidates have CATALOG_SELECTOR_CONFLICT and remain
manual-review with native elements retained. Do not silently substitute xlpInput, and
do not infer a new select mapping from the implementation.

Public declarations can verify symbols and reject incompatible use of catalog-listed
members. They cannot expand component/member allowlists or substitute for absent
behavioral contracts. Missing variant values, event semantics, option projection,
accessibility forwarding, or form semantics limit only dependent mappings.
No numeric confidence score can approve them.

**Alternatives:** Editing the catalog automatically or treating package discovery as a
second component catalog violates the constitution. Globally rejecting all migrations
for one conflicting entry unnecessarily prevents safe partial conversion.

## 4. Angular architecture and styles

**Decision:** Use owner-approved architecture v1 in spec FR-012, standalone application
components, eager shell, lazy feature routes and typed reactive forms. Preserve nullability,
reset behavior and existing asynchronous semantics. Use strictTemplates in target projects.
Generate a versioned, fixture-tested target template rather than invoking arbitrary source
scaffolding scripts during each job.

Local [token sources](../../../../DS/angular-xelops-ui/projects/xelops-ui/src/tokens/)
and [styles](../../../../DS/angular-xelops-ui/projects/xelops-ui/src/styles.scss) exist.
Built package exports currently expose only the root and package.json, not stylesheet
subpaths. Token substitutions remain disabled until packaged asset integration and an
explicit semantic equivalence rule are verified; retain safe source CSS/SCSS meanwhile.

**Alternatives:** Copying source folder structures, converting all state to signals, or
substituting tokens by equal numeric/color values can change behavior. Signal Forms
are not required by the accepted specification.

Evidence: [standalone guidance](https://angular.dev/guide/ngmodules/overview),
[typed forms](https://angular.dev/guide/forms/typed-forms),
[route loading](https://angular.dev/guide/routing/loading-strategies).

## 5. HTTP and persisted asynchronous lifecycle

**Decision:** Fastify 5 with compatible @fastify/multipart, server-owned request/response
schemas and explicit route types. Stream the project upload to durable storage before 202.
One backend instance and one active migration worker; queued jobs persist on local disk.
Use UUID identifiers, per-job immutable revision directories and an atomic published-pointer
file. No database or queue service for the MVP.

**Rationale:** Streaming avoids whole-upload memory growth. Typed schema validation and
a durable per-job journal support explicit state transitions and crash recovery.
Multipart limits are configured explicitly; truncated uploads return 413.

**Alternatives:** Express requires more validation conventions; Nest adds scaffolding
unnecessary for the requested directory structure. In-memory job maps lose accepted
migrations. Multipart temporary-upload helpers whose files disappear after the response
are inappropriate for durable jobs.

Evidence: [Fastify TypeScript](https://fastify.dev/docs/latest/Reference/TypeScript/),
[Fastify lifecycle](https://fastify.dev/docs/latest/Reference/LTS/),
[multipart plugin](https://github.com/fastify/fastify-multipart).

## 6. Analysis and transformations

**Decision:** TypeScript compiler API parses TS/JS/JSX/TSX and resolves source symbols and
imports. Version-matched @angular/compiler parses Angular templates. Native CSS is parsed
with PostCSS; SCSS syntax support and Sass compilation are admitted build tools, never
uploaded plugins. Maintain a typed normalized representation plus source spans and evidence.
Do not execute source configuration, imports, tests, or package scripts to discover structure.

Initial verified adapters target React 18/19 browser bootstraps and Angular 20 browser apps.
Other Angular/React versions are detected and inventoried, but transformations requiring an
unverified version adapter become review findings or SOURCE_VERSION_UNSUPPORTED.
Basic syntax recognition is not a claim of full framework compatibility.
React Router 6/7 declarative route patterns require adapter fixtures; dynamic/server routes
are review findings. No SSR or server-component reconstruction.

**Alternatives:** Text replacement cannot preserve bindings and business semantics.
Babel can parse more syntax but introduces a second AST; add it only for an evidenced gap.
Unrestricted model-generated output is not part of this deterministic MVP.

Evidence: [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API),
[Angular template parser](https://github.com/angular/angular/blob/main/packages/compiler/src/render3/view/template.ts),
[PostCSS](https://github.com/postcss/postcss).

## 7. Archive intake and export

**Decision:** Use yauzl with lazy entry iteration, decoded strict filenames and entry-size
validation. Reject traversal, absolute/drive/UNC paths, symlinks/special files, duplicate or
case-colliding destinations, encrypted entries, and quota overruns. Count actual expanded
bytes, not only advertised ZIP sizes. Export with Archiver 8.0.0 over an explicit allowlist,
await stream completion, reopen the archive and verify its inventory.

**Alternatives:** Loading whole archives into memory or walking arbitrary directories
during export makes resource limits and artifact exclusions unreliable.

Evidence: [yauzl](https://github.com/thejoshwolfe/yauzl),
[Archiver releases](https://github.com/archiverjs/node-archiver/releases),
[Archiver API](https://www.archiverjs.com/docs/archiver/).

## 8. Isolation, installation and validation

**Decision:** Linux disposable unprivileged containers, with read-only root, explicit
workspace mounts, no host credentials or container-management socket inside jobs, dropped
capabilities and bounded CPU/memory/process/time resources. Windows development uses a
Linux container runtime; no host-execution fallback when isolation is unavailable.

An isolated install step uses only approved target dependencies, generated lockfiles,
npm ci --ignore-scripts --strict-peer-deps and restricted registry access.
Source package lifecycle scripts are never executed. Build/test containers have no network
or registry credentials. Required tool bootstrap actions must be backend-owned and explicitly
allowlisted; installation failure is not permission to enable arbitrary scripts.

**Rationale:** Parsing, generated code and third-party tool execution process hostile input.
Node permissions and worker threads are not security isolation.
Use a controlled local executable and argument array with shell disabled for each check.

**Alternatives:** Host npm install/build, docker socket mounts in jobs, or merely switching
working directories cannot satisfy source-isolation requirements.

Evidence: [Node permission limitations](https://nodejs.org/api/permissions.html),
[container security](https://docs.docker.com/engine/security/),
[npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

## 9. Validation and test strategy

**Decision:** All six spec gates are mandatory: installation, strict TypeScript, Angular
production build, lint, target tests and Xelops compliance. Backend tests use Vitest;
target tests use a supported Angular-20-compatible builder (CLI Karma/Jasmine baseline),
with route/bootstrap smoke tests and transformation-specific business assertions.
Choose actual compatible package patches in the implementation lock, not an assumed
current Vitest major. Tests/linters cannot be skipped to make a migration successful.

ESLint plus typescript-eslint enforce no-explicit-any, no-unsafe rules and suppression
restrictions. Compiler settings add noUncheckedIndexedAccess, exactOptionalPropertyTypes
and useUnknownInCatchVariables to strict. Meaningful adapter fixtures compare business
outcomes, not just emitted text.

**Alternatives:** Compiler strict mode alone permits explicit any. Backend unit success
does not establish that generated Angular applications compile or preserve behavior.

Evidence: [Vitest prerequisites](https://vitest.dev/guide/),
[typed lint compatibility](https://typescript-eslint.io/users/dependency-versions/),
[Angular 20 testing](https://v20.angular.dev/guide/testing).

## 10. Remaining readiness conditions, not unresolved design choices

Design policy is resolved: missing evidence disables the dependent capability or target
profile; it never relaxes a success gate. Foundation/API/reporting/analysis tasks can be
planned immediately. Successful-generation integration requires verified registry/package
access, exact locked profile versions, theme integration if used, and a full six-gate smoke
run. Correcting/enriching catalog metadata remains an owner-controlled input change.

Fastify/multipart/yauzl/PostCSS/ESLint/Vitest patch versions were not fetched from a registry
during planning. Implementation must resolve supported stable versions, record integrities,
and run compatibility checks before accepting their lockfile. This document does not claim
unexecuted installs or builds passed.
