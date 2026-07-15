# vay-chmeetings-skill

Shared Claude Code skill for the `i12know` ChMeetings project portfolio.

## What this is

This repo holds a single source of truth that teaches Claude Code how to work with the ChMeetings platform consistently across every project that integrates with it. Instead of re-explaining ChMeetings conventions, API quirks, webhook patterns, and field-mapping discipline in every repo, those conventions live here and every consuming project pulls from this one.

## Consuming projects

| Project | Scope | Description |
|---|---|---|
| [`vaysf`](https://github.com/i12know/vaysf) | VAY (diocese) | VAY Sports Fest registration + operations bridge to WordPress |
| [`rp-pathway-app`](https://github.com/i12know/rp-pathway-app) | Redemption Point (church) | Discipleship pathway tracking for RP members |
| [`vdmansys`](https://github.com/i12know/vdmansys) | Vietnamese District (diocese) | District-level operations and reporting across member churches |

## Repo layout

```
vay-chmeetings-skill/
├── README.md             # this file
├── VERSION               # semver of the skill
├── CHANGELOG.md          # skill release history
├── CONTRIBUTING.md       # how to propose updates
└── skill/
    └── SKILL.md          # the skill itself — this is what Claude Code reads
```

## Supporting docs

- [`docs/WEB_ENTRYPOINTS_AND_MEMBER_PORTAL.md`](docs/WEB_ENTRYPOINTS_AND_MEMBER_PORTAL.md) documents observed behavior for `https://onelink.to/_vay`, `https://vay.chmeetings.com/`, login-state routing, and Member Portal integration implications.
- [`docs/MEMBER_PORTAL_BUILDER_ARCHITECTURE.md`](docs/MEMBER_PORTAL_BUILDER_ARCHITECTURE.md) is the architecture and UX guide for Builder cards, Pages, HTML/CSS/JavaScript boundaries, external apps, iframe pilots, mobile behavior, security, and publishing governance.
- [`docs/MEMBER_PORTAL_VALIDATION_RUNBOOK.md`](docs/MEMBER_PORTAL_VALIDATION_RUNBOOK.md) provides the repeatable pre-customization contract check for official documentation, public routes, and an optional read-only live Builder inspection.

Quick validation before Member Portal work:

```powershell
node scripts\validate-member-portal.mjs --require-cdp
```

## How consuming projects use it

There are three deployment options. Pick one per repo; the skill itself is identical.

### Option A — git submodule (recommended for active projects)

In each consuming project:

```bash
git submodule add https://github.com/i12know/vay-chmeetings-skill .claude/skills/chmeetings
git commit -m "add chmeetings skill as submodule"
```

Then in the project's root `CLAUDE.md`:

```markdown
## Skills

This project uses the shared ChMeetings skill at `.claude/skills/chmeetings/skill/SKILL.md`.
Claude Code should read that file before writing any ChMeetings integration code.

To update the skill after the upstream repo changes:

    git submodule update --remote .claude/skills/chmeetings
    git commit -am "update chmeetings skill"
```

Pros: explicit version pin per project, easy to update on your schedule.
Cons: submodules have a learning curve if other contributors aren't used to them.

### Option B — sync script (simplest)

Copy `skill/SKILL.md` into each consuming project at `.claude/skills/chmeetings/SKILL.md` using a small script:

```bash
# scripts/sync-vay-chmeetings-skill.sh
curl -sL https://raw.githubusercontent.com/i12know/vay-chmeetings-skill/main/skill/SKILL.md \
  -o .claude/skills/chmeetings/SKILL.md
```

Run it when you want to pull changes. Commit the result. Pros: no submodule complexity. Cons: easy to forget to sync.

### Option C — reference only

Point the consuming project's `CLAUDE.md` at the upstream repo without vendoring:

```markdown
## Skills

Before writing ChMeetings integration code, read the shared skill at:
https://github.com/i12know/vay-chmeetings-skill/blob/main/skill/SKILL.md
```

Pros: zero maintenance. Cons: requires Claude Code to fetch remotely, and offline work has no context.

**Recommendation:** Option A for `vaysf` (active production work); Option B for `rp-pathway-app` and `vdmansys` while they're still early.

## When to update this skill

See §11 "Update discipline" inside `skill/SKILL.md`. Short version: whenever a ChMeetings release notes entry mentions an API, webhook, or MCP change, or whenever the field inspector in a consuming project finds drift, open a PR here.

## Non-goals

- This skill does **not** replace project-specific `CLAUDE.md` files. Those still exist in each consuming repo and capture project-specific conventions (build commands, test invocation, repo-unique workflows).
- This skill does **not** hold secrets. No API keys or private identifiers. Public tenant route identifiers may be documented only as part of a verified public URL.
- This skill is **not** an API reference. The Scalar docs at https://api.chmeetings.com/scalar/ are the API reference. This skill is the integration playbook that sits on top of it.

## License

MIT. See `LICENSE`.
