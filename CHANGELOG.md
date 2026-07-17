# Changelog

All notable changes to this skill are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the skill uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
