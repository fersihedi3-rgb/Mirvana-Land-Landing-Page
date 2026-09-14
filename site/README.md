# Mirvana Land - implementation

A static page with native HTML, CSS and JavaScript. No bundler, framework,
package.json or runtime CDN dependencies.

## Preview and verification

```bash
node serve.js . 8099
node --check js/mirvana.js
```

Serve over HTTP. The supplied server supports byte ranges; keep that support
when deploying so native video seeking works:

```bash
curl -sI -H "Range: bytes=0-99" https://your-host/assets/hero/hero-scroll.mp4
```

Expect `206 Partial Content`.

## Current design

The owner requested a complete UI/UX redesign based on
https://luxavia.ma/landing-page/, then a restrained SaaS/Apple-inspired refinement.
The page uses an automatically shuffled architectural image hero, Host Grotesk
for all interface text, cool white and gray surfaces, warm orange/white actions
matching the logo, and a floating translucent navigation
bar. The radius scale is 12px for fields, 24px for media and rounded panels,
and pill-shaped controls. These changes follow the owner's latest direction.
The seven required form fields, original field order, section anchors, phone
number, project facts and early starting price are preserved.

The former scroll-scrubbed hero and its chapter/handoff code are retired.
Its original desktop/mobile video encodes are retained in the separate
presentation player. This supersedes the historical hero and design descriptions
in `CLAUDE.md`; the original media and range requirements remain relevant.

## Interactions

- Native anchor scrolling and a mobile menu with Escape and outside-click closing.
- Eight-image gallery with swipe, arrows, keyboard navigation and an enlarged
  native dialog. Escape closes the dialog and returns focus to the thumbnail.
- Aerial presentation in a tall right-hand column, with copy on the left. The
  native video fills the column without letterboxing or browser player chrome.
  It autoplays muted and loops while visible, with a compact pause/play button.
  Screens up to 820px receive the existing mobile encode.
- The residence loop plays only while visible, with a persistent pause control.
- Service choices swap the image, accessible description and caption. Failed
  image requests preserve the prior image and offer a retry message.
- Eight hero images (`assets/img/hero/`, from `input Assets/Shuffle images`)
  shuffle every 5.6 seconds, using crossfades and slow zooms. The page opens on
  the villa (image 3); image 1 carries baked-in text that would sit on the
  headline on phones. Controls allow manual selection and pausing; on screens
  up to 540px only the pause control is shown. Timers stop offscreen or when
  the tab is hidden; images are loaded before they are shown.
- Locally hosted GSAP 3.12.5 and ScrollTrigger provide staggered word reveals,
  list entrances, deep image parallax and video-column movement. Only transforms
  and opacity animate. Text and media remain visible if JavaScript is unavailable.
- Feature lists, detail headings, services and project facts use local Tabler
  outline icons, with the upstream license included in assets/icons/.

`?motion=reduced` disables entrance animation, parallax, smooth scrolling, automatic
slideshows and loop playback. The existing owner policy of full motion by default, regardless
of OS preference, remains. There is no scroll pinning or scroll hijacking.

## Qualified lead form

`WHATSAPP` is `212612009489`; `ENDPOINT` is empty.

Submission validates the seven required fields, opens WhatsApp with the answers,
and saves the existing `mirvana_leads` localStorage record when storage is
available. The fallback button works if the popup is blocked. A visitor can
return to edit their answers. The confirmation explicitly asks the visitor
to send the message in WhatsApp; it does not claim the lead was delivered.

The record keys remain:
`nom`, `tel`, `email`, `budget`, `projet`, `delai`, `financement`, `mot`,
`recu_le` and `source`.

To record leads server-side, configure `ENDPOINT` with a service accepting a
JSON POST. Until then, the team receives the inquiry when the visitor sends
the prepared WhatsApp message. Doing so also invalidates section 4 of the
privacy policy, which currently states that nothing is sent to a server.

The submit hint names the privacy policy and links to it, so the visitor is
informed where the data is actually collected. The seven required fields and
the record keys are unchanged by that addition.

## Legal pages

`confidentialite.html` (politique de confidentialité) and `conditions.html`
(conditions d'utilisation, including the mentions légales) sit beside
`index.html` and are linked from the footer of all three pages.

Both are plain documents: shared stylesheet, a sticky numbered table of
contents beside a 68ch prose column, an "En bref" summary panel first, then
twelve sections. They deliberately do not load `js/mirvana.js` — `navigation()`
and `heroSlideshow()` are not null-guarded and throw without `#menuToggle` and
`#hero` — so their header is static, carries `.is-solid` in the markup, and
points at `index.html#…`. The one inline line that fills `#year` is the only
script. Styles live in a `Legal pages` block at the end of `css/mirvana.css`.

The privacy policy describes what the site actually does rather than boilerplate:
the form opens WhatsApp and nothing reaches us until the visitor sends the
message; a copy stays in `mirvana_leads` on their own device; no cookie, no
analytics, no third-party request on load, since fonts, GSAP and media are all
self-hosted. It covers both the GDPR (visitors in France) and the Moroccan law
09-08, and states plainly that answering a request means transferring data to
Morocco, which has no EU adequacy decision.

The terms page carries the non-contractual wording a promoter needs: renders are
intentions and not the delivered state, the villa témoin photographs are real but
not the lot sold, plan dimensions are indicative, and "à partir de 405 000 €" is
a starting price rather than an offer.

Registration facts that are not knowable from the repo — raison sociale, forme
juridique, capital, siège social, RC/ICE/IF, directeur de la publication and
hébergeur — are not published. Both pages state that they are given on request,
and the phone number is the working contact channel for data requests. To
publish them later, extend the `.legal-facts` list in each page and drop that
sentence.

## SEO

Canonical host `https://mirvana-land.com`, hardcoded in `index.html`, both legal
pages, `sitemap.xml` and `robots.txt`. Changing domain is a find-and-replace
across those five files.

Every page carries a canonical link, Open Graph and Twitter card tags with an
**absolute** `og:image` (the previous relative path broke every link preview),
`theme-color`, the favicon set and `site.webmanifest`. `index.html` adds a
JSON-LD `@graph`: `Organization`, `WebSite` and a `Product` with an
`AggregateOffer` at `lowPrice` 405 000 EUR. Deliberately absent: rating,
`offerCount` and geo coordinates, none of which are known.

`assets/img/og-image.jpg` (1200×630), `icon-512.png`, `icon-192.png`,
`favicon-32.png` and `apple-touch-icon.png` are generated with ffmpeg from
`firepit.jpg` and `logo-lock.png`. The icons come from the monogram inside
`logo-lock.png`, not from `logo-mono.png`, whose glyph is cropped off its own
canvas.

## Measurement

`js/consent.js` holds `GA_ID`, currently empty. Empty means no Google tag, no
cookie, no banner and no third-party request on any page — the state the site
ships in. Setting it to a `G-XXXXXXXXXX` turns measurement on everywhere.

The consent gate follows the CNIL rules rather than approximating them. Consent
Mode v2 defaults are queued as denied before a tag can exist. "Refuser" and
"Accepter" are the same size and weight; Escape counts as a refusal; refusals
are kept 182 days then asked once more; acceptance holds until withdrawn from
"Gérer mes cookies" in the footer or inside section 10 of the privacy policy.
Advertising features and Google signals are switched off even after acceptance.
The `generate_lead` event carries budget, projet, delai and financement only —
never name, phone, e-mail or the free-text message.

Elements marked `data-consent-scope` show only when `GA_ID` is set, and
`data-consent-scope="off"` only when it is empty. That is what lets section 8 of
the privacy policy state that measurement is currently inactive without anyone
remembering to edit it when the id is filled in.

The banner covers the hero slideshow's pause control, so the slideshow holds
still while the question is on screen instead of moving under a control the
visitor cannot reach.

## Verification

Checked in headless Chromium at 360, 768 and 1440 pixels across all three pages:
no horizontal overflow, no console error, exactly one `h1` per page, every
internal link and table-of-contents anchor resolving, zero third-party requests
and zero cookies in the shipped state, and byte ranges still answering `206`.

The consent gate has a 20-assertion behaviour test covering first visit,
refusal, persistence, reopening, acceptance loading `gtag.js`, Escape, and the
legal pages. The lead handoff is tested end to end with `window.open`
intercepted, asserting the pre-filled WhatsApp message carries all seven
answers and that the record keys are unchanged. No message reaches the sales
team during these tests.

## Assets

Project imagery and original video encodes remain in `assets/img/`,
`assets/video/` and `assets/hero/`. No source footage was re-encoded.
`build-assets.sh` regenerates media from the untracked `../input Assets/`.
Keep those originals locally.

`css/fonts.css` uses locally hosted Host Grotesk (about 20 KB), with weights
400-700. Its SIL Open Font License is included in `assets/fonts/`.

## Redesign validation

Checked in Chromium/Edge at widths 360, 390, 768, 1024 and 1440 pixels:
no horizontal page overflow; working mobile navigation, gallery wraparound,
lightbox keyboard controls, service selection, invalid-form focus, valid
WhatsApp URL construction, popup fallback, local backup and editing responses.
The handoff test intercepts `window.open`; no inquiry is sent to the sales team.

Latest motion checks explicitly emulate OS reduced motion and confirm that
word animations, automatic slides and parallax still run on the default URL.
Video autoplay, pause/resume, icon rendering and all five responsive widths pass.
