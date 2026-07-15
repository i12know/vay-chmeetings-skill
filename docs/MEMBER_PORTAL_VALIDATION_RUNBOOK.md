# ChMeetings Member Portal Validation Runbook

Last verified: 2026-07-15

This runbook prevents the Member Portal architecture guide from becoming stale
between annual projects. It provides a quick, read-only pre-customization gate
that compares current ChMeetings behavior with a reviewed baseline.

The validator is intentionally conservative. It detects drift and tells a human
what to review; it never updates the baseline automatically.

Related files:

- [Architecture and UX guide](MEMBER_PORTAL_BUILDER_ARCHITECTURE.md)
- [Web entrypoint notes](WEB_ENTRYPOINTS_AND_MEMBER_PORTAL.md)
- [`validation/member-portal-baseline.json`](../validation/member-portal-baseline.json)
- [`scripts/validate-member-portal.mjs`](../scripts/validate-member-portal.mjs)

## One-minute validation

Requirements:

- Node.js 22 or later for the full Chrome DevTools check.
- Internet access to the public ChMeetings Help Center and VAY routes.
- For the full pre-customization gate, Chrome running with DevTools on port
  `9222` and the correct **Member Portal > Builder** tab already open.

From the repository root:

```powershell
node scripts\validate-member-portal.mjs --require-cdp
```

The command is read-only. It does not click, type, save, publish, reorder, or
change visibility. The live Builder check reads only:

- Chrome and DevTools protocol versions.
- The matching tab title and URL.
- Visible page text needed to find expected controls and card labels.

It does not read cookies, local storage, passwords, profile data, or API keys.

To keep a dated Markdown report:

```powershell
node scripts\validate-member-portal.mjs --require-cdp `
  --report validation-reports\member-portal-2027-preflight.md
```

Reports are not committed automatically. Review them for private tenant context
before deciding whether they belong in the repository, an issue, or project
records.

## Result meanings

| Status | Meaning | Action |
|---|---|---|
| `PASS` | Current evidence matches the reviewed baseline. | Continue to manual checks. |
| `WARN` | A document timestamp, expected statement, card catalog, route, title, or live Builder marker changed. | Stop customization and review the reported difference. |
| `FAIL` | A required source or check could not run successfully. | Fix connectivity, access, or endpoint problems before relying on the report. |
| `SKIP` | An optional check, normally Chrome, did not run. | Accept only for documentation-only checks; use `--require-cdp` before Builder work. |

Exit codes make the same distinction:

| Exit code | Meaning |
|---|---|
| `0` | No drift or required failure. |
| `1` | At least one warning requires review. |
| `2` | At least one required check failed. |

A clean automated run is necessary but not sufficient. It means the documented
contracts still look the same; it does not prove every member journey or mobile
interaction works.

## What is checked automatically

### Official documentation contracts

The validator calls ChMeetings' structured Help Center API and checks:

- Article identity, title, and `updated_at` timestamp.
- The documented Builder card catalog.
- Text/HTML, Link, and Form card statements.
- Guest/Member visibility, direct Page sharing, and irreversible deletion.
- The published limit on section-specific custom design.
- Desktop Builder versus web/mobile Member Portal behavior.
- Website integration direction and supported embeddables.
- Portal appearance and Branded App statements.
- Member Portal settings and the limited contexts where merge fields are
  explicitly documented.

Any article update produces a warning even when the expected wording remains.
This is deliberate: a contributor should inspect the official change before
deciding that the architecture guide remains accurate.

### Public routes

The validator checks the current desktop behavior visible from public HTTP
responses for:

- `https://vay.chmeetings.com/`
- The verified VAY SM Guest route.
- `https://onelink.to/_vay`

It compares HTTP status, final URL, page title, and selected public content
markers. The baseline owns the complete expected URLs so route changes cannot
pass silently.

### Live Builder

When Chrome DevTools is available, the validator:

1. Confirms `localhost:9222` responds.
2. Finds an open page whose URL contains `/Core/MemberAccess/builder`.
3. Reads the current document title, URL, and visible text.
4. Verifies core controls and the expected Builder card labels.

This catches a renamed or removed card, a moved Builder route, and substantial
UI changes. It does not inspect implementation bundles or treat browser internals
as a supported API.

## Checks that remain manual

The generated report always includes the current manual checklist. At minimum:

1. Open the tenant root in a fresh browser and confirm the JavaScript login and
   account-creation flow.
2. Sign in with an ordinary member account and record the real Member home URL,
   permissions, navigation, and return behavior.
3. Compare Guest and Member Builder previews with the corresponding published
   experiences.
4. Test the published flow in current iOS and Android apps.
5. Confirm plan and Branded App entitlements separately for each tenant.
6. Pilot any custom HTML, external app, or iframe on a disposable Page using
   synthetic data.

These cannot be safely reduced to one unattended script because they involve
real identity, plan entitlements, app webviews, accessibility, and human UX.

## Recommended annual workflow

Run this sequence before editing the next Sports Fest portal:

1. Pull the latest `main` branch of this repository.
2. Read the architecture guide's executive rules and open questions.
3. Open the correct tenant's Builder in the debug Chrome.
4. Run the validator with `--require-cdp` and save a dated report.
5. Do not customize while the report contains `WARN` or `FAIL`.
6. Review every changed official article and the live Builder difference.
7. Complete the manual test matrix using Guest, ordinary Member, Admin, iOS,
   and Android contexts.
8. Update the guide and baseline only after the current behavior is understood.
9. Rerun until the automated report is clean.
10. Record the report date, ChMeetings context, manual testers, decisions, and
    known limitations in the project record.

For a public-only check when Chrome is unavailable:

```powershell
node scripts\validate-member-portal.mjs --skip-cdp
```

For machine-readable output:

```powershell
node scripts\validate-member-portal.mjs --skip-cdp --format json
```

## Handling a warning

Do not immediately change the expected phrase or timestamp to make the report
green.

1. Open the source URL listed under the warning.
2. Compare the changed official text with the relevant guide section.
3. Classify the capability as **Supported**, **Observed**, **Experimental**, or
   **Prohibited** using the architecture guide.
4. Check the same feature in the target tenant's live Builder.
5. Test the real Guest, Member, web, and mobile behavior when relevant.
6. Decide whether the product changed, only the wording changed, or the baseline
   check was too brittle.
7. Update documentation and tests first.
8. Update the baseline timestamp, expected card headings, phrase, route, or UI
   marker only after that review.
9. Set `reviewedAt` to the new review date, update `CHANGELOG.md`, and bump the
   skill version.
10. Rerun the full command and retain the report as evidence.

This review gate prevents a person or LLM from masking a real platform change by
blindly accepting the current response as the new truth.

## Baseline design

The baseline is a small JSON contract rather than hard-coded logic. It contains:

- Official article IDs, titles, reviewed timestamps, and key statements.
- The expected official Builder card headings.
- Current public URLs, titles, and stable content markers.
- Live Builder route and visible control/card aliases.
- Manual checks that automation cannot replace.

Keep expected statements specific enough to protect architectural conclusions
but short enough to tolerate harmless punctuation and HTML formatting changes.
The first live run should distinguish a brittle assertion from genuine drift
before the baseline is published.

## Validator maintenance

Run the offline tests after changing the script:

```powershell
node --test scripts\validate-member-portal.test.mjs
```

The validator has no third-party package dependency. It uses Node's built-in
`fetch`, WebSocket, test runner, JSON, and filesystem APIs. This keeps the annual
run reproducible and avoids a package-install step becoming its own source of
failure.

The baseline must never contain credentials, cookies, private member data, or an
API key. Public tenant-scoped URLs may be included when they are the behavior
being validated.

## Current reference result

On 2026-07-15, the full command completed with:

```text
12 PASS, 0 WARN, 0 FAIL, 0 SKIP
```

That run covered seven official Help Center contracts, three public routes,
Chrome DevTools, and the open VAY SM Builder tab. Manual member and mobile-app
checks remain intentionally outstanding until a real pre-publication cycle.
