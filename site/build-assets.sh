#!/usr/bin/env bash
# Regenerates every web asset from the original footage.
# Run from the "site" directory. Needs ffmpeg on PATH.
set -euo pipefail

A="../input Assets"
I="assets/img"
mkdir -p assets/hero assets/video "$I"

# Every frame is a keyframe (-g 1). This is the single setting that
# decides how smooth the scroll scrub feels: browsers snap a seek to the
# nearest keyframe, so with -g 8 only one frame in eight was reachable
# and the hero advanced in visible jumps. CRF is raised to 29 to pay for
# it; all-intra means there is no inter-frame artifacting at that value.
echo "hero (all-keyframe, so every frame is seekable)"
ffmpeg -v error -y -i "$A/Very first video part scroll.mp4" -an \
  -vf "scale=720:-2" -c:v libx264 -crf 29 -g 1 -keyint_min 1 -sc_threshold 0 \
  -preset veryslow -profile:v high -level 4.0 -pix_fmt yuv420p -movflags +faststart \
  assets/hero/hero-scroll.mp4
ffmpeg -v error -y -i "$A/Very first video part scroll.mp4" \
  -frames:v 1 -vf "scale=1080:-2" -q:v 4 assets/hero/hero-poster.jpg

echo "looping clip"
ffmpeg -v error -y -i "$A/magnific_crane-up-camera-movement-_Sy271VKUb8.mp4" -an \
  -vf "scale=760:-2" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart \
  assets/video/rows-loop.mp4
ffmpeg -v error -y -ss 2 -i "$A/magnific_crane-up-camera-movement-_Sy271VKUb8.mp4" \
  -frames:v 1 -vf "scale=760:-2" -q:v 5 "$I/rows-poster.jpg"

echo "stills"
ffmpeg -v error -y -ss 0.35 -i "$A/villa tour.mp4" -frames:v 1 -vf "crop=1080:760:0:540"  -q:v 3 "$I/plainpied.jpg"
ffmpeg -v error -y -ss 7.3  -i "$A/villa tour.mp4" -frames:v 1 -vf "crop=1080:1350:0:300" -q:v 3 "$I/villa-pool.jpg"
ffmpeg -v error -y -ss 10.2 -i "$A/villa tour.mp4" -frames:v 1 -vf "crop=1080:810:0:480"  -q:v 3 "$I/plot-aerial.jpg"
ffmpeg -v error -y -ss 5.2  -i "$A/give-video-the-lighting-m_celebrittobrand1 (1).mp4" -frames:v 1 -vf "crop=1080:760:0:640" -q:v 4 "$I/villa-street.jpg"
ffmpeg -v error -y -ss 4.2  -i "$A/dolly-in-and-orbit-camera_celebrittobrand1.mp4" -frames:v 1 -vf "crop=1072:1340:0:340,scale=1000:1250" -q:v 4 "$I/gate.jpg"
ffmpeg -v error -y -ss 9    -i "$A/part 1.mp4" -frames:v 1 -vf "crop=1080:760:0:700" -q:v 4 "$I/site-wide.jpg"

ffmpeg -v error -y -i "$A/hf_20260819_231251_38cba6d3-f1ca-49d8-9f16-3c9a80d40402.png" -vf "crop=3072:3840:0:1100,scale=1200:1500" -q:v 4 "$I/gym.jpg"
ffmpeg -v error -y -i "$A/hf_20260819_231251_577b6c15-4240-4514-ae28-124d9d971c8e.png" -vf "crop=3072:1920:0:1500,scale=1600:1000" -q:v 4 "$I/garden.jpg"
ffmpeg -v error -y -i "$A/hf_20260819_231252_e6863698-0dad-4d92-b4ea-fcf0a7b695af.png" -vf "crop=3072:3840:0:1200,scale=1200:1500" -q:v 4 "$I/retail.jpg"
ffmpeg -v error -y -i "$A/Family_relaxing_by_nighttime_fire_202608181253.jpeg" -vf "crop=1536:1150:0:980,scale=1800:1348" -q:v 3 "$I/firepit.jpg"

echo "logo: alpha taken from luminance, which keeps the antialiased edges"
LOGO="$A/470920103_1274710743867232_4320639158547619679_n.jpg"
KEY="format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='max(max(r(X,Y),g(X,Y)),b(X,Y))'"
ffmpeg -v error -y -i "$LOGO" -vf "crop=1080:700:0:175,scale=680:-1,$KEY" -c:v png "$I/logo-lock.png"
ffmpeg -v error -y -i "$LOGO" -vf "crop=560:460:265:175,scale=280:-1,$KEY" -c:v png "$I/logo-mono.png"

echo "done"
