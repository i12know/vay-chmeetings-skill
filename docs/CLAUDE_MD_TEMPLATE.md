# CLAUDE.md snippet for consuming projects

This file is a template. Copy the section that fits your chosen sync strategy (A, B, or C from the top-level README) into the **root `CLAUDE.md`** of each consuming project (`vaysf`, `rp-pathway-app`, `vdmansys`).

---

## Option A — if you used `git submodule`

```markdown
## Skills

This project uses the shared ChMeetings skill, vendored as a git submodule at:

    .claude/skills/chmeetings/skill/SKILL.md

Claude Code should read that file before writing any ChMeetings integration
code, whenever a task touches the ChMeetings API, MCP server, webhooks, or
the `CHM_FIELDS` mapping. The skill is authoritative for conventions shared
across `vaysf`, `rp-pathway-app`, and `vdmansys`. Project-specific notes that
don't belong in the shared skill go below in this file.

To update the skill to the latest upstream version:

    git submodule update --remote .claude/skills/chmeetings
    git commit -am "update chmeetings skill to $(cat .claude/skills/chmeetings/VERSION)"

Upstream: https://github.com/i12know/vay-chmeetings-skill
```

---

## Option B — if you used the sync script

```markdown
## Skills

This project uses the shared ChMeetings skill, vendored as a copy at:

    .claude/skills/chmeetings/SKILL.md

Claude Code should read that file before writing any ChMeetings integration
code, whenever a task touches the ChMeetings API, MCP server, webhooks, or
the `CHM_FIELDS` mapping. The skill is authoritative for conventions shared
across `vaysf`, `rp-pathway-app`, and `vdmansys`.

To pull the latest version, run:

    scripts/sync-vay-chmeetings-skill.sh

Then commit the updated file.

Upstream: https://github.com/i12know/vay-chmeetings-skill
```

Also drop this script into `scripts/sync-vay-chmeetings-skill.sh` and make it executable:

```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p .claude/skills/chmeetings
curl -sSL https://raw.githubusercontent.com/i12know/vay-chmeetings-skill/main/skill/SKILL.md \
  -o .claude/skills/chmeetings/SKILL.md
echo "Synced chmeetings skill."
```

---

## Option C — if you're using reference-only

```markdown
## Skills

Before writing any ChMeetings integration code, read the shared skill at:

    https://github.com/i12know/vay-chmeetings-skill/blob/main/skill/SKILL.md

It covers conventions shared across `vaysf`, `rp-pathway-app`, and `vdmansys`
for the ChMeetings API, MCP server, webhooks, and the `CHM_FIELDS` mapping
pattern. Project-specific notes below in this file override it where needed,
but the shared skill is the default.
```

---

## After pasting, append project-specific notes

Below the skill reference, add anything that's specific to this repo only — build commands, how to run tests live vs mocked, local-dev quirks, WordPress-plugin gotchas for `vaysf`, etc. Keep general ChMeetings guidance in the shared skill, not here.
