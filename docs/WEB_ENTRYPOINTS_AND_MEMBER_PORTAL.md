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
   - Specific portal/form/event links: verify and document separately.

2. Test each link in at least three contexts.
   - Fresh desktop browser with no ChMeetings cookies.
   - Logged-in member account.
   - Mobile device or mobile user agent.

3. Be explicit about the expected audience.
   - Public visitor.
   - Existing member.
   - Sports Fest athlete/parent.
   - Staff/admin.

4. Avoid hard-coding assumptions from staff/admin sessions.
   - Admin sessions often redirect into `/Core/...`.
   - Member sessions may redirect to member-facing routes.
   - Anonymous users usually see login/create-account flows.

5. Use direct URLs only after verifying they survive login redirects.
   A link that works while logged in may not work for a fresh visitor. The best
   public link is the one that still lands correctly after the user signs in or
   creates an account.

## Recommended next tests

Before publishing Sports Fest instructions around the Member Portal:

- Create a temporary members-only Member Portal test page.
- Add a Text/HTML Card with a simple externally hosted image.
- Test whether the image renders in the member web portal.
- Test the same page in the mobile app.
- Test whether a direct page URL survives anonymous login and account creation.
- Look for any supported merge fields or dynamic placeholders in Text/HTML Card
  content.
- Record the exact final URL, page title, and visible buttons for:
  - anonymous desktop visitor,
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
