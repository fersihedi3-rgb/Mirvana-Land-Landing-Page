# Mirvana Land — landing page

Static landing page for Mirvana Land: 62 single-storey villas near
Marrakech. French, conversion-oriented, with a scroll-scrubbed aerial hero
and a qualifying lead form that hands off to WhatsApp.

Everything that ships lives in [`site/`](site/). Start there, and read
[`site/README.md`](site/README.md) — it documents the hero encode, the
chapter timings, the motion policy and the deployment requirements.

## Run it locally

```bash
cd site
node serve.js . 8099
# http://localhost:8099/
```

`serve.js` implements HTTP byte ranges deliberately. **Any host you deploy
to must answer `Range:` requests with `206`**, or the browser marks the hero
video non-seekable and the scroll scrub silently does nothing. Verify with:

```bash
curl -sI -H "Range: bytes=0-99" https://your-host/assets/hero/hero-scroll.mp4
```

## Source media

`input Assets/` is **not** in this repo: it is roughly 384 MB of raw frame
sequences, render exports and show-villa originals. `site/build-assets.sh`
regenerates everything under `site/assets/` from it, so keep a local copy.

## Before going live

`ENDPOINT` in [`site/js/mirvana.js`](site/js/mirvana.js) is still empty. The
form works without it (WhatsApp hand-off plus a localStorage backup), but
nothing is recorded server-side until a Formspree / Sheets / webhook URL is
set there.
