# RP tenant field inventory and structure (redacted)

Probed: 2026-07-17, read-only CDP session against the Redemption Point Church
(RP) admin console on the shared `vay.chmeetings.com` host (Owner login, Admin
View). Sources: Settings → Profile Fields, Settings → Account Settings, Groups
module, Forms list, Member Portal Builder, and anonymous fresh-context renders
of the public portal routes. No member data appears in this document; every
item below is a field name, option label, naming pattern, or URL shape.

Purpose: raw material for a future `CHM_FIELDS` → Disciple.Tools (or other
external-system) mapping for RP consumers (`rp-pathway-app`, J-Life onboarding).

## 1. Standard People fields enabled at RP

From Settings → Profile Fields (field definitions screen; no values shown):

| Section | Fields |
|---|---|
| Work | Job Title, Employer, Talents And Hobbies |
| Education | Education Level, Qualification, School, Grade |
| Communication | Home Phone, Facebook |
| Address | Address Line, Address Line 2, City, State, Zip Code, Building No, Floor, Apartment |
| Family | Family Members |
| Others | Father of Confession, Church, Deacon, Marital Status, Join Date, Gender, Envelope Number |
| Baptism | Baptism Date, Baptism Location |

Standard-field toggles observed (labeled "On …" in the UI): church membership,
honorific title, 4-Chair Discipleship Phase, Contact Info, Their Household,
DOB (with estimated-birthday / estimated-birthyear options), Deceased Date,
Attachment (file upload, 10 MB limit).

Account Settings relevant to name handling (RP console, 2026-07-17):

- **Enable Native Name: ON** — skill §8 applies; use the first-class field.
- Enable Nickname: ON.
- Enable Multilingual Events and Forms: ON.
- Enable Country field in People profiles: OFF.
- Name Format: "Last Name, First Name Middle Name".
- Member Portal Default Language: English.
- Diocese feature "Independent church accounts": **OFF** — members can join or
  switch between churches in this diocese, which is one of the ways
  cross-tenant duplicate pairs form (see `MULTI_TENANCY_AND_DUPLICATES.md`).

## 2. RP custom People fields

Names and option labels only. The custom-field palette supports: Text Entry,
Numbers, Multiple line text, Checkbox, Dropdown, Dynamic Dropdowns, Multiple
choice, Date, Section, File.

Discipleship-pathway fields (the core of a future D.T mapping):

- **"Where are you at"** — single choice, four stages tracking the 4-Chair
  framework (curious/open → decided to follow → following and sharing →
  mentoring others).
- **"My Spiritual Journey"** — eight stages: 1. Meeting Jesus, 2. Understand
  Faith Foundation, 3. Commit: Jesus + Church, 4. Establish Spiritual Rhythms,
  5. Live the Gospel in Life, 6. Become a Disciplemaker, 7. Develop Ministry
  Skills, 8. Multiply Gospel Community. Each stage carries a checklist of
  cohorts/practices (e.g. baptism, membership renewal, named cohort courses,
  serving/giving/sharing practices, leadership and multiplication milestones).
- Two long-text gospel-reflection questions (personal testimony prompts).
- "My 8-to-15 close friends/family whom I want share with" (long text).

Administrative / operational custom fields:

- Legal Name
- Data source
- RP Membership Renewal Date
- RP Group List (dropdown)
- My demographics at RP (Middle School / High School / College / Single Young
  Adults / two adult-group options / RP Vietnamese)
- My T-shirt Size (S / M / L / XL)
- RP Jump Pad, RP notes
- "How do you know about us"

Youth-ministry form block (fields exist on the profile):

- Emergency Contact (other than parent), Relationship with Youth, Phone Number
- Medical Insurance Company, Medical Insurance Policy #
- Physician, Physician Phone Number

Mapping note: the pathway fields ("Where are you at", "My Spiritual Journey")
are the natural candidates for D.T contact stages/milestones; the demographics
and RP Group List fields duplicate information that also lives in Groups —
decide one source of truth before mapping both.

## 3. Groups structure

RP has ~20 groups in a **flat list** — no folders or hierarchy. Structure is
expressed through naming conventions:

| Prefix / pattern | Meaning |
|---|---|
| `Team: …` | Staff/leadership teams (elders, group leaders, committees) |
| `Cohort in YYYY - …` | Time-bound study cohorts |
| `RP …` / `RPV …` | Demographic or ministry groups (youth, women, college, Vietnamese-language) |
| `wip …` | Work-in-progress membership sets |
| `zOld …` / `zDefunct? …` | Archived (z-prefix sorts to bottom) |
| `YYYY …` | Year-scoped groups (e.g. newcomers of a season) |

Group list columns: Group Name, Visibility (observed values: "Members",
"Users"), Leaders, People count, Description. Descriptions are used as rich
member-facing text with external links. Vietnamese names with diacritics are
used in group names and round-trip correctly in the UI.

Mapping judgment: any Disciple.Tools group mapping for RP should key off the
naming prefixes (team vs cohort vs demographic vs archived), not hierarchy —
there is none.

**Ministries:** RP has no ministry sub-scopes. The tenant switcher shows only
sibling church tenants plus an unused "Add Ministry" affordance.

## 4. Forms in use

36 forms exist (names and status only). Patterns: `RP …` prefix, `(Test) …`
prefix for drafts, versioned surveys ("RP Pathway Survey", "… v.02", "… v.03"
— all simultaneously Active), event-dated RSVP forms, and seasonal forms that
are Disabled after their season rather than deleted. Active forms as of the
probe include a scholarship request, membership covenant renewal, prayer and
group signup forms, next-steps forms, and the pathway surveys.

## 5. Tenant hierarchy (correction context for skill §1)

The Churches screen at RP scope lists the full diocese: the **Vietnamese
Alliance Churches** diocese account contains nine church tenants, including
RP, VAY SM, Midway Church, VAY Southern California, VAY-EM, and **"Vietnamese
District" — itself a church-level tenant** whose purpose is to hold the
District's pastors as people records. RP and Vietnamese District are siblings,
not parent/child. Skill §1 was corrected accordingly in 0.1.5.

## 6. RP Member Portal state (P4 summary)

- The RP Builder contains one page ("Home Page (Default Page)") with the
  standard 20-card palette (matches the validation baseline catalog). Home
  page cards at probe time: an **expired card still present in the layout**
  (marked "Expired On 27 Mar 2026"), a sermon-notes submission link card, a
  daily-devotionals feed card, an Upcoming Events card, and a Give button.
- Live anonymous portal nav: Home, Events, "History of Redemption Point",
  "RP Giving", More.
- **Branded-host delta vs the VAY-observed entrypoint notes:** RP's branded
  host root (`rpc.chmeetings.com/`) redirects an anonymous visitor straight
  to `/guest` — the live portal, with no tenant path id needed in the URL.
  The shared-host root behavior (fresh visitor → `/Account/Login`) matches
  the VAY observations. The shared-host tenant-scoped guest route
  (`vay.chmeetings.com/<RP-path-id>/guest`) is also live and public.
- i18n oddity: in anonymous fresh contexts the shared-host guest route
  rendered several labels as raw i18n keys (`common.homePage`, `login.Login`,
  `giving.give`); the branded host resolved all labels. Possibly transient;
  re-check before relying on shared-host links in public instructions.

---

**Probed:** 2026-07-17 (read-only; no settings changed, no records edited, no
forms submitted, no keys generated). Member/leader/admin names, people counts
per group, submission counts, and payment-provider identifiers observed during
the probe are intentionally omitted.
