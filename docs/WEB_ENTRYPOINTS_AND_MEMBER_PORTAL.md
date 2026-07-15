# ChMeetings Web Entrypoints and Member Portal Notes

Last observed: 2026-07-15

Filed from Codex task: `VAY ChMeetings Member Portal entrypoints documentation`

Codex task id: `019f6683-1c35-7ed3-8217-196528914f17`

Repository: `https://github.com/i12know/vay-chmeetings-skill`

Local folder: `S:\MyPrj\vay-chmeetings-skill`

This note captures the behavior we observed around the VAY ChMeetings public
entrypoint, mobile app shortcut, and Member Portal. It is intended for later web
integrations such as Sports Fest registration, badge display, direct links from
WordPress, QR codes, email/SMS links, and any helper tools that need to send
people into ChMeetings.

## Quick orientation for contributors

In ChMeetings, "landing page" can refer to several different screens. Always
name the specific surface when documenting or implementing an integration:

| Surface | Current VAY SM example | Who sees it |
|---|---|---|
| Shared tenant root | `https://vay.chmeetings.com/` | Entry point; result depends on login state and role |
| Public Guest portal | `https://vay.chmeetings.com/2E3F3637741B61D9/guest` | Anonymous visitors |
| Member portal home | Same portal, rendered for an authenticated member | Logged-in members |
| Builder | `https://vay.chmeetings.com/2E3F3637741B61D9/Core/MemberAccess/builder` | Admin/staff configuration |
| Builder phone preview | Right side of the Builder | Guest or Member simulation selected by the editor |

The tenant root, Guest portal, Member portal, and Builder are related, but they
are not interchangeable URLs or user experiences.

## Key takeaway

Do not treat `https://vay.chmeetings.com/` as one fixed landing page.

It is an entrypoint into the VAY ChMeetings tenant. What a person sees depends
on at least:

- Device type: desktop browser, Android, or iPhone.
- Login state: anonymous visitor, logged-in member, logged-in admin/staff.
- ChMeetings role and permissions.
- Whether the URL is the tenant root, a member-facing deep link, an admin route,
  or a mobile app route.

For user-facing instructions, plain language such as "go to VAY Connect" or
"open VAY ChMeetings" is usually safer than promising that everyone will see the
same exact screen.

## Hosting and tenant model

`vay.chmeetings.com` is a shared VAY diocese host. VAY SM (Sports Fest) and the
other ordinary VAY tenants share this host. A church can have a different host
when it pays for a ChMeetings Branded Mobile App.

Current operational example:

| Tenant | Landing host | Reason |
|---|---|---|
| RPC | `https://rpc.chmeetings.com/` | RPC pays annually for its Branded Mobile App |
| VAY SM / Sports Fest | `https://vay.chmeetings.com/` | Uses the shared VAY host |
| Other VAY tenants without a branded app | `https://vay.chmeetings.com/` | Uses the shared VAY host |

The shared hostname does not mean all churches use the same portal content.
ChMeetings scopes tenant-specific routes with an identifier such as
`2E3F3637741B61D9` for the currently observed VAY SM routes.

## Current public shortcut

The current public shortcut is:

```text
https://onelink.to/_vay
```

Observed routing:

| Visitor context | Observed destination |
|---|---|
| Desktop browser | `https://vay.chmeetings.com/?` |
| Android browser | `market://details?id=com.jiosdev.chmeetings.vay` |
| iPhone browser | Onelink page pointing to `https://apps.apple.com/app/id6744648189?` |

Plain-English meaning: this link gets people into the VAY ChMeetings / VAY
Connect ecosystem. On desktop, it sends them to the VAY ChMeetings web tenant.
On mobile, it asks them to download/open the app.

This is a good general entry link. It is not, by itself, proof that people will
land on a specific Member Portal page, Sports Fest page, event, form, or badge
screen.

## Fresh visitor web landing page

When `https://vay.chmeetings.com/` was opened in a fresh browser context with no
ChMeetings cookies, ChMeetings redirected to:

```text
https://vay.chmeetings.com/Account/Login
```

The page title was:

```text
Vietnamese Alliance Churches
```

Visible page content included:

- Language selector: English
- Email or phone
- Password
- Remember me
- Forgot Password?
- Log In
- New User? Create Account
- I am a Church Member
- Find My Church
- Powered by ChMeetings branding

The displayed tenant image was loaded from ChMeetings' CDN.

## Verified public Guest portal URL

The current anonymous VAY SM / Sports Fest landing page is directly reachable
without a ChMeetings login at:

```text
https://vay.chmeetings.com/2E3F3637741B61D9/guest
```

This route was tested in a temporary browser context with no ChMeetings cookies.
The page loaded completely with the title `VAY SM` and showed:

- VAY SM branding.
- The Sports Fest 2026 banner and introductory text.
- All Schedules.
- Sports Fest Handbook.
- Sports Fest Facility and Safety Notice.
- VAY SM social links.

The tenant identifier is significant. The shorter URL below did not select VAY
SM and redirected an anonymous visitor to `/Account/Login`:

```text
https://vay.chmeetings.com/guest
```

Likewise, the shared root currently redirects a fresh desktop visitor to the
login page. The desktop destination of `https://onelink.to/_vay` is the shared
root, not the verified VAY SM Guest URL. Treat these as different entrypoints.

Do not guess or remove the tenant identifier when generating links. Verify the
complete route before publishing it in WordPress, email, SMS, or a QR code.

## Logged-in behavior

When the same root URL was opened in a Chrome session that was already logged in
as an admin/staff user, ChMeetings redirected to the admin dashboard:

```text
https://vay.chmeetings.com/2E3F3637741B61D9/Core/Dashboard
```

Visible dashboard content included admin navigation such as:

- Dashboard
- People
- Groups
- Events
- Forms
- Reports
- Member Portal
- Settings
- Log Out

This is important: a logged-in admin sees a very different result from an
anonymous visitor. Do not use an already-authenticated staff browser as the only
test for public instructions.

## Member Portal implications

The Member Portal should be treated as the member-facing experience, not the
same thing as the tenant root login page.

For the supported Builder card catalog, HTML/CSS/JavaScript boundaries,
external-app architecture, iframe policy, and mobile UX checklist, see the
[Member Portal Builder Architecture and UX Guide](MEMBER_PORTAL_BUILDER_ARCHITECTURE.md).

For Sports Fest and similar workflows, the Member Portal may be the better home
for:

- Sports Fest welcome or instruction pages.
- Event registration links.
- Embedded ChMeetings forms.
- Schedule and location information.
- Check-in instructions.
- Static badge or QR-code instructions.
- Help text for account creation, family members, and profile updates.

The Member Portal Builder is especially relevant because it supports page/card
composition. In previous investigation, the Text/HTML Card appeared to be the
best candidate for rendered HTML and images. Ordinary custom profile fields may
escape HTML and show it as literal text.

## Guest and Member landing-page variants

The Member Portal landing page is stateful: ChMeetings renders a different app
shell and navigation for an anonymous Guest and an authenticated Member.

### Guest view

The actual anonymous Guest route was verified in a fresh browser context. The
Builder's Guest phone preview showed the same current Sports Fest content and a
simpler navigation focused on public access.

### Member preview

Switching the Builder's right-side phone preview to `Member` did not save or
publish any change. It showed:

- A personalized greeting: `Hello Bumble,` for the current preview identity.
- Search, notifications, and account controls.
- Bottom navigation for Home, My Profile, Directory, Groups, and More.
- The same current Sports Fest banner, text, schedules, handbook, and safety
  notice.

The current Sports Fest cards appear in both previews because their audience
configuration permits members to see them. Builder cards can instead target
`Member`, `Guest`, or `Both`, so the content itself can also differ by login
state.

Important evidence boundary: the anonymous Guest route has been verified as a
real public page. The Member result above is the Builder preview. A genuine
member-facing browser test still requires an ordinary member login; the current
admin/staff session is not a substitute for that test.

## Member Portal Builder admin home page

When a logged-in admin/staff user opens the Builder, ChMeetings currently uses:

```text
https://vay.chmeetings.com/2E3F3637741B61D9/Core/MemberAccess/builder
```

The page title observed in Chrome was:

```text
VAY SM - Co Ho Nghiệp | Builder
```

Visible Builder content included:

- Builder
- Church App
- "To Edit the church logo & URL please go to Account settings"
- Customize Your App
- Builder Home Page (Default Page)
- Add Page
- Menu Setup
- Settings
- Add Cards
- Preview
- Guest / Member preview toggle or labels

The Builder showed a drag-and-drop card list with card types including:

- Container
- Link
- Video
- Audio
- Photos
- Media
- Form
- Event
- Upcoming Events
- Calendar
- Article
- Blog
- Donate Button
- Google Map
- Social Media Links
- Live Streaming
- Verse of the Day
- RSS Feed
- Text/HTML
- Page

The visible card audience options were:

- Member
- Guest
- Both

The right-side phone preview is rendered directly inside the Builder using the
ChMeetings web app components; it is not an iframe containing a shareable
public URL. The Guest/Member selector changes the simulated login state. Use it
to compare layouts and audience visibility, but use the verified public route
or a real member account for end-to-end link testing.

The observed default-page preview/menu content included:

- All Schedules
- Sports Fest Handbook
- Sports Fest Facility and Safety Notice
- Home
- Groups

Important distinction: this Builder page is an admin/staff configuration
surface. It is not the same thing as the member-facing page that guests or
members see, but it controls at least some of that experience. For documentation
and testing, record both the Builder/admin URL and the final member-facing URL
or app screen separately.

### Badge display caution

Do not assume that a Member Portal Text/HTML Card can automatically show a
different badge image for each logged-in athlete.

A static HTML card may be able to render an image, but a personalized per-member
badge requires one of the following:

- ChMeetings-supported merge fields or dynamic member variables in portal HTML.
- A member-specific deep link or portal page feature.
- A supported ChMeetings badge/ticket/QR feature.
- A custom browser helper or external web app that can identify the member and
  render the correct image.

This needs a direct test in the Member Portal Builder before any public rollout.

## Integration guidance

When building web integrations around ChMeetings links:

1. Separate general entry links from specific workflow links.
   - General entry: `https://onelink.to/_vay`
   - Web tenant root: `https://vay.chmeetings.com/`
   - VAY SM public Guest portal: `https://vay.chmeetings.com/2E3F3637741B61D9/guest`
   - Specific portal/form/event links: verify and document separately.

2. Test each link in at least three contexts.
   - Fresh desktop browser with no ChMeetings cookies.
   - Logged-in member account.
   - Mobile device or mobile user agent.
   - Logged-in admin/staff account when staff behavior matters.

3. Be explicit about the expected audience.
   - Public visitor.
   - Existing member.
   - Sports Fest athlete/parent.
   - Staff/admin.

4. Avoid hard-coding assumptions from staff/admin sessions.
   - Admin sessions often redirect into `/Core/...`.
   - Member sessions may redirect to member-facing routes.
   - Anonymous root visitors usually see login/create-account flows.
   - Anonymous visitors can use a verified tenant-scoped `/guest` route.

5. Use direct URLs only after verifying they survive login redirects.
   A link that works while logged in may not work for a fresh visitor. The best
   public link is the one that still lands correctly after the user signs in or
   creates an account.

## Recommended next tests

Before publishing Sports Fest instructions around the Member Portal:

- Treat the anonymous VAY SM Guest route as verified as of 2026-07-15.
- Test the same home page with an ordinary member login and record the actual
  URL, greeting, navigation, and card visibility.
- Create a temporary members-only Member Portal test page.
- Add a Text/HTML Card with a simple externally hosted image.
- Test whether the image renders in the member web portal.
- Test the same page in the mobile app.
- Test whether a direct page URL survives anonymous login and account creation.
- Look for any supported merge fields or dynamic placeholders in Text/HTML Card
  content.
- Record the exact final URL, page title, and visible buttons for:
  - logged-in member,
  - logged-in admin,
  - Android app,
  - iPhone app.

## Operational wording

Safer wording for public instructions:

```text
Go to https://onelink.to/_vay to open VAY Connect. On a phone, it may ask you to
download or open the app. On a computer, it will take you to the VAY ChMeetings
login page.
```

Avoid wording like:

```text
This link takes you directly to your Sports Fest badge.
```

unless a specific Member Portal or app deep link has been tested for fresh users,
logged-in members, and mobile app users.
