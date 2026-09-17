# Quickstart validation guide

This is the execution guide for the planned implementation. Commands below become available
when its package scripts, profile tooling and fixtures are implemented; no build has yet run.

## Prerequisites and setup

Use the pinned Node/TypeScript versions in [plan.md](plan.md), a Linux container engine
(including on Windows), and access to the verified Xelops registry. Keep credentials outside
the repository, reports and containers used for builds/tests. Copy the authorized catalog
unchanged to `src/catalog/xelops-components.json`; verify its hash against the specification.

Resolve and commit compatible exact dependency versions and integrity-bearing lockfiles.
The target profile admission script must verify actual package exports, peer constraints,
support window, theme integration and all six consumer gates before activating the profile.
The known input selector conflict remains manual-review without an authorized catalog update.

From the repository root, after implementation:

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run build
node scripts/admit-profile.mjs profiles/angular20
```

Set `MIGRATOR_API_TOKEN`, `MIGRATOR_STORE_DIR` and the admitted profile/container configuration
documented by the implementation. Start with `npm start`; the planned default address is
`http://127.0.0.1:3000`. Startup must fail clearly for invalid catalog/store/security config.
An unavailable target profile must never silently fall back to unsupported versions.

## API walkthrough

Use a trusted-team bearer token. In Windows PowerShell invoke `curl.exe` instead of `curl`.
Replace TOKEN and ID with the configured token and the returned migration ID.

```sh
curl -H "Authorization: Bearer TOKEN" -F "project=@tests/fixtures/react-supported.zip" http://127.0.0.1:3000/api/migrations
curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:3000/api/migrations/ID
curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:3000/api/migrations/ID/report
curl -H "Authorization: Bearer TOKEN" "http://127.0.0.1:3000/api/migrations/ID/report?format=md"
curl -H "Authorization: Bearer TOKEN" -o project.zip http://127.0.0.1:3000/api/migrations/ID/download
node scripts/verify-artifact.mjs project.zip
```

Submission returns 202 only after durable acceptance. Poll until completed/failed; report
returns 202 while pending. Successful fixture output has six passed gates, both reports,
architecture v1, a new lockfile and a verified final ZIP. Extract into a clean isolated
workspace, rerun install/typecheck/build/lint/tests/compliance, and exercise expected route,
form, validation and API behavior. Do not execute it directly on the API host.

## Required acceptance scenarios

| Fixture/scenario | Expected result |
| --- | --- |
| Supported React and Angular applications | Complete inventory, behavior assertions preserved, six gates passed, final ZIP downloadable |
| Missing catalog equivalent with safe native fallback | Unmapped with reason; native behavior retained; success only if all gates and behavior pass |
| Input selector conflict or multiple candidates | Manual-review, no guessed Xelops binding; report identifies exact occurrence |
| Required behavior cannot be preserved | Failed, final download 409, separate diagnostic ZIP with partial files and reports |
| Parse error or mixed/unsupported framework | Coverage gap/framework evidence reported, no silent omission or false success |
| Each validation gate fails separately | Failed; real evidence in both reports; skipped dependent checks explained |
| Malicious paths, symlinks, expansion quotas | Rejected safely; accepted archives still receive identified failure reports |
| Export failure, restart, storage outage | No false completion; durable recovery and original failure retained |
| Report/ZIP expiry and concurrent downloads | Correct 404/availability metadata, no cleanup of active download |

For a failed job with recoverable files, GET `/api/migrations/ID/diagnostic-download` returns
the clearly labeled diagnostic ZIP. Verify normal `/download` returns 409. Compare JSON
and Markdown reasons/counts, confirm every detected occurrence has one mapping decision,
and confirm neither archive contains credentials, host paths, node_modules or scratch files.

Protocol assertions and payload shapes are defined in [OpenAPI](contracts/openapi.json).
Acceptance tests must use independently specified source behavior, not only snapshots of
the generator's own output. Report measured performance against plan targets separately.
