# Contributing to vay-chmeetings-skill

This skill is small on purpose: one file, one job. Keep it that way.

## When to open a PR

- A ChMeetings release note mentions a change to any API, webhook, or MCP resource.
- A consuming project's field inspector has detected drift that a new reader would benefit from knowing about.
- A convention that every project in the portfolio should follow has emerged in one project and proved itself.
- A section of the skill has gone stale and misleads someone writing new code.

## When NOT to open a PR

- Project-specific conventions. Those belong in the consuming project's `CLAUDE.md`, not here.
- Speculation about what ChMeetings might ship next. Wait until it's in release notes or the Scalar spec.
- Secrets of any kind. Ever.

## PR checklist

- [ ] Updated the relevant section in `skill/SKILL.md`.
- [ ] Updated the "Last verified against" line at the bottom of `skill/SKILL.md` if the change reflects a newer release.
- [ ] Bumped `VERSION` (patch for edits and clarifications, minor for new sections, major for breaking reorganization).
- [ ] Added an entry to `CHANGELOG.md`.
- [ ] PR description names the ChMeetings version (e.g., `2026.6`) or the consuming project that motivated the change.

## Style

- Prose first. Bullet lists only where they genuinely help scanning.
- No screenshots. Text only.
- Link to primary sources (Scalar spec, help center article, release note) rather than paraphrasing at length.
- Keep the file readable start-to-finish in one sitting. When it starts to feel long, prune rather than append.
