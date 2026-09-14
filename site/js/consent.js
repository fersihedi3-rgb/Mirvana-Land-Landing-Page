/* Mirvana Land: consent gate for Google Analytics 4.

   The visitors this page is built for are mostly in France, so the CNIL rules
   apply: no measurement cookie may be written before an explicit choice,
   refusing must cost exactly as little as accepting, and the choice must be
   changeable later. This file is the only place that loads anything from
   Google.

   GA_ID empty is the shipped default: no tag, no cookie, no banner, and the
   privacy policy's "aucun cookie" wording stays true. Fill GA_ID in to switch
   measurement on -- that single edit is the whole switch, but it also makes
   section 8 of confidentialite.html apply, so read it before shipping.

   Loaded on all three pages, before mirvana.js. Every lookup is null-guarded,
   because this file runs on the legal pages too, which have almost no DOM. */
(function () {
  'use strict';

  var GA_ID = '';              /* 'G-XXXXXXXXXX' -- see confidentialite.html section 8 */
  var KEY = 'mirvana_consent';
  var REASK_DAYS = 182;        /* a refusal is honoured ~6 months, then asked once more */

  /* ---- stored choice ------------------------------------------------- */

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      if (!saved || (saved.state !== 'granted' && saved.state !== 'denied')) return null;
      var age = (Date.now() - (saved.at || 0)) / 86400000;
      /* Acceptance stands until withdrawn; a refusal expires so the question
         may be put once more, which is what the CNIL allows. */
      if (saved.state === 'denied' && age > REASK_DAYS) return null;
      return saved;
    } catch (err) { return null; }
  }

  function write(state) {
    try { localStorage.setItem(KEY, JSON.stringify({ state: state, at: Date.now() })); }
    catch (err) { /* private mode: the choice holds for this page view only */ }
  }

  /* ---- Google plumbing ------------------------------------------------ */

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  /* Consent Mode v2 denied-by-default, queued before any tag can exist, so a
     mis-ordered script still cannot write a cookie ahead of the choice. */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });

  var loaded = false;
  function loadGA() {
    if (loaded || !GA_ID) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    /* IP anonymisation is implicit in GA4; the rest keeps the profile thin. */
    gtag('config', GA_ID, { anonymize_ip: true, allow_google_signals: false });
  }

  function grant() {
    gtag('consent', 'update', {
      ad_storage: 'denied',            /* measurement only: no advertising use */
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });
    loadGA();
  }

  /* ---- banner --------------------------------------------------------- */

  var banner = null, lastFocus = null;

  function close() {
    if (!banner) return;
    banner.remove();
    banner = null;
    document.documentElement.classList.remove('consent-open');
    announce(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  function choose(state) {
    write(state);
    if (state === 'granted') grant();
    close();
  }

  function build() {
    if (banner) return;
    lastFocus = document.activeElement;

    banner = document.createElement('aside');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'consentTitle');
    banner.innerHTML =
      '<h2 id="consentTitle">Mesure d’audience</h2>' +
      '<p>Nous aimerions savoir combien de personnes consultent ce site et par quel ' +
      'chemin elles arrivent, via Google Analytics. Cela dépose des cookies sur ' +
      'votre appareil. Rien n’est installé sans votre accord, et refuser ne change ' +
      'rien à votre visite.</p>' +
      '<div class="consent__actions">' +
        '<button type="button" class="button consent__btn" data-consent="denied">Refuser</button>' +
        '<button type="button" class="button consent__btn" data-consent="granted">Accepter</button>' +
      '</div>' +
      '<p class="consent__link"><a href="' + prefix() + 'confidentialite.html">Politique de confidentialité</a></p>';

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (btn) choose(btn.getAttribute('data-consent'));
    });
    /* Escape dismisses as a refusal: walking away must never mean yes. */
    banner.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); choose('denied'); }
    });

    document.body.appendChild(banner);
    document.documentElement.classList.add('consent-open');
    announce(true);
    var first = banner.querySelector('[data-consent="denied"]');
    if (first) first.focus();
  }

  /* The banner covers the hero slideshow's pause control. Rather than move
     that control over the headline, the slideshow holds still while the
     question is up: auto-advancing content the visitor cannot stop is the
     thing being avoided, and stopping it satisfies that directly.
     mirvana.js listens; the legal pages have no slideshow and ignore it. */
  function announce(open) {
    document.dispatchEvent(new CustomEvent('mirvana:consent', { detail: { open: open } }));
  }

  /* The legal pages sit next to index.html, so a bare filename is right from
     every page currently in the site. Kept as a function so a future move into
     a subdirectory has one place to fix. */
  function prefix() { return ''; }

  /* ---- public surface -------------------------------------------------- */

  /* Footer and privacy page call this to reopen the question. */
  function open() { close(); build(); }

  /* mirvana.js reports the lead handoff through this. It is a no-op unless the
     visitor accepted, so calling it unconditionally is safe. */
  function track(name, params) {
    var saved = read();
    if (!saved || saved.state !== 'granted' || !GA_ID) return;
    gtag('event', name, params || {});
  }

  window.mirvanaConsent = { open: open, track: track, configured: !!GA_ID };

  function start() {
    /* Wire every "manage cookies" control, on all three pages. */
    document.querySelectorAll('[data-consent-open]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });

    /* Anything that is only true while measurement exists is marked
       data-consent-scope, and the inverse is data-consent-scope="off". This is
       what keeps the privacy policy honest in both states: with no measurement
       id the controls disappear and the page says so itself, instead of
       describing cookies that are not there. */
    document.querySelectorAll('[data-consent-scope]').forEach(function (el) {
      var wantsOn = el.getAttribute('data-consent-scope') !== 'off';
      el.hidden = wantsOn !== !!GA_ID;
    });

    if (!GA_ID) return;            /* no tag configured: stay cookie-free, ask nothing */
    var saved = read();
    if (!saved) build();
    else if (saved.state === 'granted') grant();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
