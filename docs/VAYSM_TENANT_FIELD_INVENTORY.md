# VAY SM tenant field inventory and structure (redacted)

Probed: 2026-07-17, same read-only CDP session and redaction rules as
[`RP_TENANT_FIELD_INVENTORY.md`](RP_TENANT_FIELD_INVENTORY.md) — field names,
option labels, naming patterns, and URL shapes only; no member data. Console
context: VAY SM tenant admin console on the shared `vay.chmeetings.com` host.

Purpose: raw material for `vaysf` — validating its existing `CHM_FIELDS`
mapping against the live tenant and planning season-over-season maintenance.

## 1. Standard People fields

Identical to RP's list (see the RP doc §1: Work, Education, Communication,
Address, Family, Others incl. Envelope Number, Baptism, and the same "On …"
standard-field toggles). The standard sections appear to be account-wide.

Account-level settings were re-verified from the VAY SM console and match the
states observed from the RP console exactly — **Account Settings are
account-scoped, not tenant-scoped**. In particular: **Native Name ON**,
Nickname ON, Multilingual Events and Forms ON, Country field OFF,
"Independent church accounts" OFF. `vaysf` can rely on the Native Name field
per skill §8.

## 2. VAY SM custom People fields

All Sports Fest participant-lifecycle fields:

Registration and eligibility:

- **My role is** — Athlete/Participant; Parents paying for minors who play in
  Sports Fest; Church's Representative; Church Pastor, Leader, or Coach;
  VAY SM Staff; Fan and Supporter
- **Church Team** (dropdown)
- **"Would the team's Senior Pastor say that you belong to his church?"** —
  Yes / No (the pastor-affiliation gate behind the approval workflow)
- **Age verification (by the date of Sports Fest)** — over 18 but under 35 /
  under 18 / over 35
- Parent/guardian block for minors: Name / Email / Cell phone of my parents
  or legal guardian

Sports selection:

- Primary Sport (dropdown), Primary Racquet Sport Format (dropdown),
  Primary Racquet Sport Partner (if applied)
- Secondary Sport + Format + Partner (same trio)
- **Other Events** — Scripture Memorization, Track & Field, Tug-of-war,
  Soccer - Coed Exhibition

Workflow / operations:

- **Completion Check List** — 1. Correct identity, gender, age range;
  2. Consent Form Signed by Self or Parents; 3. Account created on Member
  Portal and logged in; 4. Valid Photo as ID for event check-in; 5. Approval
  from Pastor; 6. Paid All Fees
- Notes on Progress
- **Sports Fest Badge URL** — "This badge will be proof that this person can
  participate in Sports Fest"
- Additional Info

Shared-with-RP custom fields: "Where are you at" (4-Chair stages), "How do
you know about us", "Legal Name", and "Data source" appear in both tenants
with identical labels. Whether these are account-level custom fields or
per-tenant copies is not distinguishable from the UI; the People API's
"Get all member fields" endpoint (skill §4) can settle it per tenant.

## 3. Groups structure

Flat list (no hierarchy), first page showed 20 groups. Naming conventions:

| Pattern | Meaning |
|---|---|
| `Team <3-letter code>` | One group per participating church team (e.g. codes for Anaheim, Fountain Valley, Grace Alliance, Greater LA, Midway, RPC, San Diego…). The description spells out the full church name. |
| `<YYYY> …` | Season-scoped operational groups: season roster ("2026 Sports Fest", ~540 people), "2026 Staff", "2026 Volunteers & Church Reps" |
| `Senior Staff` | Standing leadership group |
| `Lost and Found` | Holding group for registrants no church rep recognizes |
| `_API-TEST-GROUP` | Underscore-prefixed test fixture (0 people) — safe target for `vaysf` integration tests |

Mapping notes for `vaysf`:

- Team membership is modeled as group membership (Team XXX), while team
  affiliation also exists as the "Church Team" custom field — two sources for
  the same fact; keep the field↔group reconciliation explicit in sync code.
- Season rollover appears to be "new `<YYYY> …` groups each year," so any
  group-keyed logic needs the season prefix parameterized, not hard-coded.

---

**Probed:** 2026-07-17 (read-only). Leader/admin names and per-group people
counts beyond order-of-magnitude are intentionally omitted.
