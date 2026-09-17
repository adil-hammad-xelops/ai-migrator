# Xelops AI Migrator — Project Tracker

Repository: `https://github.com/adil-hammad-xelops/ai-migrator.git`

Current branch: `main`

## Current status

The project is in the US1 core-transformation phase. Foundation tasks T001–T018 and
US1 tasks T019–T033 are complete. React and Angular source analysis, evidence-gated
Xelops mapping, the strict Angular architecture-v1 template, dependency planning and
deterministic Angular path/file emission are implemented and verified.

The next work starts at T034: behavior-preserving React transforms, followed by Angular,
forms/API and style transforms, generator composition, profile admission, compliance,
six-gate validation and migration API orchestration.

Progress: **33 / 68 tasks complete**.

## Each part in simple words

| Part | Simple role |
| --- | --- |
| `src/analyzer` | Reads the uploaded project and finds pages, routes, components, forms, services, models, state, styles and UI elements. It only analyzes; it does not change the source. |
| `src/catalog` | Loads the official `xelops-components.json`. This is the list of components the system is allowed to use. |
| `src/mapper` | Compares detected UI elements with the catalog. It returns `mapped`, `unmapped` or `manual-review`; it never guesses a component. |
| `src/generator` | Creates the standardized Angular project with the approved Xelops architecture and transfers safe business behavior. |
| `src/validator` | Runs the six required checks: install, TypeScript, Angular build, lint, tests and Xelops compliance. |
| `src/reporter` | Explains what happened in `migration-report.json` and `migration-report.md`, including warnings, errors and remaining work. |
| `src/exporter` | Creates and verifies the final ZIP, or a clearly labeled diagnostic ZIP for a failed partial migration. |
| `src/api` | Receives uploads, starts jobs, returns status/reports and serves the available ZIP. |
| `src/index.ts` | Starts the backend and connects all modules together. |
| `tests` | Checks each part separately and tests the full migration with React and Angular fixtures. |
| `profiles/angular20` | Defines the exact Angular/Xelops versions and the checks required before that profile can be used. |
| `specs/001-create-xelops-migrator` | Contains the agreed requirements, design, API contract and implementation tasks. |

## How one migration works

```text
ZIP upload
   ↓
Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter
   ↓          ↓         ↓           ↓          ↓            ↓
inventory  decisions  Angular    six gates  JSON/MD      verified ZIP
```

1. The API stores the ZIP safely and gives it an ID.
2. The Analyzer understands the source project.
3. The Mapper checks every UI element against the catalog.
4. The Generator creates the fixed Angular structure.
5. The Validator checks that the generated project really works.
6. The Reporter explains every decision.
7. The Exporter publishes a final ZIP only after all required checks pass.

## Next milestones

- [x] T019–T033: analyze source, map UI, establish the Angular template, plan dependencies and emit deterministic architecture-owned files.
- [ ] T034–T045: complete behavior/style transforms, generator composition, profile admission, validation and migration API orchestration.
- [ ] T046–T050: complete JSON/Markdown reporting and report API.
- [ ] T051–T056: complete verified final ZIP delivery.
- [ ] T057–T063: complete failure recovery and diagnostic ZIP delivery.
- [ ] T064–T067: run end-to-end, security, performance and CI checks.
- [ ] T068: commit the verified implementation and push it to `origin`.

## How to use this tracker

Work in task order. Read the selected task in `tasks.md`, implement only that task, run
its acceptance checks, then mark its checkbox only when the checks pass. If a dependency
or external package is unavailable, leave the task unchecked and record the blocker in
`specs/001-create-xelops-migrator/implementation-notes.md`.
