# Changelog

All notable changes to this skill are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the skill uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.5] - 2026-07-17

Findings from the issue #2 read-only live probes (RP tenant console, CDP
session, 2026-07-17). No settings were changed and no records were touched
during the probes.

### Added
- RP tenant field inventory and structure guide (`docs/RP_TENANT_FIELD_INVENTORY.md`),
  redacted to field names, option labels, and naming patterns: standard +
  custom People fields (discipleship-pathway fields included), Native Name
  enablement, flat Groups structure with naming conventions, forms-in-use
  patterns, and RP Member Portal state.
- VAY SM tenant field inventory (`docs/VAYSM_TENANT_FIELD_INVENTORY.md`) for
  `vaysf`: Sports Fest custom-field catalog (role, church team, sports
  selection, completion checklist, badge URL), team/season group naming
  conventions, and confirmation that Account Settings (incl. Native Name) are
  account-scoped rather than per-tenant.
- Branded-host entrypoint section in the web entrypoints doc: a branded host
  root (`rpc.chmeetings.com/`) sends anonymous visitors straight to `/guest`
  with no tenant path id, unlike the shared-host root's login redirect.

### Changed
- Skill §1: corrected the tenant hierarchy — "Vietnamese District" is a
  church-level tenant (a registry of the District's pastors) inside the
  Vietnamese Alliance Churches diocese account, a sibling of RP and VAY SM,
  not a separate diocese-level account.
- Skill §3: documented the key-issuance UI reality at church scope — one
  80-char key per tenant, readonly display, no scopes/permissions/expiry, and
  "Change Key" as destructive rotation that disables all connected apps.
- Skill §4: rate limiting — ChMeetings now publishes a limit but their docs
  conflict (100 req/s vs 100 req/20s); design to the conservative number.
  API-surface table updated: Groups API now has person add/remove writes,
  Events API grew occurrence/attendance reads, plus Organizations-scoped
  variants, Address API, Blog Posts CRUD, and People "Get all member fields"
  (the programmatic path to a `CHM_FIELDS` inventory). Live OpenAPI spec URL
  recorded in §2.
- Skill §5: webhooks — verification uses a per-webhook **Secret Key**
  retrievable only from the Edit dialog after creation; no HMAC or signature
  header is documented (UI, Help Center, or OpenAPI spec, checked
  2026-07-17). Registration is one endpoint URL + event checkboxes; there is
  no delivery log or retry UI. Event catalog gained Attendance `checked_in`.
  Open question recorded: whether the Secret Key arrives as a header or in
  the payload.
- Skill §8: Native Name confirmed enabled for RP.
## [0.1.4] - 2026-07-17

### Added
- `jlife-platform` registered as the fourth consuming project: README table row, consumption recommendation (Option C reference until its ChMeetings Phase C, then Option A submodule), and a §10.4 project brief covering its one-way ChMeetings → Disciple.Tools roster sync (`jlife-chm-sync`), RP tenant scope, the scope line with `rp-pathway-app` (the RP tenant's other consumer), its governing `integration-boundaries.md`, and the skill sections most relevant to it (multi-tenancy/merge-orphan lifecycle, webhooks, `CHM_FIELDS`, Vietnamese conventions).

### Changed
- Scope-discipline note now flags that the RP tenant has two consumers.

## [0.1.3] - 2026-07-16

### Added
- Multi-tenancy and duplicate-person lifecycle guide (`docs/MULTI_TENANCY_AND_DUPLICATES.md`): live-verified API key scoping semantics (church-scoped keys get a plain 404 for sibling-tenant people; diocese-scoped keys see across tenants with a `church` field naming the owning tenant), key-management rules for diocese-level keys, and the general repair workflow for merge-orphaned external rows — in-tenant-first survivor search, cross-tenant escalation, the merge-direction rule (survivor must remain in the operating tenant), and retire-never-delete external-row repair.

### Changed
- The shared skill's API-surface section now summarizes multi-tenant scoping pitfalls and points to the new guide.

## [0.1.2] - 2026-07-15

### Added
- Dependency-free Member Portal contract validator with a versioned baseline, official Help Center API checks, public route checks, optional read-only Chrome DevTools Builder inspection, Markdown/JSON reports, and offline tests.
- Validation runbook defining the annual pre-customization gate, drift triage, manual test matrix, and controlled baseline update process.

### Changed
- The architecture guide and shared skill now require the validation gate before seasonal Member Portal customization.

## [0.1.1] - 2026-07-15

### Added
- Documentation note for VAY ChMeetings web entrypoints, `https://onelink.to/_vay` routing, shared-versus-branded tenant hosts, the verified VAY SM Guest route, Guest/Member portal variants, and Member Portal integration implications.
- Member Portal Builder architecture and UX guide covering native card and Page selection, HTML/CSS/JavaScript support boundaries, external app integration, iframe pilots, mobile UX, security, testing, and publishing governance.

### Changed
- The shared skill now directs Member Portal Builder work to the maintained architecture and entrypoint guides.

## [0.1.0] — 2026-04-22

### Added
- Initial skill covering platform orientation, canonical resources, auth, API surface, webhooks, field mapping (`CHM_FIELDS` pattern), REST-vs-MCP guidance, bilingual/Vietnamese conventions, cross-project conventions, and project briefs for `vaysf`, `rp-pathway-app`, and `vdmansys`.
- Verified against ChMeetings 2026.5 (March 18, 2026 release notes).
- Reference checklist for starting a new ChMeetings integration.
