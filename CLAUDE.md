# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A French landing site for Mirvana Land, 62 single-storey villas near
Marrakech: one page that sells, plus two legal pages. Static: no build step,
no framework, no package.json, no runtime CDN. Everything that ships is in
`site/`: `index.html`, `confidentialite.html`, `conditions.html`,
`css/mirvana.css`, `css/fonts.css`, `js/mirvana.js`, and locally hosted
vendor files (GSAP 3.12.5 + ScrollTrigger in `assets/vendor/`, Host Grotesk in
`assets/fonts/`, a Tabler outline icon sprite in `assets/icons/features.svg`).

The page exists to produce qualified leads, not traffic: the starting price is
in the hero to pre-filter budget, and the form qualifies before handing off to
WhatsApp. `site/README.md` is the detailed record of the current design and is
kept up to date; read it before large changes.

## Commands

```bash
cd site
node serve.js . 8099          # http://localhost:8099/
node --check js/mirvana.js    # the only automated check in the repo
bash build-assets.sh          # regenerate site/assets from ../input Assets/
```

No tests, linter or bundler exist. `?motion=reduced` on any URL turns off all
GSAP motion, the slideshow timer and video autoplay — use it to separate
motion bugs from layout bugs.

## Deployment constraint

Serve with **HTTP byte-range support** (`206 Partial Content`). Safari will not
play MP4 at all without it, and other browsers cannot seek. `serve.js`
implements ranges by hand for this reason; do not swap it for a trivial static
server. Check a deploy with:

```bash
curl -sI -H "Range: bytes=0-99" https://host/assets/hero/hero-scroll.mp4
```

## Page structure

Section order and anchors (the nav, mobile menu and `aria-current` tracking
all depend on these ids): `#hero` → `#plainpied` → `#temoin` → `#film` →
`#visavis` → `#fondateur` → `#preuve` → `#village` → `#contact`.

`#fondateur` presents Zied Barouni, the owner's CEO, with owner-supplied copy;
keep his wording intact. His portrait is cropped high (`object-position` ~16%)
so the head survives the parallax push-in; don't reuse the generic media crop.

`#visavis` ends with the floor plans block (Types A–D, from
`assets/img/plans/`). On phones it becomes a horizontal swipe row, since two
columns shrink a plan below legibility.

Headings follow one pattern that the motion code relies on:
`<h2>First line.<br><span class="heading-secondary">Second line.</span></h2>`.

Icons are referenced from the sprite, never inlined:
`<svg class="feature-icon"><use href="assets/icons/features.svg#pool"></use></svg>`.

## Legal pages

`site/confidentialite.html` and `site/conditions.html` are the only pages
besides `index.html`. They share `css/mirvana.css` (a `Legal pages` block at
the end of it) but **must not load `js/mirvana.js`**: `navigation()` and
`heroSlideshow()` are not null-guarded and throw without `#menuToggle` /
`#hero`. Their nav is therefore static, carries `.is-solid` in the markup
(its translucent state sits near 4:1 over white instead of over the dark
hero), and links to `index.html#…`, never to a bare fragment. The only
script on them is the one line that fills `#year`.

The pages describe the form's real behaviour — WhatsApp handoff, the
`mirvana_leads` localStorage copy, no cookies and no third-party requests.
**If `ENDPOINT` is ever set, section 4 of the privacy policy and its
"En bref" box stop being true** and must be updated in the same change.

Company registration facts nobody in the repo knows (raison sociale, RC/ICE/IF,
siège social, capital, directeur de la publication, contact e-mail, hébergeur)
are marked `<span class="todo">À compléter</span>`. The `.todo` pill is styled
to look unfinished on purpose so an incomplete page can't ship unnoticed; don't
invent values to clear them.

## JavaScript architecture

`js/mirvana.js` is one IIFE of independent sub-modules. Non-obvious behaviour:

- **Motion is on for every visitor, regardless of `prefers-reduced-motion`.**
  This is an explicit owner decision. `?motion=reduced` is the only opt-out,
  and `<html>` gets `.motion-full` otherwise. Any CSS under
  `@media (prefers-reduced-motion: reduce)` must be scoped to
  `html:not(.motion-full)`, or its `!important` rules will override GSAP's
  inline styles and silently kill animations.
- **`cinematicMotion` rewrites every `h1`/`h2`** into `.word-mask > .word-inner`
  spans for the word reveal. It copies the text into `aria-label` first and
  marks the spans `aria-hidden`, so editing heading markup at runtime (or
  querying heading text in JS) sees the split DOM. `.media` wrappers get
  scroll parallax; `data-parallax="gentle"` reduces it.
- **`heroSlideshow`** keeps later slides in `data-src` and only shows a slide
  after it has loaded. It shuffles through a bag so no slide repeats until all
  have shown, and stops when the hero is offscreen or the tab is hidden.
  Slides and dots are matched **by DOM order**, so reorder them together.
  The 8 slides (`assets/img/hero/slide-N.jpg`) are portrait 1080×1920 in a
  landscape desktop hero, so each has its own `.hero__slide--sN`
  `object-position` crop. Slide 1 has text baked into the image that no crop
  can move off the headline on phones, which is why the page opens on slide 3.
  On screens ≤540px the dots are hidden (8 × 44px won't fit) and only the
  pause control remains.
- **`videos`** sets the `#projectVideo` source from a `max-width: 820px` query
  (phones get `hero-scroll-m.mp4`), and plays each video only while visible.
- **`floatingWhatsApp`** hides the fixed WhatsApp button while `#contact` is in
  view, because the form carries its own WhatsApp action.
- **The lightbox (inside `gallery`) serves two groups**: the villa témoin
  photographs and the floor plans (`[data-plan]` buttons in `#visavis`).
  Whichever opener is used sets the group the arrows step through, so the
  groups never bleed into each other. Plan thumbnails carry `data-full`
  (1440px) and `data-caption`; the lightbox always loads the full file,
  because a thumbnail-sized plan is not legible.
- **`leadForm`** validates seven required fields, opens WhatsApp synchronously
  inside the submit handler (so pop-up blockers allow it), and stores a copy in
  `localStorage` under `mirvana_leads`. Field names and record keys
  (`nom tel email budget projet delai financement mot recu_le source`) are a
  contract; keep them stable.

`ENDPOINT` is still `""`, so nothing is recorded server-side until a
Formspree / Sheets / webhook URL is set there. Setting it also makes the
privacy policy inaccurate — see **Legal pages** above.

## Design system

Defined at the top of `css/mirvana.css`:

- One typeface, Host Grotesk, for everything.
- **Every section carries exactly one tone class, and neighbours never share
  one**: `tone-white` `#fff`, `tone-mist` `#eeeef2`, `tone-sand` `#f4ebdf`,
  `tone-night` `#17181c` (the footer too). Tone classes win on specificity
  over the older section classes. `.section--dark` on its own still renders
  light grey — the name predates the tones, so use `tone-night` for dark.
- `tone-night` redefines `--ink`, `--muted`, `--line` and `--accent-ink` for
  its subtree, so components that read those variables adapt without
  per-component overrides; hard-coded colours inside a night section will not.
  On `tone-sand`, section CTAs switch to graphite because the tan pill barely
  separates from the ground (the form submit, on its white card, stays tan).
- `--accent` `#cda16c` is the tan fill for pill buttons, with dark `#261c12`
  text. Icons, text links and focus rings use `--accent-ink` `#81542f`, because
  the tan fails contrast as text on white.
- Radius scale: 12px fields, 24px media and panels (20px on phones), pills for
  every control.
- The floating WhatsApp button is fixed bottom-right, so in-media controls
  (video pause pills) sit bottom-left.
- Touch targets are held at 44px minimum; nav CTA, hero dots, footer links and
  the contact phone link were all raised to meet it.

## Copy

French, direct and factual: concrete numbers over evocation. The starting price
(405 000 €) appears in the hero, the project section and the form hint.

## Testing notes for this machine

- Headless Chrome reports `prefers-reduced-motion: reduce` by default, and this
  Windows machine does too (animation effects are off). Emulate
  `no-preference` via CDP `Emulation.setEmulatedMedia` when checking motion.
- Scripted `window.scrollTo` does not reliably fire ScrollTrigger in an
  occluded window, where rAF can drop to ~0.1 Hz. Use CDP
  `Input.dispatchMouseEvent` wheel events.
- Screenshots taken shortly after scrolling catch entrance animations
  mid-flight (items offset by up to 75px). Measure spacing with
  `getBoundingClientRect` under `?motion=reduced` before calling something a
  layout bug.
- Launch test browsers with their own `--user-data-dir` and close them via CDP
  `Browser.close`. **Never kill Chrome by image name** — the owner uses Chrome
  on this machine.

## Media

`../input Assets/` (~384 MB of frame sequences, renders and show-villa
originals) is gitignored and not recoverable from the repo. Keep a local copy.
Photographs in `assets/img/temoin/` are real photographs of the built show
villa, not renders.

The hero MP4s were encoded all-keyframe (`-g 1`) for a scroll-scrubbed hero
that has since been retired. The film section now only autoplays and loops, so
that encode is no longer required, and a normal GOP would be much smaller.
