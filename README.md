# Mirvana Land - landing page

Static French landing page for 62 single-storey villas near Marrakech.
The layout follows the supplied Luxavia reference, refined with an Apple-inspired
visual style: Host Grotesk throughout, cool white surfaces, warm orange and white actions,
rounded media, translucent navigation, an automatic image hero and cinematic
text/parallax motion, with a direct visit inquiry flow.

Everything that ships lives in `site/`. See `site/README.md` for implementation
and deployment details.

## Local preview

```bash
cd site
node serve.js . 8099
# http://localhost:8099/
node --check js/mirvana.js
```

No framework, package installation or build step is needed.
The existing preview server supports HTTP byte ranges for video playback and seeking.

## Source media

`input Assets/` is not in this repo. Keep a local copy of the original frame
sequences, renders and show-villa photographs before regenerating media with
`site/build-assets.sh`. Self-hosted fonts live separately in `site/assets/fonts/`.

## Lead delivery

The qualifying form opens WhatsApp with the answers and retains its existing
localStorage backup. `ENDPOINT` in `site/js/mirvana.js` is empty; server-side
lead recording requires a configured JSON POST endpoint.
