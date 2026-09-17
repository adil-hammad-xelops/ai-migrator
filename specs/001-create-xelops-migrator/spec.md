# Feature Specification: Xelops AI Migrator

**Feature Branch**: Not created; this workspace has no Git branch-creation hook.

**Feature Directory**: `specs/001-create-xelops-migrator`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Create Xelops AI Migrator. Receive an AI-generated React
or Angular frontend project; analyze its complete structure; normalize and map UI elements
against the Xelops catalog; reconstruct a standardized Angular application using ng-xelops;
validate it; produce migration-report.json, migration-report.md, and a downloadable project
ZIP; expose backend APIs to start migrations, retrieve reports, and download ZIPs."

**Governing document**: [Xelops AI Migrator Constitution](../../.specify/memory/constitution.md),
version 1.0.0.

The primary user is a developer or an integrating application acting for that developer.
The feature delivers a traceable migration from a complete source application to a usable
target application, with explicit disclosure of unsupported behavior and required review.
All six pipeline stages are in scope:
**Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter**.

## Clarifications

### Session 2026-09-17

- Q: Should the folder structure in the existing backend prompt become the official
  Xelops Angular architecture for this migrator? → A: Yes. Adopt that structure as
  the official architecture v1, as confirmed by the project owner.
- Q: When a partially generated project fails validation, should developers also be able
  to download its unfinished files? → A: Yes. Offer a separate diagnostic ZIP containing
  partial files and both reports; the migration remains failed and the normal validated
  project download remains unavailable.
- User directive: The supplied `xelops-components.json` is the only allowed catalog
  for Xelops component availability; examples and source component names cannot expand it.
- Clarified defaults: use evidence-based framework detection, deterministic mapping
  statuses without numeric confidence scores, isolated partial progress with explicit
  coverage, and all six validation gates before a final project download. Technical
  choices not needed to define product behavior are handed to the implementation plan.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Migrate a complete frontend application (Priority: P1)

As a developer, I submit an AI-generated React or Angular project and receive a
standardized Angular application using compatible ng-xelops components, while preserving
the application's supported business behavior.

**Why this priority**: Reconstructing a complete application is the product's central
value; replacing isolated tags does not satisfy the requested migration.

**Independent Test**: Submit one representative React project and one representative
Angular project, each with known pages, routes, forms, services, models, styles, UI
elements, and business behaviors. Verify their generated applications and migration
outcomes against that inventory.

**Acceptance Scenarios**:

1. **Given** a valid React project and available authoritative Xelops inputs, **When**
   a migration is started, **Then** a unique migration identifier is returned, the source
   is recognized as React, and a standardized Angular target is reconstructed.
2. **Given** a valid Angular project with a different source layout, **When** it is
   migrated, **Then** the target follows the official Xelops Angular architecture rather
   than copying the arbitrary source layout.
3. **Given** a project containing pages, components, routes, forms, services, models,
   styles, and UI elements across multiple files, **When** analysis completes, **Then**
   all known items in the acceptance fixture are represented with source traceability,
   including relationships needed to reconstruct navigation and behavior.
4. **Given** compatible source routing conditions, service calls, state transitions,
   form validation, and event handlers, **When** the target is exercised, **Then** the
   defined business scenarios produce the same observable results.
5. **Given** source behavior that cannot be represented safely in the target, **When**
   generation proceeds, **Then** the report identifies the affected source and reason,
   and no silently removed logic or placeholder behavior is claimed as preserved.
6. **Given** a generated project, **When** it is assessed for completion, **Then** actual
   dependency installation, TypeScript validation, Angular production build, lint,
   target tests, and Xelops compliance must pass; disabled checks, missing dependencies,
   or skipped mandatory validation cannot produce a successful outcome.
7. **Given** a generated project and its recorded dependency choices, **When** compliance
   is reviewed, **Then** strict typing is enabled, no explicit or implicit `any` is
   present in owned or generated code, and selected versions have official evidence
   of stable release, support, and compatibility.
8. **Given** a manifest listing both frameworks but only one reachable framework bootstrap,
   **When** the source is classified, **Then** the bootstrap and corroborating evidence
   determine its framework; a dependency or JSX extension alone cannot do so.
9. **Given** application source outside `src`, installed dependencies, build output,
   lockfiles and a required generated source file, **When** analysis runs, **Then** owned
   source is covered, exclusions carry reasons, lockfiles supply dependency evidence only,
   and the required generated file is analyzed or reported as unresolved.

---

### User Story 2 - Understand mapping decisions and migration results (Priority: P1)

As a developer, I retrieve a migration's report to understand what was detected,
converted, retained, or left for manual intervention, and why.

**Why this priority**: Developers must be able to trust migration decisions and identify
remaining work without reverse engineering the generated project.

**Independent Test**: Use a source fixture containing compatible, unsupported, and
ambiguous UI elements, plus an unavailable business transformation. Retrieve both report
formats and reconcile every item against the source inventory and catalog snapshot.

**Acceptance Scenarios**:

1. **Given** a native button, input, or select whose required behavior has exactly one
   verified compatible catalog mapping, **When** mapping completes, **Then** it is
   `mapped` to that catalog entry. The example targets `xlp-button`, `xlp-input`,
   and `xlp-select` are used only if the authoritative catalog verifies them.
2. **Given** a source component without a compatible Xelops equivalent, **When** mapping
   completes, **Then** it is `unmapped`, with its source file and reason reported.
3. **Given** a source element with uncertain equivalence or conflicting candidates,
   **When** mapping completes, **Then** it is `manual-review`, its ambiguity and available
   catalog-backed candidates are reported, and no uncertain replacement is applied.
4. **Given** a completed attempt, **When** its reports are retrieved, **Then**
   `migration-report.json` and `migration-report.md` describe the same results,
   validation outcomes, warnings, errors, and remaining work.
5. **Given** a mixture of mapping statuses, **When** the report is read, **Then** the
   mapped, unmapped, and manual-review counts sum to the detected UI element count,
   and each item can be traced to its source.
6. **Given** retained native or custom elements that satisfy target requirements,
   **When** the generated project passes validation and export, **Then** the migration
   may complete while its unresolved mapping statuses remain clearly visible.
7. **Given** the supplied catalog's input directive and incomplete select/dialog metadata,
   **When** candidate decisions are produced, **Then** input and textarea retain native
   hosts, no textarea/modal/option component is invented, and required missing composition
   or behavior contracts result in manual-review instead of guessed generated APIs.
8. **Given** source styles without verified Xelops tokens and a React-only library,
   **When** migration decisions are reported, **Then** safe styles remain with their
   owners, no token is invented, and library removal is claimed only when dependent
   behavior is translated; otherwise its blocked behavior is explicitly identified.
9. **Given** two plausible catalog candidates or an unknown required event payload,
   **When** the mapper evaluates them, **Then** the result remains manual-review regardless
   of visual similarity; a proven required-feature incompatibility yields unmapped when
   no other compatible candidate exists.

---

### User Story 3 - Download and use the validated target project (Priority: P1)

As a developer, I download a complete project archive that includes the migrated
application and both reports, so I can build and continue developing the result.

**Why this priority**: A migration is not delivered until the developer can retrieve and
use its output.

**Independent Test**: Use an available migration result, download its ZIP through the
backend, extract it into a clean workspace, and verify the included configuration,
reports, build, and representative application behavior.

**Acceptance Scenarios**:

1. **Given** a project that meets architecture and typing requirements and passes all
   required validation, **When** export succeeds, **Then** its migration becomes
   `completed` only after a readable ZIP is available for download.
2. **Given** a completed migration, **When** its ZIP is downloaded and extracted,
   **Then** it contains the final Angular source, required assets, project and dependency
   configuration, resolved dependency information, and both named migration reports.
3. **Given** an extracted project and its documented supported prerequisites, **When**
   the developer installs the declared dependencies and builds it, **Then** it builds
   without manual repair of generated source or configuration.
4. **Given** an unknown identifier, an active migration, or a failed migration,
   **When** a ZIP download is requested, **Then** the caller receives the corresponding
   not-found or not-available outcome and no misleading successful artifact response.
5. **Given** source dependencies, temporary files, credentials and a valid generated project,
   **When** the final ZIP is inspected, **Then** it includes only the project inventory
   in FR-035, both reports and the newly generated lockfile, with the required exclusions.

---

### User Story 4 - Diagnose failed and incomplete attempts (Priority: P2)

As a developer, I receive a clear failure result and reports when the system cannot
complete a migration, so I know what needs correction before submitting another attempt.

**Why this priority**: Failure diagnosis makes the backend usable on real projects and
prevents incomplete output from being mistaken for a successful migration. P2 orders
delivery; these failure requirements remain mandatory for release.

**Independent Test**: Exercise invalid source input, unsupported frameworks, analysis and
generation failures, unavailable authoritative inputs, validation failure, and export
failure. Verify the failed stage, skipped dependent stages, report availability, and
absence of a successful download outcome.

**Acceptance Scenarios**:

1. **Given** a received submission containing a corrupt or incomplete project archive,
   **When** input checks fail, **Then** an identified failed attempt and both reports
   explain the cause without invoking dependent migration stages.
2. **Given** a project with an unsupported or indeterminate framework, **When** analysis
   cannot establish a supported source, **Then** the attempt fails with the reason and
   does not claim a reconstructed application.
3. **Given** missing or invalid authoritative catalog or architecture inputs, **When**
   the affected stage would run, **Then** the migration fails with an actionable
   dependency error instead of inventing component definitions or target standards.
4. **Given** an analysis, mapping, generation, or validation failure, **When** the attempt
   terminates, **Then** both reports identify the failure, preserve available results,
   and distinguish failed stages from stages skipped because of that failure.
5. **Given** successful validation followed by a compression or download-availability
   failure, **When** the attempt terminates, **Then** it is `failed`, its retrievable
   reports reflect the export failure, and it is never announced as `completed`.
6. **Given** an active migration or an identifier that does not exist, **When** its report
   is requested, **Then** the caller receives an explicit pending or not-found response
   rather than an empty successful report or another migration's data.
7. **Given** two distinct submissions or a submission attempting to access resources
   outside its permitted scope, **When** processing runs, **Then** original inputs and
   other migrations remain unchanged and inaccessible, and any prohibited operation
   is prevented and reported as a failure.
8. **Given** a failed attempt with recoverable partial generated files, **When** its
   diagnostic ZIP is downloaded, **Then** the archive is clearly labeled incomplete,
   includes both failure reports and remaining-work guidance, and does not make the
   attempt completed or enable the normal final-project download.
9. **Given** a failure before any target files exist, or failure to create a diagnostic
   ZIP, **When** status is retrieved, **Then** both reports remain the primary failure
   output and diagnostic download is explicitly unavailable rather than promised.
10. **Given** one unparseable file among readable files, **When** analysis runs, **Then**
    independent analysis continues with unknown coverage reported for that file; a proven
    unused file need not block completion, but a required file or uncertain reachability
    prevents a falsely complete application and permits only diagnostic partial delivery.
11. **Given** the minimal API operations, **When** a project is submitted and polled,
    **Then** durable acceptance returns 202, known status returns 200, a pending report
    returns 202, an unknown identifier returns 404, and a known unavailable artifact
    returns 409; final and diagnostic artifact availability are distinguished.

### Edge Cases

- An empty archive, invalid archive, missing application entry information, or a project
  containing only generated build output fails with a source-input reason.
- Multiple application roots or conflicting framework evidence are not silently resolved:
  the attempt reports that an unambiguous source application must be supplied.
- Unsupported syntax or unreadable source files are reported with their source locations;
  if they prevent safe reconstruction, generation cannot be declared complete.
- Dependency directories and build artifacts are excluded from application analysis;
  application-owned source, configuration, styles, and required assets are accounted for.
- Identical-looking UI elements can have different behavior; each source occurrence
  receives its own mapping decision rather than a forced tag-wide replacement.
- A known component with incompatible properties, events, or form behavior is `unmapped`;
  uncertain compatibility is `manual-review`, even if its tag resembles a catalog entry.
- Missing catalog input/output arrays, types, allowed values, exported symbols, option
  composition or accessibility contracts are missing evidence, not permission to infer
  an API. An explicit empty array limits declared custom members; it does not establish
  undocumented DOM forwarding or content-projection behavior.
- A project with zero detected UI elements reports zero mapping counts and still undergoes
  the applicable project reconstruction, validation, and delivery checks.
- Source business logic may contain `any`; input remains analyzable, but generated code
  must meet the constitution's typing rules and report unsupported transformations.
- Missing dependencies, unavailable validation tools, timeouts, or build failures prevent
  successful completion; they cannot be relabeled as successful or skipped validation.
- A catalog or architecture revision changing during a migration does not change the
  authoritative snapshot already selected for that attempt.
- Separate migration identifiers must not share source files, reports, or output archives.
- Submitted archive paths or source-controlled build behavior must not access unrelated
  migrations, host files, or credentials outside the migration's permitted resources.
- A diagnostic ZIP is recovery output for a failed attempt, never a successful final
  project. A failure to package it leaves reports available and is reported separately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST provide an API capability to receive a complete frontend
  project and start a migration, initially supporting React and Angular source projects.
- **FR-002**: Each received migration submission MUST receive a unique identifier before
  project validation. The start result MUST identify the attempt and its current state.
  States MUST distinguish `accepted`, `running`, `completed`, and `failed`; accepted
  or running responses MUST NOT imply that validation or export has succeeded.
- **FR-003**: The system MUST validate source readability and completeness, detect the
  framework, and report unsupported, conflicting, or indeterminate sources rather than
  silently choosing a framework. Detection MUST combine declared dependencies and
  configuration with a reachable application bootstrap: React dependencies plus React
  rendering/import evidence, or Angular dependencies plus Angular bootstrap/decorator
  evidence and applicable workspace configuration. JSX, a filename, a folder name, or
  a dependency alone is insufficient. Both frameworks in dependencies are not a conflict
  when only one application bootstrap is active; genuinely mixed bootstraps or unresolved
  entrypoints MUST be reported as unsupported or indeterminate, not guessed.
- **FR-004**: The Analyzer MUST inventory the whole application, including pages,
  components, routes, forms, services, models, styles, UI elements, layouts, API calls,
  and state behavior, with source references and relationships needed for reconstruction.
- **FR-005**: Analysis MUST produce normalized UI descriptions that retain each occurrence's
  identity, source location, element type, properties, events, content, styles, and
  applicable form and accessibility semantics.
- **FR-006**: Each migration MUST use identified, consistent snapshots or revisions of
  the authoritative Xelops component catalog and official Angular architecture standard.
  An unavailable catalog, invalid JSON/root schema, conflicting duplicate definitions,
  or absent architecture authority MUST fail dependent work with a report. An individual
  catalog entry with incomplete metadata MUST instead limit the affected mapping and
  be reported; it MUST NOT prevent independent entries from being considered.
- **FR-007**: The Mapper MUST assign exactly one of `mapped`, `unmapped`, or
  `manual-review` to every detected UI occurrence:
  - `mapped`: exactly one catalog-backed transformation satisfies every required source
    property, event, state, form, accessibility, and composition constraint, with no
    unresolved required metadata. A transformation can compose explicitly listed entries,
    such as radio plus radio-group; that is one decision, not ambiguous alternatives.
  - `unmapped`: no catalog candidate exists, or all candidates have a proven incompatibility
    with a required source feature. Missing metadata alone is not proof of incompatibility.
  - `manual-review`: candidate selection, source intent, target capabilities, event
    payloads, permitted values, accessibility forwarding, or composition remains uncertain.
    Multiple plausible transformations MUST NOT be resolved by tag similarity or scoring.
  Candidate discovery MUST remain distinct from approval to emit a replacement. Evidence
  and reasons are mandatory; numerical confidence scores and arbitrary thresholds are
  not part of the MVP and cannot substitute for these rules.
- **FR-008**: The system MUST NOT invent Xelops components, selectors, imports, properties,
  events, or dependencies. User-provided mapping examples MUST remain illustrative until
  verified against the authoritative catalog. All 74 supplied entries use the import
  path `@xelops-ui/angular`; `ng-xelops` denotes the requested design-system integration,
  not authority to invent a differently named dependency or subpath. Public export symbols
  needed to import a listed entry MUST be verified against the selected package; this
  verification cannot authorize catalog-absent components or APIs. Missing behavioral
  metadata requires review or an explicitly authorized enriched catalog revision.
- **FR-009**: Elements without a compatible catalog entry MUST be `unmapped`; elements
  with uncertain or ambiguous compatibility MUST be `manual-review`. Both MUST carry
  source references and reasons; ambiguous results MUST include available verified candidates.
- **FR-010**: Only verified, unambiguous compatible mappings MUST be applied automatically.
  Replacements MUST preserve required labels, properties, events, disabled and loading
  states, accessibility, validation, and form behavior.
- **FR-011**: Unmapped and manual-review elements MUST retain safe native or custom behavior
  where representable in the target. Any inability to retain that behavior MUST be
  reported; the system MUST NOT force a Xelops replacement or silently omit the element.
- **FR-012**: The Generator MUST reconstruct a complete Angular application using ng-xelops
  in **Xelops Angular architecture v1**, adopted by the project owner on 2026-09-17.
  The fixed application structure is:

  ```text
  src/
    app/
      core/
        api/
        guards/
        interceptors/
        services/
        models/
      shared/
        components/
        directives/
        pipes/
        utils/
        models/
      features/
        <feature>/
          pages/
          components/
          services/
          models/
          feature.routes.ts
      layouts/
      app.component.ts
      app.config.ts
      app.routes.ts
  ```

  Route-entry views belong in `features/<feature>/pages`; feature-only UI in that
  feature's `components`; feature business services and state in its `services`; domain
  types in its `models`. `core/api` holds application-wide API clients, `core/guards`
  navigation policies, `core/interceptors` shared request/response policies, `core/services`
  application-wide infrastructure and state, and `core/models` their shared contracts.
  Reusable domain-independent UI, directives, pipes, pure utilities, and generic types
  belong in the corresponding `shared` folders. Application shells and recurring page
  frames belong in `layouts`. Templates, component styles, and tests are colocated with
  their owners; global styles belong under `src`. `app.routes.ts` composes layouts and
  feature routes; each `feature.routes.ts` owns its feature's URLs. Required assets and
  root build configuration are also generated. Empty reserved folders may remain empty.
  Feature ownership follows routes and business responsibility, never arbitrary source
  folders; shared and core code MUST NOT depend on feature implementations. Uncertain
  ownership is reported for review, with no silent duplication of business logic.
- **FR-013**: Source business logic MUST be preserved wherever safely representable,
  including navigation conditions, state changes, service and API behavior, form validation,
  and event handling. Every identified unpreserved portion MUST be reported with its source,
  reason, impact, and required intervention; stubs MUST NOT count as preserved behavior.
- **FR-014**: Project-owned and generated TypeScript MUST use strict mode without explicit
  or implicit `any`, weakened checks, or suppressions concealing violations.
- **FR-015**: Generated projects MUST use stable, officially supported and mutually
  compatible dependencies and toolchains. Selected versions and official compatibility
  evidence MUST be recorded, with resolved dependency information included in the output.
- **FR-016**: The Validator MUST run actual TypeScript validation and Angular build on the
  generated project and record commands, tool versions, outcomes, and diagnostics.
  Dependency installation, strict TypeScript validation, Angular production build, lint,
  target tests, and Xelops compliance validation are all mandatory success gates (FR-032).
  Failed, unavailable, timed-out, or skipped mandatory checks MUST block successful
  completion; checks that can run independently may continue to collect diagnostics.
- **FR-017**: Every migration attempt MUST produce `migration-report.json` and
  `migration-report.md`, including failures before generation and failures during export.
  The two formats MUST present consistent facts for the same reported outcome.
- **FR-018**: Reports MUST identify the migration, source and target frameworks, authoritative
  revisions, selected versions, available analyzed-file and UI counts, every mapping and
  reason, generated pages/components/services and other artifacts, preservation limitations,
  stage outcomes, validation results, warnings, and errors. Unavailable information MUST
  be explicitly identified rather than replaced by invented results or misleading zeroes.
  Reports MUST list analyzed, ignored, and unparsed files with reasons; detected UI
  occurrences; generated files; style/dependency decisions; and preservation findings.
  Every UI occurrence, including manual-review items, MUST include its source file,
  source element and location, target catalog key(s)/selector(s) if mapped, status,
  reason, and evidence. Unresolved target fields are null, with candidates kept separate.
  Observed UI totals MUST NOT claim to cover unparsed regions; report analysis coverage
  separately. JSON and Markdown MUST derive from the same report revision.
- **FR-019**: The backend MUST expose API capabilities to retrieve the report as structured
  data and retrieve the readable Markdown report by migration identifier. Active attempts
  without a finished report MUST return a pending outcome; unknown identifiers MUST return
  a not-found outcome.
- **FR-020**: The ZIP Exporter MUST package the validated final project with its required
  source, assets, configuration, resolved dependency information, and both migration reports.
  Archives MUST be readable and sufficient to install declared dependencies and build the
  project in a clean workspace with the documented supported prerequisites.
- **FR-021**: The backend MUST expose an API capability to download a completed migration's
  ZIP by identifier. It MUST distinguish unknown, pending, and failed attempts from an
  available artifact and MUST NOT deliver another attempt's output.
- **FR-022**: A migration MUST become `completed` only when its generated project satisfies
  the architecture and typing requirements, mandatory validation passes, both reports
  exist, and its ZIP is available through the download capability. Unmapped and
  manual-review counts MUST remain visible even on a completed migration.
- **FR-023**: A failed stage MUST stop dependent work and preserve available results for
  the Reporter. Reports MUST distinguish completed, failed, and skipped stages. Export
  failure MUST update the retrievable reports and prevent a completed outcome. The
  separate diagnostic export in FR-038 is failure recovery, not a successful pipeline
  result or a waiver of validation.
- **FR-024**: The system MUST follow Analyzer → Mapper → Generator → Validator → Reporter
  → ZIP Exporter, with separate responsibilities and explicit typed stage contracts.
  API handlers MUST delegate migration work; generation, validation, reporting, and
  compression MUST NOT be conflated. The MVP is one backend service, not separate
  microservices for analysis, mapping, reports, status, or downloads.
- **FR-025**: Processing a submitted project MUST NOT modify its original input or expose
  another migration's files and artifacts. Archive handling and validation of submitted
  code MUST stay within the resources permitted for that migration.

- **FR-026**: Source analysis MUST include application-owned `.ts`, `.tsx`, `.js`, `.jsx`,
  applicable `.mts`/`.cts`/`.mjs`/`.cjs`, Angular templates, HTML, CSS/SCSS (including
  CSS Modules), project-owned declarations, relevant JSON/configuration, and referenced
  assets. Scan all application-owned source roots, not just `src`; resolve declared local
  aliases and imports within the submitted application. Entry/import/route reachability
  MUST distinguish active code from unused source. Tests and stories are inspected as
  behavioral evidence, not counted as application UI occurrences. Binary assets are
  inventoried/copied as needed, not parsed as code.
  Exclude installed/vendor dependencies, VCS/editor metadata, caches, coverage, logs,
  temporary files, source maps, and configured build output roots such as `dist`, `build`,
  `out`, `.next`, `.angular`, and `.cache` from semantic analysis. Dependency lockfiles
  are read only as dependency-resolution evidence, never as application source or a
  target lockfile. Known generated outputs are ignored with a recorded reason; required
  imported generated source must be accounted for or marked unsupported, never silently
  discarded because of its name. Ignore rules MUST NOT hide application-owned files
  merely because a folder resembles an output directory or appears in `.gitignore`.

- **FR-027**: Entity identification MUST use syntax, imports, declarations, and usage:

  | Entity | Required evidence |
  | --- | --- |
  | Pages and routes | Route definitions/registrations, URLs, parameters, guards and reachable route components; supported file-routing conventions only when verified |
  | Components | React component declarations and JSX usage, or Angular component metadata and templates; a filename alone is insufficient |
  | Services and API calls | Angular injectable/provider use or reusable source functions/hooks performing business or network work, including their call sites |
  | Models | Declared types/interfaces/classes and proven data shapes; do not fabricate types for unresolved dynamic data |
  | Forms | Form/control bindings, state/value ownership, submission and validation rules, disabled/touched/dirty/reset behavior |
  | State | Local state, reducers, contexts, signals, observables and store integrations, with update sites and consumers |
  | Styles and layouts | Imported/linked styles, class/style bindings, component style metadata, nesting and route-shell reuse |

  Unknown dynamic routes, runtime-generated templates, unresolved aliases, or indeterminate
  state dependencies MUST become source-linked review findings, not inferred structure.
  Every source file is classified as analyzed, ignored with a reason, or unparsed with
  an error. Detection does not guarantee that a discovered construct is convertible.

- **FR-028**: Native-to-Xelops candidate rules MUST follow this catalog-specific table.
  Every row is subject to FR-007; being listed here does not guarantee automatic mapping.

  | Source intent | Allowed catalog candidate | Constraint |
  | --- | --- | --- |
  | Action/submit button | `button` / `xlp-button` | Listed output is `xlpClick`, not `clicked`; preserve submission and event semantics, and review unknown payloads or variant values |
  | Native text-like input | `input` / `xlp-input` | Catalog explicitly describes an attribute directive: retain the native input and apply the directive, rather than generating an `xlp-input` element |
  | Native textarea | `input` / `xlp-input` | Same attribute directive on the native textarea; no invented `xlp-textarea` |
  | Single-value select | `select` / `xlp-select` | Catalog declares ControlValueAccessor but omits option composition; do not invent `xlp-option` or an `options` input; unresolved option rendering is manual-review |
  | Native checkbox | `checkbox` / `xlp-checkbox` | Use documented ControlValueAccessor behavior only when value, disabled, and form semantics can be preserved; do not invent checked/change APIs |
  | Radio choice/group | `radio` plus `radio-group` | Explicitly group related options; catalog requires `xlp-radio` inside `xlp-radio-group`; preserve selection values and grouping, not separate unrelated radios |
  | Modal dialog | `dialog` / `xlp-dialog` | Catalog specifies `XlpDialogService.open(component, config)`; no invented `xlp-modal`, open input, close result, or service configuration keys |
  | Semantic content card | `card` / `xlp-card` | Catalog names header/body/footer sub-elements; preserve content projection only when supported composition is established; a class named card is not proof |

  Classify checkbox/radio and specialized controls before considering generic input
  styling. Numeric inputs, switches, autocomplete, drawers, and popovers MUST NOT be
  substituted for these intents merely because they look similar. Catalog-mentioned
  sub-elements and services are limited to their stated usage; no additional APIs are
  inferred. Missing types, allowed values, projection rules, or accessibility behavior
  in this snapshot remain explicit review reasons.

- **FR-029**: Properties, events, variants, state, and accessibility MUST be translated
  only when their semantics are established. Preserve event order, payload use, bubbling,
  cancellation, keyboard interaction, focus, accessible names, label/control associations,
  and validation/error announcements where applicable. Native `id`, `name`, `aria-*`,
  `data-*`, and form attributes stay on retained native elements; setting them on a custom
  component host MUST NOT be assumed to forward them to its internal control. Bind only
  listed Xelops inputs/outputs; do not copy source component props onto target components.
  An explicit unsupported required feature makes that candidate incompatible. Unknown
  capability makes it uncertain. Preserve the native/custom implementation when safe;
  otherwise record the blocked behavior. Do not remove functionality to obtain a match.

- **FR-030**: Automatic business-logic migration MUST be limited to transformations with
  known semantics: pure functions and supported types, resolvable event handlers, explicit
  routing, supported local state/reducers, and forms/API calls whose behavior can be
  preserved. React render functions and JSX become Angular templates/bindings; they are
  not copied as React runtime code. React effects, closures, context, refs and external
  stores require proven dependency, timing and cleanup equivalence; a hook name alone
  MUST NOT trigger a one-to-one rewrite. Angular provider scopes, lifecycle behavior and
  asynchronous streams MUST be preserved during reconstruction. API methods, URLs,
  headers, serialization, error handling, cancellation and ordering MUST remain equivalent;
  credentials are not copied. Dynamic evaluation, direct DOM manipulation, opaque library
  behavior, and unproven transformations become manual-review findings. Business findings
  are recorded separately from the three UI mapping counts.

- **FR-031**: Styles MUST retain their applicable scope, cascade, responsive behavior,
  pseudo-states, URLs and required assets. Preserve CSS and compatible SCSS with their
  owner; translate CSS Module references into collision-safe component styles only when
  all class bindings can be resolved. Translate static and supported dynamic inline
  styles into equivalent Angular bindings; uncertain expressions require review. Preserve
  utility classes only with a compatible, identified stylesheet or build dependency that
  supplies them; unresolved/dynamic utilities MUST NOT silently become nonfunctional.
  Replace values with Xelops tokens only when an official token name, value/meaning and
  version are verified in the catalog or owner-identified design-system documentation.
  This catalog contains no design tokens. Until token documentation exists, retain safe
  source styling and report unmapped styles; never fabricate token names. Styling that
  depends on undocumented Xelops internals requires review rather than forced overrides.

- **FR-032**: Each generated project MUST pass all six validation categories:

  | Gate | Passing evidence |
  | --- | --- |
  | Dependency installation | Declared target dependencies resolve/install with the generated lockfile in an isolated workspace |
  | TypeScript | Strict type checking passes; owned/generated code contains no explicit/implicit any or bypass suppressions |
  | Angular build | Production build, including template checks, succeeds |
  | Lint | Target lint rules pass, including typing restrictions; warnings are recorded separately |
  | Tests | Target bootstrap/route smoke tests and applicable translated/generated behavior checks pass; preserved forms, events and state transformations have meaningful checks |
  | Xelops compliance | Emitted components/directives, import paths, members and compositions conform to the pinned catalog; target layout, catalog evidence, accessibility obligations and official-token references satisfy this specification |

  Missing source tests do not waive target smoke tests. Nonportable source tests are
  reported as not migrated; they are not relabeled passing. Test discovery producing zero
  required tests fails the tests gate. Any mandatory failure prevents a successful final
  project ZIP; dependent checks are skipped with reasons and independent checks may run.
  Lint/test/build tooling choices and exact commands belong to the implementation plan.

- **FR-033**: Dependencies MUST be inventoried by actual imports and build requirements
  and assigned `preserved`, `removed`, `replaced`, or `manual-review`, with source/target
  versions and reasons. Preserve only needed, supported framework-independent or compatible
  Angular packages. Remove React/runtime-only packages and source build tools after their
  usages are translated; replace UI/form/router/state libraries only with verified behavior
  equivalents. If required behavior still depends on an unsupported library, flag that
  behavior as blocked rather than merely removing the dependency. Rebuild the target manifest
  and lockfile; never copy source dependency declarations, install scripts, or lockfiles
  wholesale. Any selected target replacement MUST satisfy official support/compatibility.

- **FR-034**: Generated application components MUST be standalone, with feature-level
  lazy routes, an eager application shell, and typed reactive forms for translated forms.
  Preserve source form nullability, resets and validation timing; do not apply non-nullable
  defaults if that changes behavior. Use stable Angular state/binding APIs only where
  behavior-preserving; do not convert every effect or observable into a signal. Source
  NgModules may be analyzed, but arbitrary module hierarchies are not replicated. Library
  NgModules may be imported when required by verified package exports. No experimental
  API is required. SSR, hydration, server components and server-side application logic
  are outside the initial browser-application output; detected dependencies on them are
  reported for review. Exact Angular/Node.js/TypeScript versions require the selected
  Xelops package's public compatibility evidence before planning can finalize them.

- **FR-035**: A successful project ZIP MUST contain one project root with source, required
  assets/styles, Angular/dependency/type/build/lint/test configuration, its newly generated
  lockfile, applicable notices, setup/build instructions, `migration-report.json`, and
  `migration-report.md`. Exclude `node_modules`, build outputs, caches, temporary files,
  logs, VCS/editor metadata, original upload archives, credentials and real secret-bearing
  environment files. Include sanitized configuration examples where needed. Reports and
  generated source paths MUST be relative to the submitted or generated project, not
  expose host filesystem locations. ZIP readability and its required inventory must be
  verified before marking a final project available.

- **FR-036**: The minimal API MUST support one asynchronous migration lifecycle in the
  existing backend:

  | Operation | Minimal contract |
  | --- | --- |
  | `POST /api/migrations` | Receive one ZIP in multipart field `project`; respond 202 with `migrationId`, state `accepted`, and status/report URLs after durable acceptance; project-content errors are later reported on that attempt |
  | `GET /api/migrations/:id` | Return 200 with state, current stage, stage outcomes, available counts/coverage, warnings/errors summary, and report/download availability; unknown ID is 404 |
  | `GET /api/migrations/:id/report` | Return the JSON report with 200 once available, or 202 with pending state while processing; failed attempts also have retrievable reports |
  | `GET /api/migrations/:id/report?format=md` | Same availability rules, with the readable Markdown representation when ready |
  | `GET /api/migrations/:id/download` | Return 200 with `application/zip` and attachment filename only for an available validated final project; active/failed known attempt is 409, unknown ID is 404 |
  | `GET /api/migrations/:id/diagnostic-download` | Return 200 with a clearly named diagnostic ZIP only for a failed attempt with recoverable partial files and an available diagnostic artifact; otherwise 409 for a known unavailable attempt or 404 for an unknown ID |

  Missing upload fields or malformed transport requests return 400; unsupported media
  types 415; uploads above a documented deployment limit 413. These rejected requests
  are not accepted migration attempts. A well-formed upload containing a corrupt ZIP
  is an accepted attempt that later fails with reports. Errors MUST contain a stable
  code and readable message, plus `migrationId` when one exists. No download URL is
  advertised as ready before its artifact exists. Full schemas, authentication, limits,
  storage, worker/concurrency arrangements and recovery mechanics belong to planning.

- **FR-037**: Partial progress MUST be preserved and reported without claiming successful
  reconstruction of missing behavior. Unmapped/manual-review UI with safely retained
  native/custom behavior may still lead to `completed` if every mandatory gate passes;
  reports expose the remaining Xelops conversion work. A file parse failure does not
  stop independent files from being analyzed; record its path and diagnostic and mark
  its inventory unknown. It prevents successful completion if the file affects required
  behavior or reachability cannot be established. A proven unused/excluded file can be
  reported without blocking the migrated application. Unpreservable required behavior,
  unresolved required dependencies, or failed validation means `failed`, even if some
  files were generated. Incomplete catalog metadata affects only its dependent mappings;
  safe native fallbacks do not pretend to be Xelops conversions.

- **FR-038**: A failed attempt with recoverable partial generated files MUST attempt a
  separately identified diagnostic ZIP. It MUST contain `INCOMPLETE-MIGRATION.md`, the
  partial generated files under `partial-project/`, and both migration reports identifying
  failed/skipped validation and required intervention. It MUST use an unmistakable name
  such as `xelops-diagnostic-<migrationId>.zip` and apply the same credential, temporary-file,
  dependency-directory and archive-safety exclusions as the final ZIP. It MUST NOT be
  described as buildable, validated, or successful. Status/report responses distinguish
  `finalProjectAvailable` from `diagnosticAvailable` and expose separate URLs only when
  ready. No partial files means no diagnostic ZIP. Diagnostic packaging failure is
  recorded without hiding the original failure, falsely claiming availability, or
  preventing access to reports. The migration remains `failed` throughout this recovery.

### Key Entities *(include if feature involves data)*

- **Source Project**: The submitted application, framework evidence, application-owned
  files, configuration, assets, and detected input limitations.
- **Migration Attempt**: A unique identifier joining a source, lifecycle state,
  authoritative revisions, stage outcomes, analysis coverage, reports, and separately
  identified final/diagnostic artifacts. The lifecycle is accepted → running → completed
  or failed; an accepted attempt may fail before running. Diagnostic export does not
  change a failed state. A new submission creates a new attempt rather than changing
  a failed attempt into a successful one.
- **Normalized Project**: The source-traceable inventory of pages, routes, components,
  forms, services, models, styles, layouts, state, API usage, and their relationships.
- **Detected UI Element**: One source occurrence and the properties and behavior that a
  replacement must support; belongs to a normalized project.
- **Catalog Snapshot**: The authoritative versioned component definitions and compatibility
  information used for all mapping decisions in an attempt.
- **Mapping Decision**: A detected element's single status, reasons, verified target where
  mapped, or catalog-backed candidates where manual review is required. Evidence includes
  the catalog snapshot and constraints checked or missing; no numeric confidence is required.
- **Architecture Reference**: The official target organization and rules, identified by
  revision and used to assess the generated project.
- **Generated Project**: The reconstructed application, its files and dependencies,
  preserved behaviors, and disclosed limitations.
- **Validation Result**: A check's identity, execution evidence, outcome, and diagnostics,
  linked to the generated project and migration. Outcomes distinguish passed, failed,
  and skipped with reasons; unavailable/timed-out execution is a failure, not a pass.
- **Migration Report**: Consistent structured and readable representations of analysis,
  mappings, generation, preservation, validation, stage outcomes, and remaining work.
- **Export Artifact**: The downloadable ZIP linked to the corresponding validated project
  and migration, including both reports, or a separately classified diagnostic ZIP linked
  to a failed attempt and explicitly unvalidated partial files. Artifact kind and
  availability MUST be distinguished from migration success.
- **Migration Finding**: A source-linked issue in parsing, business behavior, styles,
  dependencies or metadata, with impact, reason and required action. Such findings are
  separate from UI mapping counts; one issue may affect several UI occurrences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Acceptance is evaluated against a documented reference collection containing at least
one project for each supported source framework, known inventories and behavioral
scenarios, compatible/unsupported/ambiguous UI cases, and one case for each failure
category in User Story 4. Expected outcomes are established before evaluating the migrator.

- **SC-001**: Every fully supported reference project can be submitted and retrieved as
  a usable reconstructed application with both reports and a downloadable archive.
- **SC-002**: For every fully analyzable reference project, 100% of its expected application
  inventory is accounted for. For every attempt, all enumerated files are classified with
  analysis/exclusion/error outcomes, and 100% of detected UI occurrences have exactly one
  traceable decision; the three decision counts reconcile with the observed detected total.
  Unparsed regions explicitly have unknown UI coverage rather than an invented zero count.
- **SC-003**: Across the reference collection, there are zero invented target components
  and zero automatic replacements of unsupported or ambiguous elements.
- **SC-004**: Every reference scenario designated preservable produces the expected
  observable business result in the migrated application; every designated unsupported
  behavior appears in the report with its source and required intervention.
- **SC-005**: Every attempt in the failure collection produces consistent, retrievable
  structured and readable reports identifying its failure, with zero false claims of
  successful completion or available successful output.
- **SC-006**: Every completed reference migration provides a readable archive that
  includes the required project files and both reports, and can be prepared and built
  in a clean workspace without manual repair of generated files.
- **SC-007**: For every report in the reference collection, a reviewer can identify all
  remaining mapping and preservation work, its source, and its reason without reading
  generated source files or internal execution logs.
- **SC-008**: Across repeated and separate reference submissions, all identifiers are
  distinct, and every report and artifact retrieval corresponds to the requested attempt.
- **SC-009**: Every failed reference attempt with recoverable partial files and functioning
  archive storage yields a clearly labeled diagnostic archive containing those files and
  both reports; no such attempt is reclassified as successful. Failure to package it is
  visible in the reports and availability result.
- **SC-010**: Every reference attempt that fails a required validation gate remains failed,
  with that gate's evidence in both reports and zero validated final-project downloads;
  diagnostic delivery never changes this result.

## Assumptions

- **Submission format**: For the MVP, a developer submits one source ZIP containing one
  application root, its source, relevant configuration, dependency declarations, and
  required assets. Repository cloning, multiple applications in one submission, and
  incremental file-by-file migration are outside this feature.
- **Product scope**: The deliverable is the backend and its programmatic migration,
  report, and download capabilities. A frontend dashboard, account administration,
  interactive mapping approval interface, and deployment of generated applications
  are outside this feature.
- **Framework scope**: React and Angular are the initial source frameworks; Angular
  with ng-xelops is the sole output target. Other source frameworks and React output
  are future work. Support is determined from project evidence, not proof that an AI
  authored the source.
- **Authoritative dependencies**: The sole component catalog is the user-supplied
  [xelops-components.json](<C:/Users/EL MAGICO/Desktop/DS/angular-xelops-ui/xelops-components.json>),
  inspected on 2026-09-17: 74 entries, SHA-256
  `C4FA4AAC267F51089162CB87D0087BEAE369FD027E4350130F83517C070A1640`.
  Each migration pins an immutable copy of this authorized catalog revision; a later
  replacement requires explicit catalog revision identification. FR-012 is the
  owner-approved architecture v1 reference. Both identities appear in each report.
- **Supported versions**: Exact version choices and source-version support boundaries
  are established during planning from official compatibility evidence. This specification
  requires graceful rejection when a particular source cannot be supported; it does not
  promise conversion of every historical release or third-party integration.
- **Migration limits**: Arbitrary behavior may not be transferable. Explicitly reported
  limitations and retained native/custom components are allowed; silent business-logic
  loss and falsely successful validation are not. Pixel-identical rendering is not a
  requirement, but behavior, required accessibility, and necessary styles are preserved
  where compatible with the target standard. Required business behavior that cannot be
  preserved prevents completed status; recoverable partial files are delivered only as
  diagnostics for failed attempts.
- **Report lifecycle**: Received migration submissions include invalid project archives
  and receive identified reports. Transport requests that never deliver a submission
  are request errors rather than migration attempts. During processing, report retrieval
  may indicate pending; terminal outcomes require both report formats.
- **Availability**: Report and artifact retrieval must work independently of the original
  submission connection. Storage, execution model, retention policy, request limits,
  deployment access controls, and detailed API schemas are planning decisions; the minimal
  operations and response semantics are fixed by FR-036. This
  specification does not imply permanent retention or a public anonymous service.
- **Required environment**: Official dependencies and necessary validation tools must be
  available to verify a successful migration; an unavailable prerequisite is a reported
  failure rather than permission to bypass a quality gate.
- **Catalog sufficiency**: The supplied snapshot defines selectors, import paths,
  descriptions, some usage notes, and input/output names. It does not define typed input
  or event contracts, allowed variants, design tokens, package versions, or complete
  composition/accessibility rules. Supported candidate discovery is possible, but automatic
  mappings depend on sufficient evidence for the particular source use. Catalog updates
  must be owner-authorized; documentation cannot expand the component/member whitelist.
- **Package compatibility**: The adjacent local package manifest identifies
  `@xelops-ui/angular` version 1.9.1 with Angular 20.3 dependencies and TypeScript 5.8.
  This is workspace evidence, not proof of published artifact availability, public export
  completeness, peer compatibility or ongoing support. Planning must verify the actual
  distributable package and registry access, without copying registry credentials into ZIPs.
- **Angular guidance checked**: Standalone output follows the official
  [standalone recommendation](https://angular.dev/guide/ngmodules/overview); feature lazy
  routes use supported [route-loading concepts](https://angular.dev/guide/routing/loading-strategies).
  Typed reactive forms preserve explicit form models and reset/nullability semantics
  described in [Angular's typed-forms guide](https://angular.dev/guide/forms/typed-forms).
  Version selection must use the [official compatibility matrix](https://angular.dev/reference/versions)
  and the selected package's constraints; it must not select the newest Angular release
  merely because it exists. These references do not supply extra Xelops components.
- **Remaining external evidence**: Before automatic mappings relying on missing information
  can be implemented, identify or authorize the required catalog enrichment. Identify
  official token documentation before token substitution; otherwise retain source styles.
  Confirm the distributable Xelops package, its public exports, supported peer versions and
  registry location during planning. These are explicit dependencies, not permission to guess.
- **Implementation-plan handoff**: Keep user-observable rules, fixed target architecture,
  mapping classifications, mandatory gates, report/ZIP contents and minimal API semantics
  in this specification. Put parser/AST libraries, intermediate typed interfaces, rewrite
  algorithms, source-framework adapter/version matrices, route chunking details, exact
  package versions, public-symbol resolution, CSS tooling, lint/test tools and commands,
  full API schemas, isolation/storage/worker design, quotas, retention, authentication,
  recovery policy and measurable operational budgets in the implementation plan. The plan
  must supply concrete values and validation evidence before their dependent implementation;
  no assumption of unrestricted uploads, infinite retention, or public access is made.
