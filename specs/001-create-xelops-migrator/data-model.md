# Data model

All records are decoded from `unknown` at persistence and HTTP boundaries. Domain types
are readonly, strict TypeScript; optional values are explicit and never fabricated.
Paths in reports are normalized source-relative POSIX paths, never host filesystem paths.

## Entities and ownership

| Entity | Owner | Required information and relations |
| --- | --- | --- |
| MigrationJob | API | UUID, schema version, state, created/updated timestamps, stage outcomes, pinned catalog/profile IDs, published revision, expiry, artifact availability |
| SourceInventory | Analyzer | Archive hash, application root, framework evidence/version, every enumerated file and its classification, parse diagnostics, coverage |
| SourceFile | Analyzer | Relative path, hash, size, disposition (`analyzed`, `excluded`, `failed`), reason, detected roles and source spans |
| NormalizedProject | Analyzer | Inventory reference, pages/components/routes/forms/services/models/state/styles, dependency graph, UI occurrences, preservation requirements |
| UiOccurrence | Analyzer | Stable occurrence ID, source file/span, source element, normalized semantic role, properties/events/states/accessibility requirements, binding references |
| CatalogSnapshot | Catalog | Revision/hash, unchanged catalog bytes, entry count, component IDs/selectors/imports/member whitelist, metadata diagnostics |
| PackageEvidence | Catalog | Artifact identity/integrity, verified public symbols and typed contracts, evidence provenance; cannot add catalog components or members |
| TargetProfile | Validator | Architecture revision, exact supported tool/package versions, lockfile hash, support expiry, admission checks and result |
| MappingDecision | Mapper | Occurrence ID, status, reason code/text, catalog candidate IDs, selected target for mapped only, property/event translations, preserved requirements, unresolved requirements |
| GeneratedProject | Generator | Profile ID, approved output inventory with hashes, source-to-target associations, dependency decisions, preservation findings and blockers |
| ValidationResult | Validator | Gate, status, actual command/tool version where applicable, start/end/duration, exit code, bounded diagnostics, skip/failure reason |
| ReportBundle | Reporter | Schema/revision, job/source/target identities, inventory, mappings, generated files, dependencies, preservation findings, six validation results, warnings/errors, stage outcomes; JSON and Markdown from one record |
| Artifact | Exporter | Kind (`final` or `diagnostic`), internal relative path, SHA-256, byte length, verified entry inventory, creation/expiry timestamps |

## Classification invariants

Each detected UI occurrence has exactly one decision. `mapped + unmapped + manual-review`
equals the detected count. Unparsed regions make coverage `partial` or `unknown`; they do
not contribute an invented zero. Exclusions remain visible with reasons.

`mapped` requires one catalog candidate and verified compatibility for every required
semantic, binding and accessibility feature. `unmapped` means no compatible catalog
candidate or a known required incompatibility. `manual-review` means insufficient,
conflicting or multiple plausible evidence. Only mapped decisions select an emitted
Xelops target; other decisions may list candidates for explanation. No confidence score
overrides these rules. The known input selector conflict is manual-review.

Unmapped/manual-review UI may retain native/custom behavior where safely reconstructable.
A preservation finding records source references, outcome (`preserved`, `adapted`,
`manual-review`, `unsupported`), evidence, and whether required behavior is blocked.
Required behavior blockers prevent completion even if compilation succeeds.

## Lifecycle and publication

`accepted → running → completed | failed`. Accepted jobs are durable before 202; running
jobs record the current pipeline stage. Terminal states do not transition back to running.
An interrupted running job fails with `PROCESS_INTERRUPTED`; accepted jobs resume queueing.

Each of the six ordered stages has `pending | running | completed | failed | skipped`
plus timestamps and a reason for failure/skipping. Early failures skip dependent stages,
then run Reporter and attempt diagnostic ZIP Exporter when recoverable files exist.

Completed requires no behavior blocker, all six validation gates passed, both reports,
and a verified final ZIP. A failed diagnostic export does not hide the original failure.
Reports are prepared privately and published with terminal state via one atomic revision
pointer. A final export failure creates a new failed report bundle before publication.
Report contents do not embed their enclosing ZIP checksum; status metadata owns checksums
and actual artifact availability. Export details not known at report preparation are null.

Store layout: `jobs/<uuid>/{receipt.json,journal/,source/,work/,revisions/}`. Stage outputs
are private checkpoints; clients only see the published revision. One process holds the
store lock. Writes use temporary files, flush, rename and pointer replacement. Never infer
completion from an output directory existing.

Artifacts expire after 24 hours; status/reports after seven days. Expiration removes
download availability without rewriting historical success. Unknown or expired resources
return 404. Cleanup cannot delete active job files or files leased by an active download.
Credentials, raw host paths and unbounded compiler output must not enter persisted reports.
