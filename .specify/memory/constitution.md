<!--
Sync Impact Report
Version change: unratified template -> 1.0.0 (initial adoption).
Modified principles: the five unnamed scaffold slots are replaced by the fifteen
user-supplied principles:
  I. Mandatory TypeScript Strict Mode
  II. No Use of any
  III. Separation of Responsibilities
  IV. Ordered Migration Pipeline
  V. Catalog as the Single Source of Truth
  VI. No Invented Xelops Components
  VII. Explicit Unmapped Components
  VIII. Explicit Manual Review
  IX. Official Xelops Angular Architecture
  X. Stable and Officially Supported Versions
  XI. Mandatory Generated-Code Validation
  XII. A Report for Every Migration
  XIII. Downloadable ZIP for Every Successful Migration
  XIV. Business Logic Preservation
  XV. Compatible Native UI Replacement
Added sections: Authoritative Inputs and Migration Outcomes; Development Workflow
and Quality Gates; populated Governance.
Removed sections: none; unnamed template sections were populated.
Dependent templates and commands: unchanged; read this constitution at runtime.
Deferred placeholders or TODOs: none.
Implementation prerequisites: obtain and identify the authoritative Xelops catalog
and official Angular architecture reference before implementing dependent behavior.
This report is temporary amendment review material; remove it before committing.
-->

# Xelops AI Migrator Constitution

## Core Principles

### I. Mandatory TypeScript Strict Mode

All project-owned TypeScript, including migration services, tests, generation templates,
and emitted Angular code, MUST compile with `strict: true`. Derived configurations MUST
NOT disable strict checks. External inputs MUST be validated and narrowed at system
boundaries so that malformed source data cannot bypass the typed migration contracts.

### II. No Use of any

Project-owned and generated TypeScript MUST NOT use explicit or implicit `any`, including
type assertions and generic arguments. Unknown data MUST use `unknown` with validation
and narrowing, or a precise type. Suppression directives MUST NOT conceal violations.
Uploaded source is analysis input and may contain `any`; carrying its logic into generated
code MUST satisfy this rule or produce a reported limitation requiring intervention.

### III. Separation of Responsibilities

Analysis, mapping, generation, validation, reporting, and ZIP export MUST have distinct
modules with explicit typed input, output, and error contracts. API routes MUST delegate
migration work to the orchestration layer. The Generator MUST own project file creation;
the ZIP Exporter MUST own compression and artifact delivery preparation. Neither module
may absorb the other's responsibilities.

### IV. Ordered Migration Pipeline

Every migration MUST follow this logical stage order:

`Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter`

The Analyzer produces a normalized project; the Mapper produces catalog-backed decisions;
the Generator produces the target project; the Validator checks that project; the Reporter
records the outcome; the ZIP Exporter packages eligible output. A downstream stage MUST
consume the preceding stage's explicit results. Failures MUST stop dependent work and
still reach reporting with completed, failed, and skipped stages identified. Failure
reporting MUST NOT turn a skipped stage into a successful stage.

### V. Catalog as the Single Source of Truth

The authoritative Xelops component catalog MUST be the sole source for available
components and their selectors, imports, properties, events, dependencies, and compatibility
constraints. Each migration MUST identify the catalog version or immutable snapshot it
used. Examples, model suggestions, and naming conventions MUST NOT override the catalog.
Missing catalog evidence MUST prevent automatic approval of the affected mapping.

### VI. No Invented Xelops Components

The Mapper MUST NOT invent a Xelops component, selector, import path, property, or event.
Every `mapped` result MUST reference an existing catalog entry and contain enough evidence
to verify compatibility with the detected source usage. The Generator MUST use verified
mapping results and MUST NOT fabricate missing Xelops APIs to complete generated code.

### VII. Explicit Unmapped Components

A source component with no compatible catalog entry MUST receive status `unmapped`.
The result and migration report MUST retain its source identity, source file, and reason.
Unsupported components MUST NOT be silently dropped or presented as mapped. Where feasible,
the Generator MUST preserve their native or custom behavior and report remaining work.

### VIII. Explicit Manual Review

An ambiguous mapping MUST receive status `manual-review`, with its source identity,
source file, ambiguity, and available catalog-backed candidates recorded. A confidence
score alone MUST NOT resolve missing or conflicting compatibility evidence. The Generator
MUST NOT automatically apply an ambiguous replacement. A recorded resolution MUST establish
compatibility before the item can become `mapped`.

### IX. Official Xelops Angular Architecture

Generated Angular projects MUST follow the official standardized Xelops Angular
architecture, using an identified authoritative architecture reference or approved template
revision. Generated pages, components, routes, services, models, layouts, and shared code
MUST follow its placement and dependency rules. The source project's arbitrary layout
MUST NOT override the target standard. An illustrative directory tree alone MUST NOT be
treated as proof of conformity to the official architecture.

### X. Stable and Officially Supported Versions

Generated projects MUST use stable, officially supported, mutually compatible versions
of Angular, TypeScript, Node.js, ng-xelops, and their required dependencies. Version
selection MUST be checked against official release, support, and compatibility sources
when the target toolchain is selected or updated. Prerelease, experimental, unsupported,
or incompatible versions MUST NOT be selected. Resolved versions and compatibility
evidence MUST be recorded so the output can be reproduced.

### XI. Mandatory Generated-Code Validation

Every generated project MUST pass TypeScript validation and an Angular build before
it is eligible for successful export. The Validator MUST run the real checks against
the generated project with its resolved dependencies and record commands, tool versions,
outcomes, and diagnostics. Failed, unavailable, timed-out, or skipped checks MUST NOT
count as passing. Strict typing MUST NOT be weakened to obtain a successful build.

### XII. A Report for Every Migration

Every migration attempt MUST produce a retrievable migration report, including attempts
that fail before generation, during validation, or during ZIP export. At minimum,
`migration-report.json` MUST record the migration identifier, source and target frameworks,
available analysis counts, mapping decisions and reasons, generated artifacts, stage and
validation outcomes, warnings, and errors. Unavailable results MUST be identified rather
than fabricated. Export failures MUST be reflected in the report by the Reporter.

### XIII. Downloadable ZIP for Every Successful Migration

A migration MUST NOT be reported as successful until a complete, readable ZIP of the
validated project exists and is available through the project's download mechanism.
The ZIP MUST include generated source, dependency and build configuration, resolved
dependency information, and the migration report. Compression or download availability
failure MUST prevent a successful outcome and MUST be reported. A project directory
or a promised download URL alone does not satisfy this principle.

### XIV. Business Logic Preservation

The migration MUST preserve source business logic whenever it can be represented safely
and compatibly in the target architecture. This includes state transitions, service and
API behavior, routing conditions, validation rules, and event-driven behavior. Every
identified portion that cannot be preserved MUST be traceable to its source and reported
with the reason and required intervention. Logic MUST NOT be silently deleted, replaced
with a stub, or changed merely to simplify generation or make validation pass.

### XV. Compatible Native UI Replacement

Native UI elements MUST be replaced with ng-xelops components only when a catalog-backed,
unambiguous mapping supports the source element's required behavior. Compatibility MUST
cover applicable properties, events, disabled and loading states, labels, accessibility,
validation, and form behavior. Compatible replacements MUST preserve those semantics.
Where compatibility is absent or uncertain, the element MUST remain `unmapped` or
`manual-review` respectively, with safe original behavior retained where feasible.

## Authoritative Inputs and Migration Outcomes

- Plans that depend on Xelops mapping or generation MUST identify the authoritative
  catalog artifact and official Angular architecture reference, including their versions
  or revisions. Missing authoritative inputs MUST block the affected implementation;
  they MUST NOT be replaced by assumed component APIs or an invented architecture.
- The backend generation prompt supplies product context and examples. Where it conflicts
  with this constitution, this constitution governs. Example selectors, package paths,
  and directory layouts require verification against the appropriate authoritative source.
- Mapping status MUST be exactly `mapped`, `unmapped`, or `manual-review`. Mapping status
  and migration outcome MUST remain separate: retained native or custom components can
  coexist with a validated project, provided limitations are explicit in the report.
- A successful migration MUST satisfy the architecture and typing requirements, pass
  TypeScript validation and Angular build, produce its report, and provide its ZIP.
  Unresolved mappings MUST remain visible; success MUST NOT imply every component was
  converted. Incomplete generation, failed validation, or failed export MUST NOT be
  presented as successful.
- Failure handling MUST preserve available results and invoke reporting even when normal
  stage progression stops. If ZIP export fails after the report was created, the Reporter
  MUST update the retrievable report with that failure. The orchestrator MUST NOT announce
  success until export and download availability are confirmed.

## Development Workflow and Quality Gates

1. **Specification:** Feature specifications MUST state the affected pipeline stages,
   expected mapping statuses, business behavior to preserve, failure outcomes, and report
   or ZIP acceptance criteria relevant to the feature.
2. **Planning:** Implementation plans MUST check compliance with all fifteen principles
   before implementation and after design changes. They MUST identify authoritative
   inputs, module boundaries, supported version evidence, and validation commands.
   Unresolved compliance issues MUST block the affected work.
3. **Implementation:** Changes MUST enforce strict typing and the prohibition on `any`
   across owned and generated TypeScript. Pipeline contracts MUST keep responsibilities
   separate and propagate structured outcomes to reporting.
4. **Verification:** Changes affecting mapping MUST verify compatible, unsupported, and
   ambiguous cases. Changes affecting generation MUST verify preserved business behavior,
   architecture conformity, TypeScript validation, and Angular build on representative
   output. Changes affecting orchestration, reporting, or export MUST verify failure
   reports and successful ZIP download. These constitution-mandated checks are required
   even when a generic task template describes other tests as optional.
5. **Review:** Reviews MUST record applicable compliance evidence and explain why a
   principle is unaffected where relevant. Failed checks MUST be fixed or explicitly
   block completion; an explanation of a violation does not waive a principle.

## Governance

This constitution is the governing source for Xelops AI Migrator design, implementation,
generated artifacts, and review. Specifications, plans, tasks, templates, and project
guidance MUST be interpreted consistently with it.

Amendments MUST document the proposed rule changes, their rationale, affected artifacts,
and the transition needed for existing implementations. The project owner or a designated
maintainer MUST approve amendments before adoption. Changes MUST update the constitution
version, amendment date, and a Sync Impact Report; the temporary report MUST be removed
before committing the amendment. The original ratification date MUST be preserved.

Constitution versions follow semantic versioning: MAJOR for incompatible principle
removals or redefinitions; MINOR for new principles or materially expanded requirements;
PATCH for clarifications that do not change obligations. Version 1.0.0 is the initial
adoption of the fifteen principles.

Every implementation and review MUST check compliance. Deviations require an adopted
constitutional amendment; a plan's complexity justification alone cannot authorize them.
Future Spec Kit commands MUST read this constitution when generating project artifacts.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
