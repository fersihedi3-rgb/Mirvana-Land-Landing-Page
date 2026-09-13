# Mirvana Land — landing page

Static site. No build step, no dependencies to install. Open `index.html`
through any web server (not `file://`, the video scrub needs HTTP range
requests).

Local preview:

    node serve.js .          # or any static server
    # then http://127.0.0.1:8099/

## The one thing still to decide

`js/mirvana.js`, top of the file:

```js
var WHATSAPP = "212612009489";
var ENDPOINT = "";
```

`ENDPOINT` is where the lead record is saved. It is empty right now, so on
submit the form:

1. opens WhatsApp with every answer pre-written, and
2. keeps a copy in the browser's `localStorage` as a backstop.

Nothing reaches your systems until you set `ENDPOINT` to a URL that accepts a
JSON POST. Any of these work without changing the code:

- **Formspree / Basin / Formcarry** — paste the form URL, done.
- **Google Sheets** — an Apps Script web app deployed with "Anyone" access.
- **Your CRM** — any endpoint accepting `POST` with a JSON body.

The JSON posted is:

```json
{
  "nom": "...", "tel": "...", "email": "...",
  "budget": "...", "projet": "...", "delai": "...",
  "financement": "...", "mot": "...",
  "recu_le": "ISO timestamp", "source": "page URL"
}
```

## Assets

Everything is generated from `../input Assets` with ffmpeg. Regenerate with
`build-assets.sh` if the source footage changes.

| File | Source | Used by |
|---|---|---|
| `assets/hero/hero-scroll.mp4` | Very first video part scroll.mp4 | the scrubbed hero |
| `assets/hero/hero-poster.jpg` | frame 0 of the above | hero poster, OG image |
| `assets/video/rows-loop.mp4` | magnific_crane-up | sans vis-à-vis |
| `assets/img/plainpied.jpg` | villa tour @0.35s | le plain-pied |
| `assets/img/firepit.jpg` | Family_relaxing_by_nighttime_fire | la villa |
| `assets/img/gym / garden / retail` | the three hf_*.png | le village |
| `assets/img/gate.jpg` | dolly-in-and-orbit @4.2s | le village |
| `assets/img/site-wide.jpg` | part 1 @9s | preuve |
| `assets/img/logo-mono / logo-lock` | 470920103_*.jpg | nav, footer |

The hero is encoded all-keyframe (`-g 1`). This is the setting that decides
how smooth the scrub feels, and it is not obvious: browsers snap a seek to
the nearest keyframe, so the earlier 8-frame GOP made only 41 of the clip's
332 frames reachable and the hero advanced in visible jumps. All-intra makes
every frame reachable, and measured seek latency is about 3 ms. Re-encoding
with default GOP settings will bring the stutter straight back.

### The host must support HTTP byte ranges

This is not optional. If the server answers a `Range:` request with `200`
instead of `206 Partial Content`, the browser reports
`video.seekable.end(0) === 0`, every `currentTime` assignment is silently
ignored, and the hero shows a frozen first frame while the page scrolls.
Nothing in the console warns you.

Check a deploy with:

    curl -sI -H "Range: bytes=0-99" https://your-host/assets/hero/hero-scroll.mp4

Expect `HTTP/… 206` and `Accept-Ranges: bytes`. Netlify, Vercel, Cloudflare
Pages, nginx and Apache all do this by default. The bundled `serve.js`
implements it too.

## Design system

Built with the `ui-ux-pro-max` skill. Direction: **Exaggerated Minimalism**
(oversized type, extreme whitespace, a single accent), paired with the
**Scroll-Triggered Storytelling** and **Video-First Hero** landing patterns.

- **Typeface:** Host Grotesk, one family only. Hierarchy comes from weight
  (400 body / 600 labels / 700 section heads / 800 display) and scale, not
  from a second font.
- **Accent:** terracotta `#B34E27`, used for the nav CTA, the submit button,
  the `62` numeral and the price. Nothing else on the page is a colour.
- **Ground:** ivory `#F4F1EA` throughout, with one deliberate switch to
  `#121009` for the closing section and footer.
- **Radius:** 0 everywhere. **Z-index scale:** 10 / 20 / 30 / 50.

Audited at 1440px: 0 contrast failures, 0 touch targets under 44px, every
image has alt text, every input has a label, no horizontal scroll. Checked
at 375 / 768 / 1024 / 1440.


## Hero footage and chapters

The hero is built from the 514-frame sequence in `input Assets/New Video`
(720x1280, the native resolution, so it is never upscaled). It is a single
flight: Marrakech and the drawn route down the Route d'Amizmiz, a whip into
the village, then a whip into the villas.

| Chapter | Progress | Source frames | Line |
|---|---|---|---|
| 01 L'emplacement | 0.000 - 0.575 | 2 - 295 | Le dernier calme avant l'Atlas. |
| 02 Le village | 0.575 - 0.807 | 295 - 414 | Un village. Pas une résidence. |
| 03 Les villas | 0.807 - 1.000 | 414 - 515 | Face à l'Atlas. Jamais face à un voisin. |

Both chapter splits sit on a whip transition in the footage, so the motion
blur covers the change of line. The windows are in `WINDOWS` and `CHAPTERS`
in `js/mirvana.js`; they are fractions of scroll progress, so they survive a
change of scroll length but not a re-cut of the footage.


## Mobile hero build

Phones load `hero-scroll-m.mp4` instead of the desktop file. It is the
**same 720p at the same CRF 29** so nothing is softer; it simply carries
every second frame (257 instead of 514, 8.4 MB instead of 12.9 MB). The
choice is made in JS before the element has a `src`, so a phone never
fetches the desktop file. `SRC_FPS` is read from the matching data
attribute (25 desktop, 12.5 mobile) and the scroll windows are fractions of
progress, so nothing else changes.

## Overlay cloak

From the halfway point of chapter 01 until it ends (progress 0.255 to
0.600) the headline, the sub, the chapter markers and the nav all clear,
because that is the stretch where the footage shows its own burnt-in
labels: Marrakech, the Ménara airport, Route d'Amizmiz and Mirvana Land.
Everything returns before chapter 02's line arrives. See `paintOverlays`
in `js/mirvana.js`.


## Self-playing hero

The hero plays on its own as soon as the page opens and loops, so a reader
who has not scrolled still sees the flight. While it plays, the beats,
chapters and overlay cloak are driven by the **video clock**, not by scroll
(`autoPaint`); `ScrollTrigger.onUpdate` returns early so the two cannot
fight. The first wheel, touch, key or scroll ends the intro: the video
pauses, looping is cleared, and a 0.75 s blend eases the picture from where
the intro left it to the scroll position instead of snapping backwards.
If autoplay is refused by the browser, the intro is abandoned and the
normal scroll scrub takes over.

## WhatsApp calls to action

Six section buttons, each with its own prefilled message so the team knows
which part of the page the lead came from:

| Section | Label |
|---|---|
| Plain-pied | Recevoir les plans |
| Sans vis-à-vis | Voir les villas disponibles |
| La villa | Réserver une visite |
| Villa témoin | Visiter la villa témoin |
| Le village | Demander la brochure |
| Prix | Parler à un conseiller |

Plus a fixed button bottom-right. The section buttons use the brand
terracotta; the floating one is WhatsApp green, the single deliberate
exception to the one-accent rule, because readers scan for that exact
green. Both are square, holding the page's radius lock.

## Villa témoin

`assets/img/temoin/` holds eight photographs of the completed show villa
(from `input Assets/Villa Temoin`). These are real photographs rather than
renders, which is why the section says so plainly. The gallery is a native
horizontal scroll-snap strip: it swipes on touch, drags on trackpad, and
needs no pinning, so it cannot conflict with the pinned hero.

## Motion

Smooth scrolling is Lenis, driven off the GSAP ticker so ScrollTrigger and
the scrub stay in step. On top of that: word-mask reveals on every headline,
parallax and push-in on the media (one tween writes both, so they cannot
fight over the transform), a count-up on the 62, staggered lift on the
village grid, and a nav that retracts downward and returns on the way up.

The price is a reveal and deliberately **not** a count-up: a counting price
renders wrong figures on the way to the target, and a wrong price should not
be on screen even for a second.

#
## Mobile hero build

Phones load `hero-scroll-m.mp4` instead of the desktop file. It is the
**same 720p at the same CRF 29** so nothing is softer; it simply carries
every second frame (257 instead of 514, 8.4 MB instead of 12.9 MB). The
choice is made in JS before the element has a `src`, so a phone never
fetches the desktop file. `SRC_FPS` is read from the matching data
attribute (25 desktop, 12.5 mobile) and the scroll windows are fractions of
progress, so nothing else changes.

## Overlay cloak

From the halfway point of chapter 01 until it ends (progress 0.255 to
0.600) the headline, the sub, the chapter markers and the nav all clear,
because that is the stretch where the footage shows its own burnt-in
labels: Marrakech, the Ménara airport, Route d'Amizmiz and Mirvana Land.
Everything returns before chapter 02's line arrives. See `paintOverlays`
in `js/mirvana.js`.


## Self-playing hero

The hero plays on its own as soon as the page opens and loops, so a reader
who has not scrolled still sees the flight. While it plays, the beats,
chapters and overlay cloak are driven by the **video clock**, not by scroll
(`autoPaint`); `ScrollTrigger.onUpdate` returns early so the two cannot
fight. The first wheel, touch, key or scroll ends the intro: the video
pauses, looping is cleared, and a 0.75 s blend eases the picture from where
the intro left it to the scroll position instead of snapping backwards.
If autoplay is refused by the browser, the intro is abandoned and the
normal scroll scrub takes over.

## WhatsApp calls to action

Six section buttons, each with its own prefilled message so the team knows
which part of the page the lead came from:

| Section | Label |
|---|---|
| Plain-pied | Recevoir les plans |
| Sans vis-à-vis | Voir les villas disponibles |
| La villa | Réserver une visite |
| Villa témoin | Visiter la villa témoin |
| Le village | Demander la brochure |
| Prix | Parler à un conseiller |

Plus a fixed button bottom-right. The section buttons use the brand
terracotta; the floating one is WhatsApp green, the single deliberate
exception to the one-accent rule, because readers scan for that exact
green. Both are square, holding the page's radius lock.

## Villa témoin

`assets/img/temoin/` holds eight photographs of the completed show villa
(from `input Assets/Villa Temoin`). These are real photographs rather than
renders, which is why the section says so plainly. The gallery is a native
horizontal scroll-snap strip: it swipes on touch, drags on trackpad, and
needs no pinning, so it cannot conflict with the pinned hero.

## Motion policy

The site ships **full motion to every visitor**, by decision of the owner.
`prefers-reduced-motion` does not gate the decorative layer: the animation is
the pitch here, and honouring the OS setting was suppressing it for a large
share of the audience (any Windows machine with animation effects switched
off reports it, whether or not the person chose that for motion sensitivity).

The trade-off is explicit: visitors who set reduced motion for vestibular
reasons will still get parallax, scroll smoothing and the scrubbed hero.

`<html>` carries `.motion-full` unless the opt-out is used:

    http://localhost:8099/?motion=reduced

That drops to the hero scrub only (1 ScrollTrigger instead of 37, no word
reveals, no parallax). To put the decision back in the visitor's hands,
change one line in `js/mirvana.js`:

    var MOTION = forced !== "reduced";                    // current: always on
    var MOTION = forced === "full" ? true : !reduce;      // follow the OS

## Notes

- Total page weight is about 17 MB, dominated by the 13 MB hero video: 514
  all-keyframe frames at 25 KB each, the same per-frame quality as before.
  The all-keyframe encode is what buys the smooth scrub; an inter-coded one
  would be far smaller but only one frame in eight would be reachable.
- Scrub tuning lives in `js/mirvana.js`: the pinned run is 5.2 viewport
  heights (raise it to slow the hero further), and `scrub:` is the smoothing
  lag in seconds.
- `prefers-reduced-motion` disables the decorative motion: the push-in on
  images, the reveal transforms, the scrub smoothing and the intro fade.
  The hero scrub itself keeps running, because it is scroll-linked (it only
  moves when the reader moves) and the footage is the content rather than
  decoration. The stacked-still hero is now only the no-JS fallback, which
  JS opts out of by stamping `.js-scrub` on the root element.
- Note for reviewing on Windows: with Settings > Accessibility > Visual
  effects > Animation effects turned off, every browser reports
  `prefers-reduced-motion: reduce`.
- The page is one light theme throughout, with a single deliberate switch to
  the dark ground for the closing section and footer.
- The hero's three chapter markers are keyed to the three shots in the
  footage; the splits sit on the two whip transitions at 24% and 58%.
