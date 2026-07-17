# Multi-tenancy, API key scoping, and the duplicate-person lifecycle

How ChMeetings tenant scoping actually behaves at the API level, and the general
workflow for handling duplicate person records — both within one tenant and across
tenants. Everything here was verified by live read-only probes against the VAY
diocese account on 2026-07-16 (vaysf issue #228 investigation); the findings apply
to any project in this portfolio that syncs ChMeetings people to an external system.

## 1. What tenant scoping actually means

A ChMeetings account can be a hierarchy: a diocese-level organization with child
church tenants (and ministries below those). API keys are issued **per organization**
and are hard-scoped to it. Verified behavior:

| Capability | Church-scoped key | Diocese-scoped key |
|---|---|---|
| `GET /people/{id}` for own-tenant person | 200 | 200 |
| `GET /people/{id}` for sibling-tenant person | **404 `"Invalid Person Id"`** | 200 (record includes a `church` field naming the owning tenant) |
| `GET /people?email=...` matching people in two tenants | returns only the in-tenant match | returns all matches across tenants |
| `GET /organizations` | exactly 1 (its own) | full tree, rooted at the diocese |

Three consequences worth memorizing:

1. **Cross-tenant invisibility is a 404, not a 403.** A church-scoped key cannot
   distinguish "this person exists in a sibling tenant" from "this person was
   deleted" from "this ID never existed." Do not write code that infers deletion
   from a 404.
2. **Scoping is a property of the key, not the account.** The same Owner login that
   sees every tenant in the web UI gets fully-walled API access through a
   church-scoped key. Web-UI observations are not evidence of what the API key
   can do.
3. **Attachment/photo blob storage is account-scoped, not tenant-scoped.** Photo
   URLs (`chmeetings.blob.core.windows.net/<account>/attachments/...`) remain valid
   regardless of tenant boundaries and survive merges. A cached photo URL is a
   useful cross-tenant identity hint even when the person record itself is
   invisible.

## 2. Key management for multi-tenant portfolios

Extends §3 of the skill:

- **The default connector key must match the project's operating tenant.** Every
  bare people-search and person write in the codebase inherits the key's scope. A
  diocese key in the default slot silently widens every match pool (wrong-person
  matching) and every `PUT /people/{id}` reach (cross-tenant writes) — verified
  failure mode, not hypothetical.
- **If a project needs occasional diocese-level reads** (duplicate adjudication,
  cross-tenant audits), put that key in a **separate, explicitly-named variable**
  (e.g. `CHMEETINGS_API_KEY_VAY_DIOCESE`; in `vaysf`, `CHM_DIOCESE_API_KEY`), read
  it only inside a dedicated cross-tenant code path, and keep it blank in
  `.env.template`. Never let it flow into the default connector, sync loops, or
  anything with write access.
- **Never "temporarily swap" the diocese key into the default variable** on a
  machine with scheduled syncs. If an experiment requires it, disable the
  scheduler first and re-verify the tenant wall (probe a known sibling-tenant ID,
  expect 404) after swapping back.

## 3. The duplicate-person lifecycle

Duplicates arise two ways, and they interact:

- **In-tenant duplicates** — a returning member registers again (season form, new
  email, parent registering a child) and gets a second person record in the same
  tenant. When an admin later merges them, the losing ID starts returning 404 and
  any external system holding that ID has a stale row.
- **Cross-tenant duplicates** — the same human has person records in two tenants
  (registered at the diocese-run event *and* a member of their home church's
  tenant). Both records are alive; nothing is broken until someone merges them.

Verified base rate from the 2026 season (12 audited merge-orphan cases): **all 12
were in-tenant** — returning athletes whose new season registration duplicated a
prior-season profile and was merged into it. Cross-tenant merge orphans are so far
hypothetical, but the duplicate *pairs* that would produce them demonstrably exist.

### The general repair workflow

When an external system (WordPress, etc.) holds a ChMeetings ID that now 404s:

1. **Detect** (operating-tenant key): the stored ID returns 404. Record the stale
   row's cached identity — name, email, phone, birthdate, photo URL.
2. **Find the in-tenant survivor first** (operating-tenant key): search people by
   email → phone → name+birthdate. This resolves the overwhelming majority of
   cases (12/12 observed). Strong match = same email or phone; weak match =
   name+birthdate only.
3. **Escalate cross-tenant only if step 2 fails** (diocese key, read-only, or the
   Owner's diocese-level People search in the web UI): the same identity search
   across all tenants. The `church` field on each result names the owning tenant.
4. **Adjudicate and merge — manual, in the UI.** There is no merge API. Merging is
   an Owner action (Settings → Tools → Merge People at the level that sees both
   records). **Merge-direction rule: the surviving profile must remain a member of
   the operating tenant.** If the out-of-tenant record wins the merge, immediately
   re-add the survivor to the operating tenant (church + relevant groups + the
   event/season fields carried over), or the person silently disappears from every
   sync — a merge that behaves like a withdrawal.
5. **Repair the external system**: retire the stale row (mark it ignored by sync
   surfaces — never hard-delete; the audit trail and the possibility of a person
   re-entering the tenant both argue for retirement). Verify the survivor ID has a
   live external row, then resync it.
6. **Weak matches never auto-repair.** Name+birthdate-only matches require an
   explicit operator decision (waiver file or equivalent), because no API signal —
   at either scope — can upgrade them to certainty.

### Prevention beats repair

- Proactively scan for duplicate pairs (same email/phone, two live IDs) *before*
  admins merge them, so merges happen with the external-system consequences known.
- When admins merge in-tenant duplicates mid-season, prefer keeping the ID the
  external system already holds, when the profiles are otherwise equivalent.
- Log every 404-on-known-ID during syncs distinctly (it is a lifecycle event, not
  an error) so orphan detection is a log query, not an investigation.

---

**Verified:** 2026-07-16, live probes against the VAY diocese account (church-scoped
and diocese-scoped keys), vaysf issue #228. Person IDs and identities in the
underlying investigation are PII and stay in the consuming repo's local notes.
