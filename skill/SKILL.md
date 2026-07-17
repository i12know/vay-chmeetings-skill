---
name: chmeetings
description: Use this skill whenever the task involves ChMeetings — the church management platform at chmeetings.com. Triggers include any mention of the ChMeetings REST API, MCP server, webhooks, People/Groups/Families/Events/Contributions/Pledges/Batches/Funds/Notes APIs, an API key from ChMeetings, a `.chmeetings.com` domain, an OpenAPI spec named `chmeetings_openapi_v1.json`, diocese or ministry hierarchies in ChMeetings, or the `CHM_FIELDS` mapping pattern. Also triggers for projects in the VAYSF / RP Pathway / VD ManSys family that integrate ChMeetings with WordPress, QuickBooks, Gmail, Google Calendar, or other systems. Use it for: writing or reviewing API client code, designing field mappings, handling pagination, building webhook listeners, troubleshooting 401/403/429 errors, deciding between REST API vs MCP, migrating away from Selenium-based scraping, and planning sync workflows between ChMeetings and external systems.
---

# ChMeetings Integration Skill

This skill is the shared ground truth for every project in the `i12know` ChMeetings portfolio — currently `vaysf`, `rp-pathway-app`, and `vdmansys`. Read it fully before writing API code, designing a schema, or proposing an integration pattern. When it conflicts with older project docs, this skill wins; open a PR against this repo to update it.

## 1. Platform orientation

ChMeetings is a multi-tenant church management system (ChMS) with an Accounting, Contributions, Events, People, Groups, Messaging, Volunteer Scheduling, Worship Planning, and Member Portal module. Tenants can be organized as a single church or as a **Diocese** with multiple churches under it. Each church may further contain **Ministries**, which are logical sub-scopes (youth, worship, etc.) within that church.

Key implication for every project in this portfolio: **scope matters**. A People read at the church level may return different results than the same read inside a specific ministry. Whenever you design or audit an endpoint call, state explicitly which scope you are in (diocese / church / ministry) and whether the user context has access to that scope. Write this into comments in code.

Bumble's context, which shapes most of what this portfolio does:
- He is Owner of Vietnamese Alliance Youth (VAY) at the diocese level. The `vaysf` project operates at the **VAY SM church level** within that diocese — VAY SM is the church tenant the Sports Fest API key is scoped to.
- He is Lead Pastor at Redemption Point Church (RP) — a church tenant inside the Vietnamese District.
- The Vietnamese District itself is another ChMeetings tenant (vdmansys targets this level).

Treat "Vietnamese District" and "VAY" as distinct tenants in code and configuration even when they feel related organizationally.

## 2. Canonical resources

These four URLs are the single source of truth. When the skill and the official docs diverge, the official docs win and this skill must be updated.

| Resource | URL | What it's for |
|---|---|---|
| API reference (Scalar) | https://api.chmeetings.com/scalar/ | Endpoint shapes, request/response schemas, authentication. The OpenAPI JSON is what `vaysf` has committed as `chmeetings_openapi_v1.json`. |
| MCP resources | https://mcp.chmeetings.com/resources | Model Context Protocol tools exposed by ChMeetings for AI agents. |
| Help Center | https://help.chmeetings.com/hc/en-us | Operator-facing documentation; useful for understanding UX state behind data you see in API responses. The Developer API Guide at `https://help.chmeetings.com/hc/en-us/articles/4407466673937-Developer-API-Guide` is the canonical human-readable API overview. |
| Release Notes | https://www.chmeetings.com/release-notes/ | Authoritative log of what shipped when. Check this first whenever behavior looks different from what the code expects. Previous years link at the bottom of that page. |

Operator consoles and related URLs:
- App: `https://app.chmeetings.com/`
- Status page: `https://chmeetings.statuspage.io`
- API key generation: inside the app at **Settings > Integrations > API Integration**

For Member Portal Builder, card/Page selection, HTML/CSS/JavaScript support
boundaries, external web apps, iframe decisions, and mobile UX, read
`../docs/MEMBER_PORTAL_BUILDER_ARCHITECTURE.md` before proposing or changing a
portal experience. For tenant roots, Guest/Member routes, and login-state
behavior, also read `../docs/WEB_ENTRYPOINTS_AND_MEMBER_PORTAL.md`.
Before seasonal Builder work, run the read-only validation gate documented in
`../docs/MEMBER_PORTAL_VALIDATION_RUNBOOK.md`; do not proceed past a warning or
failure until the detected drift has been reviewed.

## 3. Authentication

Authentication is an API key issued per tenant. The admin generates it under **Settings > Integrations > API Integration**. There is no OAuth on the public API today, so every project treats the key as a high-privilege secret.

Rules that apply across every project in this portfolio:

- API keys live in `.env` files (never committed), loaded via `python-dotenv` or equivalent. Variable names are `CHMEETINGS_API_KEY` (single-tenant) or `CHMEETINGS_API_KEY_<TENANT>` where tenant is something like `VAY_SM`, `RP`, `VD` (diocese / church / ministry scopes must be named, not numbered). Exception: `vaysf` uses `CHM_API_KEY` — this is correct and established; do not rename it.
- `.env.template` is committed with blank values. `.env` is in `.gitignore`.
- Never log the key. If you need to confirm configuration, log the first four characters with `****` for the rest.
- Keys that leak must be rotated in the ChMeetings UI immediately; there is no programmatic rotation endpoint.
- If a user pastes an API key directly into a chat or issue, treat it as compromised and tell them to rotate.

When the API returns a 401, the first diagnostic step is to re-check the header name and case, then check key validity in the UI. A 403 on a specific resource means the key is valid but the account/role lacks permission for that scope — a very common failure in diocese-level integrations that try to read a specific church.

## 4. API surface you should know

This is the working inventory as of the 2026.5 release. Always cross-check `chmeetings_openapi_v1.json` in the consuming repo (or fetch a fresh copy from the Scalar docs) before coding. **Endpoint paths in this table are illustrative conventions — verify them against the OpenAPI spec before use.**

| Resource | Ops | Notes |
|---|---|---|
| People | GET, POST, PUT, DEL | Filter by full name, mobile number, email. Supports `includeOrganizations=true`. Native Name field is supported when enabled in Account Settings. |
| People notes | GET, POST, PATCH/PUT, DEL | Separate "Notes API" for profile notes. |
| People → organizations | GET `people/{personId}/organizations` | Returns the organizations a person belongs to. |
| Families | GET, POST, DELETE, PATCH | Includes family roles; family members are a sub-resource. |
| Groups | GET | Read-only at time of writing. |
| Churches | GET | Diocese-level read. |
| Ministries | GET | Sub-scope of a church. |
| Events | GET (Read API) | Church and ministry level; occurrence and attendance data. |
| Contributions | GET, POST | POST (Add Contribution) accepts a `BatchNumber`. Refunds recorded as separate negative entries. |
| Pledges / Campaigns | GET | Pledge campaigns and their records. |
| Batches | GET, POST, PUT, DEL, plus close/reopen | Full CRUD on contribution batches. Online-giving batches auto-created daily as `YYYY-MM-DD Online Giving`; their dates are not editable and manual contributions cannot be added. |
| Funds | GET, plus webhooks for created/updated/deleted | Accounting funds (separate concept from contribution funds; they are mapped to each other in-app). |
| Blog | GET | Recent addition. |

Assume anything not in the table is either unavailable via API or was added after this skill was last edited — check the release notes and the Scalar docs.

### Scope parameters

Most read endpoints accept an implicit scope from the API key plus an explicit ministry context where relevant. When an endpoint returns a `MinistryId` or `ChurchId`, preserve it in your data model — downstream code that filters by ministry will break if this is dropped during transformation.

### Multi-tenant scoping and duplicate persons

API keys are hard-scoped to the organization that issued them (verified by live probe, 2026-07-16). A church-scoped key gets a plain **404 "Invalid Person Id"** — not 403 — for a person in a sibling tenant, so "merged/moved elsewhere" is indistinguishable from "deleted." Search and org-enumeration endpoints are equally walled; only a diocese-scoped key sees across tenants (its person records carry a `church` field naming the owning tenant). Never infer deletion from a 404, never put a diocese key in the default connector's variable, and treat person merges (UI-only; there is no merge API) as lifecycle events that orphan external systems holding the losing ID. The full workflow — in-tenant-first survivor search, cross-tenant escalation, merge-direction rule, external-row retirement — is in [docs/MULTI_TENANCY_AND_DUPLICATES.md](../docs/MULTI_TENANCY_AND_DUPLICATES.md).

### Pagination

The `vaysf` codebase established the pattern: paginate using the response's `total_count` (or equivalent cursor field) rather than hoping an empty page signals the end. Continue requesting pages until you've retrieved `total_count` records. Log the count on the first page and reconcile the final tally so that truncated syncs are caught by logs, not by users.

### Rate limiting

ChMeetings does not publish a public rate limit number. Treat 429 as a signal to back off exponentially (start at 2s, double up to 60s, max ~6 retries). Log every 429 with endpoint and tenant so we can build a picture of real limits over time. For bulk syncs, prefer batching and off-peak scheduling over hammering.

### Error handling conventions

- **401 Unauthorized** — bad or missing API key header. Fail fast, don't retry.
- **403 Forbidden** — key is valid but scope is wrong. Fail fast; don't retry with a different scope unless the caller explicitly asked for a fallback.
- **404 Not Found** — resource doesn't exist for this tenant/scope. For syncs, log and continue; do not treat as a fatal sync error.
- **422 Unprocessable** — schema mismatch. Almost always a `CHM_FIELDS` drift problem (see §6). Run the field inspector before assuming the API broke.
- **429** — backoff and retry (see above).
- **5xx** — retry with backoff, but cap retries. After cap, surface the error; do not silently continue.

Wrap every call in a small number of well-named exception types (`ChMeetingsAuthError`, `ChMeetingsScopeError`, `ChMeetingsSchemaError`, `ChMeetingsRateLimitError`, `ChMeetingsServerError`) so callers can make intelligent decisions. Don't let raw `requests` exceptions bubble up to business logic.

## 5. Webhooks

As of 2025.24, ChMeetings supports outbound webhooks under **Settings > Integrations > Webhooks**. Current events:

- People: created, updated, deleted
- Contributions: created
- Funds: created, updated, deleted

Webhook receivers in this portfolio should:

1. Verify the request actually came from ChMeetings (check the provider's signature header and shared secret once that's documented; treat webhooks as untrusted input until verified).
2. Respond **2xx quickly** (target <1s). Push work onto a queue; don't do sync processing inside the webhook handler.
3. Be **idempotent**. Assume the same event may be delivered more than once. Deduplicate on an event ID plus resource ID.
4. Log every received payload to append-only storage for at least 30 days — webhook debugging without a log is misery.

Until ChMeetings documents their signature scheme, treat the webhook endpoint URL as a semi-secret (don't put it in public repos or README screenshots) and pair it with a hard-to-guess path segment.

## 6. Field mapping and schema drift

The `vaysf` codebase established `CHM_FIELDS` as a centralized mapping module — a single Python dict (or equivalent) that names every ChMeetings field used by the integration and maps it to the canonical field in the ChMeetings API response. **Every new project in this portfolio adopts the same pattern.** It is the single most important design decision for long-term maintainability.

Why: ChMeetings ships weekly-to-biweekly. Field names occasionally shift (e.g., "Native Name" arriving as a first-class field; custom fields being added). When the schema drifts, one small file breaks loudly instead of a hundred call sites breaking quietly.

Required pattern per project:

1. A `chm_fields.py` (or equivalent) module exporting `CHM_FIELDS` — a structured mapping keyed by logical domain concept (`person.full_name`, `person.envelope_number`, `family.primary_member_id`, etc.), valued by the actual ChMeetings field path.
2. A **field inspector** — a diagnostic script that fetches one record of each type and diffs its keys against `CHM_FIELDS`, warning on unknown keys (new fields shipped) and missing keys (expected fields absent). Run it in CI on a cron, or before every release, or both. `vaysf` calls this pattern "API field inspector" — keep that name for continuity.
3. Never hard-code field names in business logic. Business logic reads `CHM_FIELDS['person']['full_name']`, not `'FullName'` or `'full_name'`.

When you see a literal ChMeetings field name in a diff, flag it in review.

## 7. REST API vs MCP — when to use which

ChMeetings exposes **both** a traditional REST API and an MCP server. They overlap in capability but have different strengths.

Use **REST API** for:
- Scheduled syncs and batch jobs (cron, CI, Windows Task Scheduler).
- High-volume reads and writes.
- Anything that needs deterministic retries, structured error handling, or integration with non-LLM tooling (WordPress plugins, QuickBooks flows, Excel exports).
- Anything in production code paths where reproducibility matters.

Use **MCP** for:
- Interactive workflows where a human + Claude are exploring data together.
- Ad hoc queries where the LLM can interpret loose natural-language intent.
- Prototyping before you know the exact endpoint shape.
- Situations where Bumble wants to ask "who's in group X?" and doesn't want to write a script.

**Do not** wrap MCP in production code as a substitute for the REST API. MCP is a human-assistance layer; it is not a stable machine-to-machine contract. If a project needs the same data both interactively (via MCP) and in production (via REST), build the production path on REST and let the MCP path read from the same underlying tenant independently.

Because the ChMeetings MCP resources page is the canonical index, fetch it fresh whenever a new project begins rather than relying on a snapshot — tools evolve faster than this doc.

## 8. Bilingual / Vietnamese-specific conventions

Nearly every deliverable in this portfolio eventually needs both English and Vietnamese. Design for this from day one:

- When ChMeetings' **Native Name** field is enabled, use it. Do not store Vietnamese names only in custom fields when there's a first-class field for them.
- Diacritics must round-trip. Test with `Nguyễn`, `Hồ`, `Phạm`, `Trần`, `Lê`, and `Đinh` at minimum. Any pipeline that lowercases or strips accents for matching must keep the original preserved for display.
- Phone numbers are usually US-formatted (10-digit North American) but sometimes stored with country code. Normalize to E.164 on ingest; display in the user's preferred format.
- Sort order for Vietnamese names in UI is a separate concern from sort order for English names; don't assume one sort works for both. Ask before implementing.
- Never translate proper nouns silently. "Redemption Point" stays "Redemption Point". "Vietnamese District" stays "Vietnamese District". If the user wants a Vietnamese translation, they'll ask.

## 9. Cross-project conventions

These are the conventions all three projects (`vaysf`, `rp-pathway-app`, `vdmansys`) should share.

### 9.1 Project layout
```
<project>/
  .env.template              # committed; blank values
  .gitignore                 # includes .env, *.key, credentials.json
  README.md                  # orientation + quick start
  CHANGELOG.md               # semver-tagged releases
  CLAUDE.md                  # points at this skill; adds project-specific notes
  chmeetings_openapi_v1.json # snapshot of the Scalar spec at last update
  middleware/ or src/        # language-appropriate source root
    chm_fields.py            # CHM_FIELDS mapping
    clients/                 # ChMeetings client + any other system clients
    tests/                   # mock mode by default; LIVE_TEST=true for real calls
  docs/
    INSTALLATION.md
    USAGE.md
    ARCHITECTURE.md
    TROUBLESHOOTING.md
```

Follow `vaysf`'s existing layout — it works.

### 9.2 Logging
Use structured logging (Python: `structlog` or stdlib `logging` with JSON formatter). Every log line that touches ChMeetings includes: tenant name, scope (diocese/church/ministry), endpoint, HTTP status, duration, and a request ID. Never log API keys or PII beyond what's strictly necessary for the operation.

### 9.3 Testing
Default to **mock mode** — tests run offline against fixtures. A `LIVE_TEST=true` environment variable opts into hitting the real API. CI runs mock mode only. Live tests run locally before a release.

Fixtures are committed under `tests/fixtures/` and are real API responses with PII redacted. Whenever the schema shifts, re-record and commit new fixtures.

### 9.4 Dependencies
Python projects pin with `requirements.txt` (and optionally `requirements-dev.txt`). Avoid optional dependencies that require system libraries (e.g., Selenium) unless there is no API path — and the `vaysf` migration away from Selenium makes this explicit: **prefer API over scraping, always.**

### 9.5 Commits and versioning
Semantic versioning. Commit messages follow the form `<scope>: <imperative summary>` (`middleware: add pledge read endpoint`, `skill: note 2026.5 Events Read API`). Keep `CHANGELOG.md` updated per release.

## 10. Project briefs

### 10.1 `vaysf` — VAY Sports Fest Integration
**Role:** Production system bridging ChMeetings (registration) ↔ WordPress (operations) for the annual Vietnamese Alliance Youth sports festival.
**Tenant scope:** VAY SM (church level within the VAY diocese).
**Tech:** Python middleware on Windows, WordPress plugin (PHP), MIT licensed.
**Key features:** Participant validation, pastor approval workflow, team rosters, API-based approval sync, Excel report fallback, centralized `CHM_FIELDS`, API field inspector.
**Not in scope:** General church management, contributions, accounting. Stay focused on sports fest participant lifecycle.

### 10.2 `rp-pathway-app` — Redemption Point Pathway
**Role:** (Planned.) Discipleship pathway tracking for Redemption Point Church members. Likely integrates ChMeetings People/Groups/Notes with a pathway model (RPMS / T.E.A.M.S. frameworks).
**Tenant scope:** RP (single church).
**Not in scope:** Sports fest logic (that's `vaysf`), district-wide reporting (that's `vdmansys`).

### 10.3 `vdmansys` — Vietnamese District Management System
**Role:** (Planned.) District-level operations and reporting across the churches under the Vietnamese District of C&MA. Likely consumer of the Churches, Ministries, and Events Read APIs; likely producer of consolidated health/attendance/financial reports.
**Tenant scope:** Vietnamese District (diocese level).
**Not in scope:** Single-church pathways (that's `rp-pathway-app`), sports fest registration (that's `vaysf`).

**Scope discipline:** Every time a feature feels like it "could live in any of them", stop and decide where it belongs before coding. Features living in the wrong project is the #1 risk to maintainability of this portfolio.

## 11. Update discipline

ChMeetings ships frequent, incremental releases (2026.1, 2026.2, 2026.3, 2026.4, 2026.5 all shipped between January and March 2026). Some of those releases expand the API surface; some change behavior of existing endpoints. Treat the release notes as required reading.

**When to update this skill:**
- A release note mentions any API, webhook, or MCP change.
- The field inspector detects new or renamed fields.
- A new endpoint is added to the Scalar spec.
- A behavior change breaks an assumption documented here.

**How to update:**
1. Open a PR against the skill repo.
2. Update the relevant section and the "Last verified" line at the bottom.
3. Note the ChMeetings version that triggered the update in the PR description.
4. Bump the skill version in `VERSION` (semver).
5. Each consuming project re-pulls the skill at its own cadence.

**When in doubt, search before coding.** Check the release notes and the Scalar spec before adding a new integration point. If the behavior differs from what's written here, trust the primary sources and fix the skill.

## 12. Reference checklist for a new ChMeetings integration

Before writing the first API call in a new project or feature:

- [ ] Tenant + scope identified (diocese / church / ministry) and documented in README.
- [ ] API key stored in `.env`, template committed, real key in password manager.
- [ ] `chmeetings_openapi_v1.json` snapshotted into the repo.
- [ ] `CHM_FIELDS` module stubbed with the fields this feature reads/writes.
- [ ] Mock-mode tests written before live calls.
- [ ] Pagination, rate-limit, and 5xx retry behavior decided and encoded.
- [ ] Logging includes tenant, scope, endpoint, status, duration.
- [ ] If webhooks are involved: idempotent handler, quick 2xx response, append-only log.
- [ ] If Vietnamese names/text are involved: Native Name field used, diacritics tested.
- [ ] CHANGELOG entry drafted.

---

**Last verified against:** ChMeetings 2026.5 (March 18, 2026 release notes); tenant-scoping behavior live-probed 2026-07-16.
**Skill version:** 0.1.3.
