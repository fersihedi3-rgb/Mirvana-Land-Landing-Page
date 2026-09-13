/* ============================================================
   MIRVANA LAND
   Hero: scroll-scrubbed flight from Marrakech to the villas.
   Page: smooth scroll, word reveals, parallax, counters.
   ============================================================ */
(function () {
  "use strict";

  /* ---- CONFIG -------------------------------------------------
     WHATSAPP  : the number the qualified lead is handed to.
     ENDPOINT  : where the record is saved. Leave "" and the form
                 still works (WhatsApp handoff + local backup).
  -------------------------------------------------------------- */
  var WHATSAPP = "212612009489";
  var ENDPOINT = "";

  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* Motion level.
     Full motion for every visitor, by decision of the site owner: the
     animation is the pitch here, and the OS setting was suppressing it
     for a large share of the audience. ?motion=reduced is kept as an
     opt-out for anyone who needs it (and for our own testing).
     Note this does mean visitors who set prefers-reduced-motion for
     vestibular reasons will still get parallax and scroll motion. */
  var forced = null;
  try { forced = new URLSearchParams(location.search).get("motion"); } catch (e) {}
  var MOTION = forced !== "reduced";
  if (MOTION) document.documentElement.classList.add("motion-full");

  var lenis = null;

  /* ================= SMOOTH SCROLL ================= */
  (function smooth() {
    if (!hasGSAP || typeof window.Lenis === "undefined") return;
    /* Damping on the reader's own input rather than motion of its own,
       so it stays on (shorter) even at the reduced setting. */
    lenis = new Lenis({
      duration: MOTION ? 1.15 : 0.65,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    /* In-page anchors have to go through Lenis or they fight it. */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -76, duration: MOTION ? 1.6 : 0.8 });
      });
    });
  })();

  /* ================= NAV ================= */
  (function nav() {
    var el = document.getElementById("nav");
    if (!el) return;

    var overHero = true, overDark = false;
    function apply() {
      el.classList.toggle("is-dark", overDark);
      el.classList.toggle("is-solid", !overHero && !overDark);
    }

    var hero = document.getElementById("hero");
    if (hero) {
      new IntersectionObserver(function (entries) {
        overHero = entries[0].isIntersecting; apply();
      }, { rootMargin: "-72px 0px 0px 0px", threshold: 0 }).observe(hero);
    } else { overHero = false; }

    var darkZones = [document.getElementById("contact"), document.querySelector(".foot")].filter(Boolean);
    if (darkZones.length) {
      var hits = new Set();
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) hits.add(e.target); else hits.delete(e.target); });
        overDark = hits.size > 0; apply();
      }, { rootMargin: "0px 0px -100% 0px", threshold: 0 });
      darkZones.forEach(function (z) { io2.observe(z); });
    }
    apply();

    /* Retract on the way down, return on the way up. */
    if (hasGSAP && MOTION) {
      var lastY = 0;
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: function (self) {
          var y = self.scroll();
          if (y > 640 && y > lastY + 4) el.classList.add("is-tucked");
          else if (y < lastY - 4) el.classList.remove("is-tucked");
          lastY = y;
        }
      });
    }
  })();

  /* ================= HERO ================= */
  (function hero() {
    var section = document.getElementById("hero");
    var stage = document.getElementById("heroStage");
    var video = document.getElementById("heroVideo");
    var chaps = Array.prototype.slice.call(document.querySelectorAll(".chap"));
    var beats = Array.prototype.slice.call(document.querySelectorAll(".hero__beat"));
    if (!section || !video) return;

    /* Phones get the half-frame-count build: same 720p, same CRF, so
       no loss of sharpness, just fewer scrub positions. Chosen before
       anything reads the element so the other file is never fetched. */
    var phone = window.matchMedia("(max-width: 820px)").matches;
    var SRC_FPS = parseFloat(video.getAttribute(phone ? "data-fps-mobile" : "data-fps-desktop")) || 25;
    var chosen = video.getAttribute(phone ? "data-src-mobile" : "data-src-desktop");
    if (chosen && !video.src) video.src = chosen;

    /* Keyed to the footage. The flight holds on Marrakech and the route
       to about 0.56, whips into the village, holds, then whips into the
       villas at about 0.81. Both chapter splits sit on a whip so the
       motion blur covers the change of line. */
    var CHAPTERS = [
      { a: 0.000, b: 0.575 },
      { a: 0.575, b: 0.807 },
      { a: 0.807, b: 1.000 }
    ];
    var WINDOWS = [
      /* Out at the halfway point of chapter 1 so the labels burnt into
         the footage (Marrakech, Route d'Amizmiz, Mirvana Land) are not
         competing with our own type. */
      { in0: -0.001, in1: 0.000, out0: 0.255, out1: 0.300 },
      { in0: 0.596, in1: 0.638, out0: 0.745, out1: 0.786 },
      { in0: 0.834, in1: 0.876, out0: 0.955, out1: 0.995 }
    ];

    var chapWrap = document.querySelector(".hero__chapters");
    var navEl = document.getElementById("nav");

    /* Everything we draw on top of the video clears from the halfway
       point of l'emplacement until the chapter ends, then returns. */
    function paintOverlays(p) {
      var hidden = ramp(p, 0.255, 0.300) * (1 - ramp(p, 0.550, 0.600));
      var vis = 1 - hidden;
      if (chapWrap) chapWrap.style.opacity = vis;
      if (navEl) navEl.classList.toggle("is-cloaked", vis < 0.5);
    }

    function paintChapters(p) {
      for (var i = 0; i < chaps.length; i++) {
        var c = CHAPTERS[i]; if (!c) continue;
        var f = (p - c.a) / (c.b - c.a);
        f = f < 0 ? 0 : (f > 1 ? 1 : f);
        var bar = chaps[i].firstElementChild && chaps[i].firstElementChild.firstElementChild;
        if (bar) bar.style.width = (f * 100).toFixed(2) + "%";
        chaps[i].classList.toggle("is-on", p >= c.a && p < c.b);
      }
    }

    if (!hasGSAP) {
      beats.forEach(function (b) { b.style.opacity = 1; b.style.transform = "none"; });
      return;
    }

    /* The hero runs whatever the motion setting: it is scroll-linked,
       so it only moves when the reader moves, and the footage is the
       content. Only the drift and the intro fade are dropped. */
    var soft = MOTION;
    document.documentElement.classList.add("js-scrub");

    function ramp(p, a, b) {
      if (p <= a) return 0;
      if (p >= b) return 1;
      var t = (p - a) / (b - a);
      return t * t * (3 - 2 * t);
    }

    var setters = beats.map(function (b) {
      return { o: gsap.quickSetter(b, "opacity"), y: gsap.quickSetter(b, "y", "px") };
    });

    var intro = { v: 0 };
    var lastP = 0;

    function paintBeats(p) {
      lastP = p;
      for (var i = 0; i < beats.length; i++) {
        var w = WINDOWS[i]; if (!w) continue;
        var a = ramp(p, w.in0, w.in1) * (1 - ramp(p, w.out0, w.out1));
        if (i === 0) a *= intro.v;
        setters[i].o(a);
        var y = soft ? ((1 - ramp(p, w.in0, w.in1)) * 30 - ramp(p, w.out0, w.out1) * 22) : 0;
        if (i === 0 && soft) y += (1 - intro.v) * 26;
        setters[i].y(y);
      }
    }
    paintBeats(0);
    paintChapters(0);
    paintOverlays(0);

    if (soft) {
      gsap.to(intro, {
        v: 1, duration: 1.6, delay: 0.25, ease: "power2.out",
        onUpdate: function () { paintBeats(lastP); }
      });
    } else { intro.v = 1; paintBeats(0); }

    /* ---- scrub engine ---- */
    var proxy = { t: 0 };
    var lastFrame = -1;
    var duration = 0;
    var ready = false;

    function onMeta() {
      duration = video.duration || 0;
      if (duration > 0) { ready = true; ScrollTrigger.refresh(); }
    }
    if (video.readyState >= 1) onMeta();
    video.addEventListener("loadedmetadata", onMeta, { once: true });

    /* ---- self-playing intro ----
       The hero plays on its own when the page opens, so a reader who has
       not scrolled yet still sees the flight. While it plays, the beats
       and chapters are driven by the video clock rather than by scroll.
       The first scroll hands control over, and a short blend keeps the
       picture from snapping backwards at the moment of handover. */
    var autoMode = true;
    var handoff = { k: 1 };      /* 1 = fully scroll-driven */
    var heldTime = 0;

    function autoPaint() {
      if (!autoMode || !ready) return;
      var p = duration ? Math.min(video.currentTime / duration, 1) : 0;
      paintBeats(p); paintChapters(p); paintOverlays(p);
    }

    function endAuto() {
      if (!autoMode) return;
      autoMode = false;
      heldTime = video.currentTime || 0;
      video.loop = false;
      try { video.pause(); } catch (e) {}
      if (soft) {
        handoff.k = 0;
        gsap.to(handoff, { k: 1, duration: 0.75, ease: "power2.inOut" });
      }
      ScrollTrigger.refresh();
    }

    function startAuto() {
      /* Loops while nobody has scrolled, so the hero keeps moving
         instead of freezing on the last frame. */
      video.loop = true;
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () { autoMode = false; });
    }
    if (video.readyState >= 2) startAuto();
    else video.addEventListener("canplay", startAuto, { once: true });

    /* Any sign of the reader taking over ends the intro. */
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (ev) {
      window.addEventListener(ev, endAuto, { once: true, passive: true });
    });
    if (lenis) lenis.on("scroll", function () { if (window.scrollY > 24) endAuto(); });

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      /* 6 viewport heights across 514 frames: about one frame per 9px
         of scroll, which is what makes the flight feel unhurried. */
      end: function () { return "+=" + Math.round(window.innerHeight * 6); },
      pin: stage,
      pinSpacing: true,
      scrub: soft ? 1.15 : 0.85,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        if (autoMode) return;           /* the video clock is driving */
        var p = self.progress;
        proxy.t = p * (duration || 1);
        paintBeats(p);
        paintChapters(p);
        paintOverlays(p);
      }
    });

    /* Quantise to the chosen build's frame grid: one seek per frame
       that actually changes, instead of two or three per frame. */
    gsap.ticker.add(function () {
      if (!ready) return;
      if (autoMode) { autoPaint(); return; }   /* playing itself */
      if (video.seeking) return;
      /* Blend out of wherever the intro left the picture. */
      var target = handoff.k >= 1 ? proxy.t
                 : heldTime + (proxy.t - heldTime) * handoff.k;
      var frame = Math.round(target * SRC_FPS);
      if (frame === lastFrame) return;
      lastFrame = frame;
      try { video.currentTime = Math.min(frame / SRC_FPS, duration - 0.02); } catch (e) {}
    });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  })();

  /* ================= WORD REVEALS ================= */
  (function splitReveals() {
    if (!hasGSAP) return;
    var heads = document.querySelectorAll("[data-split]");
    if (!heads.length) return;

    function splitWords(el) {
      var text = el.textContent;
      var frag = document.createDocumentFragment();
      var parts = text.split(/(\s+)/);
      var inners = [];
      parts.forEach(function (tok) {
        if (tok === "") return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
        var box = document.createElement("span"); box.className = "w";
        var inner = document.createElement("span"); inner.className = "wi";
        inner.textContent = tok;
        box.appendChild(inner); frag.appendChild(box);
        inners.push(inner);
      });
      el.textContent = "";
      el.appendChild(frag);
      return inners;
    }

    heads.forEach(function (el) {
      if (!MOTION) return;               /* leave the plain text alone */
      var inners = splitWords(el);
      gsap.set(inners, { yPercent: 118 });
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(inners, {
            yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.045, overwrite: true
          });
        }
      });
    });
  })();

  /* ================= PARALLAX + PUSH-IN ================= */
  (function depth() {
    if (!hasGSAP) return;
    document.querySelectorAll("[data-kb]").forEach(function (wrap) {
      var media = wrap.querySelector("img, video");
      if (!media) return;
      if (!MOTION) { gsap.set(media, { scale: 1, yPercent: 0 }); return; }
      var par = parseFloat(wrap.getAttribute("data-par") || "0");
      /* One tween writes both scale and offset, so the two effects can
         never fight over the same transform. The floor scale leaves
         enough overscan that the parallax never reveals an edge. */
      gsap.fromTo(media,
        { scale: 1.2, yPercent: par * 25 },
        {
          scale: 1.08, yPercent: -par * 25, ease: "none",
          scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 1.1 }
        });
    });
  })();

  /* ================= COUNTERS ================= */
  (function counters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var group = el.hasAttribute("data-group");
      function render(v) {
        var n = Math.round(v);
        el.textContent = (group ? n.toLocaleString("fr-FR") : String(n)) + suffix;
      }
      if (!hasGSAP || !MOTION) { render(target); return; }
      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          gsap.to(o, { v: target, duration: 2, ease: "expo.out", onUpdate: function () { render(o.v); } });
        }
      });
    });
  })();

  /* ================= REVEALS ================= */
  (function reveals() {
    var els = document.querySelectorAll(".reveal");
    if (!hasGSAP || !MOTION) {
      els.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    ScrollTrigger.batch(".reveal", {
      start: "top 88%", once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.085, overwrite: true
        });
      }
    });
    /* The village grid gets a little more lift than the rest. */
    gsap.set(".grid6 .cell", { transformOrigin: "50% 100%" });
    ScrollTrigger.batch(".grid6 .cell", {
      start: "top 92%", once: true,
      onEnter: function (batch) {
        gsap.from(batch, { scale: 0.97, duration: 1.1, ease: "power3.out", stagger: 0.07 });
      }
    });
  })();

  /* Play the looping clip only while it is on screen. */
  (function lazyLoops() {
    var vids = document.querySelectorAll("video[loop]");
    if (!vids.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload === "none") { v.preload = "auto"; v.load(); }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    }, { threshold: 0.2 });
    vids.forEach(function (v) { io.observe(v); });
  })();

  /* ================= LEAD FORM ================= */
  (function leadForm() {
    var form = document.getElementById("leadForm");
    var done = document.getElementById("leadDone");
    var waLink = document.getElementById("waLink");
    var btn = document.getElementById("leadSubmit");
    if (!form) return;

    var LABELS = {
      nom: "Nom", tel: "Téléphone", email: "Email", budget: "Budget",
      projet: "Projet", delai: "Échéance", financement: "Financement", mot: "Message"
    };
    function fieldOf(input) { return input.closest(".field"); }

    function validate() {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var good = input.value.trim() !== "";
        if (good && input.type === "email") good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        if (good && input.type === "tel") good = input.value.replace(/\D/g, "").length >= 8;
        var f = fieldOf(input);
        if (f) f.classList.toggle("is-bad", !good);
        if (!good && ok) { input.focus(); ok = false; }
      });
      return ok;
    }

    form.addEventListener("input", function (e) {
      var f = fieldOf(e.target);
      if (f && f.classList.contains("is-bad")) f.classList.remove("is-bad");
    });

    function collect() {
      var data = {};
      ["nom", "tel", "email", "budget", "projet", "delai", "financement", "mot"].forEach(function (k) {
        var el = form.elements[k];
        data[k] = el ? el.value.trim() : "";
      });
      data.recu_le = new Date().toISOString();
      data.source = location.href;
      return data;
    }

    function waText(d) {
      var lines = ["Bonjour, je viens du site Mirvana Land.", ""];
      ["nom", "tel", "email", "budget", "projet", "delai", "financement"].forEach(function (k) {
        lines.push(LABELS[k] + " : " + d[k]);
      });
      if (d.mot) { lines.push(""); lines.push(LABELS.mot + " : " + d.mot); }
      return lines.join("\n");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;

      var data = collect();
      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(waText(data));

      /* Opened synchronously inside the handler, or the pop-up blocker
         eats it. */
      var win = window.open(url, "_blank", "noopener");

      if (waLink) waLink.href = url;
      btn.disabled = true;

      try {
        var box = JSON.parse(localStorage.getItem("mirvana_leads") || "[]");
        box.push(data);
        localStorage.setItem("mirvana_leads", JSON.stringify(box));
      } catch (err) {}

      if (ENDPOINT) {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        }).catch(function () {});
      }

      form.classList.add("is-off");
      done.classList.add("is-on");
      if (lenis) lenis.scrollTo(done, { offset: -140, duration: 1.2 });
      else done.scrollIntoView({ behavior: MOTION ? "smooth" : "auto", block: "center" });
      if (hasGSAP && MOTION) {
        gsap.fromTo(done, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" });
      }
      void win;
    });
  })();

})();
