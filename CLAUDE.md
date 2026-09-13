# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page French landing site for Mirvana Land, a development of 62
single-storey villas near Marrakech. Static: no build step, no framework, no
package.json. Three source files do everything — `site/index.html`,
`site/css/mirvana.css`, `site/js/mirvana.js` — plus `serve.js` for local
preview and `build-assets.sh` for regenerating media.

Its job is lead *quality*, not traffic: the price is visible early to
pre-filter budget, and the form qualifies hard before handing off to WhatsApp.

## Commands

```bash
cd site
node serve.js . 8099          # http://localhost:8099/
node --check js/mirvana.js    # only syntax check available
bash build-assets.sh          # regenerate site/assets from "input Assets/"
```

There are no tests, no linter and no bundler. `node --check` is the only
automated verification in the repo.

`?motion=reduced` on any URL drops to the hero scrub with all decorative
motion off — the fastest way to isolate whether a bug is motion-related.

## Two constraints that silently break the hero

These are the failure modes that cost the most time. Both are invisible:
no console error, the page just looks static.

**1. The host must answer HTTP `Range:` requests with `206`.** Without byte
ranges the browser reports `video.seekable.end(0) === 0`, every
`currentTime` assignment is ignored, and the scroll scrub does nothing while
the page scrolls normally. This is why `serve.js` implements ranges by hand
— do not replace it with a trivial static server. Verify any deploy with:

```bash
curl -sI -H "Range: bytes=0-99" https://host/assets/hero/hero-scroll.mp4
```

**2. The hero video must be encoded all-keyframe (`-g 1`).** Browsers snap a
seek to the nearest keyframe, so a normal GOP makes only one frame in N
reachable and the hero advances in visible jumps. `build-assets.sh` sets
`-g 1 -keyint_min 1 -sc_threshold 0`; re-encoding with defaults brings the
stutter straight back. Measured seek latency all-intra is about 3 ms.

## Hero architecture

`site/js/mirvana.js` is one IIFE containing ten smaller ones. `hero()` is by
far the most intricate; the rest are independent and safe to read alone.

The hero has **two drive modes** that must never run at once:

- **Self-play** (page load): the video autoplays and loops, and the beats,
  chapter bars and overlay cloak are painted from `video.currentTime`
  (`autoPaint`). `ScrollTrigger.onUpdate` returns early while `autoMode` is
  true so the two cannot fight over the same state.
- **Scroll-scrubbed** (after first wheel/touch/key): `endAuto()` pauses the
  video, clears looping, and a 0.75 s `handoff` blend eases the picture from
  where the intro left it to the scroll position rather than snapping back.

Timings live in two arrays near the top of `hero()`, both expressed as
**fractions of scroll progress**, not seconds — so they survive a change of
scroll length but *not* a re-cut of the footage:

- `CHAPTERS` — the three chapter bars. Splits sit on the footage's two whip
  transitions so motion blur covers each change of line.
- `WINDOWS` — per-beat fade in/out. Beat 1 clears at 0.255 because the
  footage carries its own burnt-in labels (Marrakech, Route d'Amizmiz,
  Mirvana Land) that our type would otherwise compete with.
- `paintOverlays` cloaks the nav, beats and chapter bars over that same
  stretch, restoring them by 0.600.

Seeks are quantised to the source frame grid (`SRC_FPS`) so there is one
seek per frame that actually changes, not two or three.

**Desktop and mobile load different encodes.** The `<video>` ships with no
`src`; `hero()` picks `data-src-desktop` / `data-src-mobile` (and the
matching `data-fps-*`) from a `max-width: 820px` media query before anything
reads the element, so a phone never fetches the 12.9 MB desktop file. Both
are 720p at CRF 29 — the mobile build differs only in frame count.

## Motion policy

`MOTION` defaults to **on for every visitor**, deliberately ignoring
`prefers-reduced-motion`; `?motion=reduced` is the opt-out. This was the
owner's explicit decision, documented in `site/README.md` along with the
trade-off. Consequences to respect when editing CSS:

- `<html>` carries `.motion-full` in the default case, so every
  `@media (prefers-reduced-motion: reduce)` block is scoped to
  `html:not(.motion-full)`. Unscoped `!important` rules in those blocks will
  override GSAP's inline styles and silently kill the animation.
- `.js-scrub` is stamped on `<html>` when the pinned hero engages; the
  stacked-still hero in CSS is the no-JS fallback only.

## Design system

Set in `:root`. Worth knowing before adding anything visual:

- **One typeface**, Host Grotesk. Hierarchy comes from weight (400 body →
  800 display) and scale, never a second family.
- **One accent**, terracotta `#B34E27`. The single exception is the floating
  WhatsApp button in green, because readers scan for that exact green.
- **Radius lock: 0** everywhere, including the floating button.
- **Z-index scale**: 10 / 20 / 30 / 50, via `--z-base` … `--z-top`.
- Ground is ivory throughout with one deliberate switch to `--night` for the
  closing form and footer.

Two traps that have already bitten this codebase: `ch` units on a wrapper
resolve against the wrapper's *sans* font rather than the display face
inside it (use `rem`), and the copy is informative rather than sloganeering,
so display sizes are deliberately smaller than they look like they should be.

## Copy

French, direct and factual — concrete numbers over evocation. No em-dashes
or en-dashes anywhere in user-visible text; use a hyphen or restructure.

The price is a word-mask reveal and deliberately **not** a count-up: a
counting price renders wrong figures on the way to the target, and a wrong
price should not be on screen even for a second.

## Media pipeline

`build-assets.sh` regenerates everything in `site/assets/` from
`input Assets/`, which is **gitignored** (~384 MB of frame sequences, render
exports and show-villa originals) and therefore not recoverable from this
repo. Keep a local copy.

The hero source is a 514-frame JPEG sequence at 720×1280 — that is the
native resolution, so never scale above it. Show-villa photographs in
`assets/img/temoin/` are real photographs rather than renders, which is why
that section's copy says so explicitly.

## Before going live

`ENDPOINT` in `site/js/mirvana.js` is still `""`. The form works without it
(WhatsApp hand-off plus a `localStorage` backup) but nothing is recorded
server-side until a Formspree / Sheets / webhook URL is set.
