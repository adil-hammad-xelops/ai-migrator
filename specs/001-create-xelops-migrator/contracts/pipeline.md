# Pipeline contract

The API migration service coordinates the following order. Each module owns its rules
and immutable output types; cross-module dependencies use type-only imports where possible.
`index.ts` wires implementations. No source project script or config executes in the API.

| Stage | Input | Output and obligations |
| --- | --- | --- |
| Analyzer | Safely extracted immutable source inventory | NormalizedProject: framework evidence, full classified inventory, semantic graph, UI occurrences, coverage and parse findings |
| Mapper | NormalizedProject, pinned CatalogSnapshot, verified PackageEvidence | MappingPlan: exactly one explained decision per occurrence; no invented component/member/token |
| Generator | NormalizedProject, MappingPlan, admitted TargetProfile | GeneratedProject: architecture v1 files, dependency decisions, source associations, preservation findings/blockers |
| Validator | GeneratedProject, TargetProfile | Six actual gate results; failed prerequisites produce explicit skipped dependent checks |
| Reporter | Attempt snapshot and stage/check outcomes | One versioned report model rendered as migration-report.json and migration-report.md |
| ZIP Exporter | Approved inventory and report bundle | Verified final or diagnostic artifact; no source transformation |

## Boundary rules

Decode external JSON as `unknown`; reject invalid shapes before typed use. Use discriminated
unions for mapping outcomes and stage results, with exhaustive handling. Do not use explicit
or implicit `any`, unsafe assertions or compiler/lint suppressions to hide gaps.
Every finding has a stable code, readable reason, severity and source references when known.
Each stage receives a deadline/cancellation context and a private workspace capability;
paths and subprocess commands are never accepted directly from an HTTP request.

Catalog authority is one immutable snapshot. Package declarations may verify catalog-listed
APIs but cannot extend its whitelist. Missing metadata or the `xlp-input`/`xlpInput` conflict
disables automatic replacement for that use. Multiple candidates remain manual-review;
known incompatible required features are unmapped. Keep compatible native behavior rather
than deleting handlers, validations, keyboard semantics or accessibility attributes.

The generator emits only the approved architecture from spec FR-012. Shared reusable code
belongs in shared; cross-application services in core; routed domain code in features;
shells in layouts. React-only dependencies are removed or replaced with verified Angular
equivalents. Unsupported required dependency behavior becomes a blocker. Preserve source
styles unless an official token equivalent and safe semantic substitution are verified.

## Validation contract

Mandatory gates, in execution order: dependency installation, TypeScript, Angular production
build, lint, tests, Xelops compliance. Results use `passed | failed | skipped`, with actual
exit codes where a process ran. The internal compliance gate has no invented shell exit
code. Missing tools, timeout, unsupported profile, zero required tests or skipped checks
cannot pass. Continue independent checks when safe; record why dependent ones were skipped.

Install from a newly resolved approved target lockfile with
`npm ci --ignore-scripts --strict-peer-deps`. Use trusted generated scripts/configuration.
Execute analysis and validation in disposable unprivileged containers with quotas; install
has restricted registry access, while build/test have no network or credentials.

## Failure and artifact contract

Exceptions become structured stage failures, preserving already collected evidence. Reporter
runs after every accepted attempt, including unreadable archives. Original cause is retained
if later reporting/export also fails. Storage outages require recoverable journal/retry and
must never produce completed status.

Final publication requires no required-behavior blocker and six passed gates. Include source,
assets, trusted Angular/package/TypeScript/lint/test configuration, new lockfile, README and
both reports. Exclude node_modules, build outputs, caches, temporary files, logs, VCS and
credentials. Reopen the archive, verify every approved entry/hash, then atomically publish.

Failed attempts with recoverable output get a separate diagnostic archive containing
`INCOMPLETE-MIGRATION.md`, `partial-project/` and both reports. Apply the same path/secret
exclusions. Normal download stays unavailable. Diagnostic packaging failure is reported;
it never converts the migration to success or prevents a failure report being published.

See [data model](../data-model.md) for lifecycle and [OpenAPI](openapi.json) for transport.
