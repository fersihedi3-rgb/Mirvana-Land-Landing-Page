/* Mirvana Land: native scrolling, image gallery, video and qualified lead handoff. */
(function () {
  'use strict';
  var WHATSAPP = '212612009489';
  var ENDPOINT = '';
  var MOTION = new URLSearchParams(location.search).get('motion') !== 'reduced';
  if (MOTION) document.documentElement.classList.add('motion-full');

  (function navigation() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('mobileMenu');
    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('.sr-only').textContent = 'Ouvrir le menu';
      nav.classList.remove('is-open');
    }
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.sr-only').textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
      nav.classList.toggle('is-open', open);
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); }
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !nav.contains(e.target)) closeMenu(); });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (e) { if (e.matches) closeMenu(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        nav.classList.toggle('is-solid', !entries[0].isIntersecting);
      }, { rootMargin: '-80px 0px 0px 0px' }).observe(document.getElementById('hero'));
      var links = nav.querySelectorAll('a[href^="#"]');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-20% 0px -55% 0px' });
      document.querySelectorAll('main > section[id]').forEach(function (section) { io.observe(section); });
    }
  })();

  (function heroSlideshow() {
    var hero = document.getElementById('hero');
    var slides = Array.from(hero.querySelectorAll('.hero__slide'));
    var dots = Array.from(hero.querySelectorAll('[data-slide]'));
    var pause = document.getElementById('heroPause');
    var index = 0, timer = null, visible = true, paused = !MOTION, request = 0;
    var bag = [];
    hero.querySelector('.hero__controls').hidden = false;
    function label() {
      pause.textContent = paused ? 'Reprendre' : 'Pause';
      pause.setAttribute('aria-label', paused ? 'Reprendre le diaporama' : 'Mettre le diaporama en pause');
    }
    function schedule() {
      clearTimeout(timer);
      if (!visible || paused || document.hidden) return;
      timer = setTimeout(function () {
        if (!bag.length) bag = slides.map(function (_, i) { return i; }).filter(function (i) { return i !== index; }).sort(function () { return Math.random() - .5; });
        show(bag.pop(), false);
      }, 5600);
    }
    function show(next, manual) {
      clearTimeout(timer);
      var ticket = ++request;
      var slide = slides[next];
      function activate() {
        if (ticket !== request || (!manual && (paused || !visible || document.hidden))) { schedule(); return; }
        index = next;
        slides.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
        dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); dot.setAttribute('aria-pressed', String(i === index)); });
        if (MOTION && window.gsap) gsap.fromTo(slide, { scale: 1.07 }, { scale: 1, duration: 7, ease: 'none', overwrite: true });
        schedule();
      }
      if (slide.dataset.src) {
        slide.onload = activate;
        slide.onerror = schedule;
        slide.src = slide.dataset.src;
        delete slide.dataset.src;
      } else if (slide.complete && slide.naturalWidth) activate();
      else { slide.onload = activate; slide.onerror = schedule; }
    }
    dots.forEach(function (dot) { dot.addEventListener('click', function () { bag = []; show(Number(dot.dataset.slide), true); }); });
    pause.addEventListener('click', function () { paused = !paused; label(); schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; schedule(); }, { threshold: .1 }).observe(hero);
    label(); schedule();
  })();

  (function cinematicMotion() {
    // Owner-requested motion runs even when the OS requests reduced motion.
    // Only the explicit ?motion=reduced URL disables these effects.
    if (!MOTION || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('h1, h2').forEach(function (heading) {
      heading.setAttribute('aria-label', heading.innerText.replace(/\s+/g, ' ').trim());
      heading.classList.add('cinematic-heading');
      function split(parent) {
        Array.from(parent.childNodes).forEach(function (node) {
          if (node.nodeType === 3) {
            var fragment = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach(function (word) {
              if (!word.trim()) { fragment.appendChild(document.createTextNode(word)); return; }
              var mask = document.createElement('span'); mask.className = 'word-mask'; mask.setAttribute('aria-hidden', 'true');
              var inner = document.createElement('span'); inner.className = 'word-inner'; inner.textContent = word;
              mask.appendChild(inner); fragment.appendChild(mask);
            });
            node.replaceWith(fragment);
          } else if (node.nodeType === 1) split(node);
        });
      }
      split(heading);
      gsap.from(heading.querySelectorAll('.word-inner'), {
        yPercent: 112, rotationX: -45, opacity: 0, duration: 1.15,
        stagger: .055, ease: 'power4.out',
        scrollTrigger: { trigger: heading, start: 'top 91%', once: true }
      });
    });
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.from(el, { y: 75, opacity: 0, duration: 1.15, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
    });
    document.querySelectorAll('.feature-list, .detail-list, .project__facts').forEach(function (list) {
      gsap.from(list.children, { y: 34, opacity: 0, duration: .85, stagger: .085, ease: 'power3.out',
        scrollTrigger: { trigger: list, start: 'top 92%', once: true } });
    });
    document.querySelectorAll('.media').forEach(function (wrap) {
      var media = wrap.querySelector('img, video');
      if (!media) return;
      var gentle = wrap.dataset.parallax === 'gentle';
      gsap.fromTo(media, { scale: gentle ? 1.1 : 1.22, yPercent: gentle ? -3 : -8 }, {
        scale: gentle ? 1.08 : 1.12, yPercent: gentle ? 3 : 5, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 1.1 }
      });
    });
    gsap.to('.hero__slideshow', { yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 } });
    gsap.fromTo('.film__frame', { y: 65 }, { y: -25, ease: 'none',
      scrollTrigger: { trigger: '#film', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    if (document.fonts) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  })();

  (function gallery() {
    var track = document.getElementById('galleryTrack');
    var slides = Array.from(track.querySelectorAll('.gallery__slide'));
    var index = 0;
    var dialog = document.getElementById('lightbox');
    var image = document.getElementById('lightboxImage');
    var lastFocus;
    var lightboxIndex = 0;
    function updateCaption() {
      document.getElementById('galleryCaption').textContent = slides[index].querySelector('img').alt;
      document.getElementById('galleryCount').textContent = (index + 1) + ' / ' + slides.length;
    }
    function go(next) {
      index = (next + slides.length) % slides.length;
      track.scrollTo({ left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: MOTION ? 'smooth' : 'instant' });
      updateCaption();
    }
    document.querySelectorAll('[data-gallery-step]').forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', function () { go(index + Number(button.dataset.galleryStep)); });
    });
    track.closest('.gallery').classList.add('gallery--enhanced');
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); go(index + (e.key === 'ArrowRight' ? 1 : -1));
      }
      if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); go(e.key === 'Home' ? 0 : slides.length - 1); }
    });
    // IntersectionObserver also tracks touch/swipe and resized slide positions.
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && e.intersectionRatio >= .6) { index = slides.indexOf(e.target); updateCaption(); }
        });
      }, { root: track, threshold: .6 });
      slides.forEach(function (slide) { observer.observe(slide); });
    }
    // The lightbox serves two groups: the villa témoin photographs and the
    // floor plans. Whichever opener is used decides what the arrows step through.
    var galleryImages = slides.map(function (slide) { return slide.querySelector('img'); });
    var planButtons = Array.from(document.querySelectorAll('[data-plan]'));
    var planImages = planButtons.map(function (button) { return button.querySelector('img'); });
    var group = galleryImages;
    function showPhoto(next) {
      lightboxIndex = (next + group.length) % group.length;
      var source = group[lightboxIndex];
      // Plans open their full-size file; thumbnails are too small to read.
      image.src = source.dataset.full || source.currentSrc || source.src;
      image.alt = source.alt;
      document.getElementById('lightboxCaption').textContent = source.dataset.caption || source.alt;
    }
    function openLightbox(list, i) {
      lastFocus = document.activeElement;
      group = list;
      var plans = list === planImages;
      dialog.setAttribute('aria-label', plans ? 'Plan de la villa' : 'Photographie de la villa témoin');
      dialog.querySelector('.lightbox__prev').setAttribute('aria-label', plans ? 'Plan précédent' : 'Photographie précédente');
      dialog.querySelector('.lightbox__next').setAttribute('aria-label', plans ? 'Plan suivant' : 'Photographie suivante');
      showPhoto(i);
      dialog.showModal();
      document.body.classList.add('modal-open');
    }
    slides.forEach(function (slide, i) {
      slide.querySelector('button').addEventListener('click', function () { openLightbox(galleryImages, i); });
    });
    planButtons.forEach(function (button, i) {
      button.addEventListener('click', function () { openLightbox(planImages, i); });
    });
    dialog.querySelector('.lightbox__close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lightbox__prev').addEventListener('click', function () { showPhoto(lightboxIndex - 1); });
    dialog.querySelector('.lightbox__next').addEventListener('click', function () { showPhoto(lightboxIndex + 1); });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(lightboxIndex + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('modal-open');
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    });
  })();

  (function videos() {
    var project = document.getElementById('projectVideo');
    // Native, muted, inline video; retain the responsive range-compatible encodes.
    project.autoplay = false;
    project.muted = true;
    project.src = window.matchMedia('(max-width: 820px)').matches ? project.dataset.srcMobile : project.dataset.srcDesktop;
    var instances = [
      { video: project, toggle: document.getElementById('projectToggle') },
      { video: document.querySelector('.privacy__media video'), toggle: document.querySelector('.privacy__media .video-toggle') }
    ];
    instances.forEach(function (item) {
      var video = item.video, toggle = item.toggle, userPaused = !MOTION, visible = false;
      toggle.hidden = false;
      function label() {
        toggle.textContent = video.paused ? 'Lire la vidéo' : 'Pause';
        toggle.setAttribute('aria-label', video.paused ? 'Lire la vidéo' : 'Mettre la vidéo en pause');
      }
      function sync() {
        if (visible && !userPaused && !document.hidden) {
          var promise = video.play(); if (promise) promise.catch(label);
        } else video.pause();
      }
      video.addEventListener('play', label);
      video.addEventListener('pause', label);
      toggle.addEventListener('click', function () { userPaused = !video.paused; sync(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 }).observe(video);
      } else { visible = true; sync(); }
      document.addEventListener('visibilitychange', sync);
      label();
    });
  })();

  (function leadForm() {
    var form = document.getElementById('leadForm');
    var done = document.getElementById('leadDone');
    var btn = document.getElementById('leadSubmit');
    var keys = ['nom', 'tel', 'email', 'budget', 'projet', 'delai', 'financement', 'mot'];
    var LABELS = { nom: 'Nom', tel: 'Téléphone', email: 'Email', budget: 'Budget', projet: 'Projet', delai: 'Échéance', financement: 'Financement', mot: 'Message' };
    form.querySelectorAll('.field').forEach(function (field) {
      var input = field.querySelector('input, select, textarea');
      var err = field.querySelector('.err');
      var hint = field.querySelector('.hint');
      var ids = [];
      if (err) { err.id = input.id + '-error'; ids.push(err.id); }
      if (hint) { hint.id = input.id + '-hint'; ids.push(hint.id); }
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    });
    function clearError(e) {
      var field = e.target.closest('.field');
      if (field) { field.classList.remove('is-bad'); e.target.removeAttribute('aria-invalid'); }
    }
    form.addEventListener('input', clearError);
    form.addEventListener('change', clearError);
    function validate() {
      var first = null;
      form.querySelectorAll('[required]').forEach(function (input) {
        var good = input.value.trim() !== '';
        if (good && input.type === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        if (good && input.type === 'tel') {
          var count = input.value.replace(/\D/g, '').length;
          good = count >= 8 && count <= 15 && /^[+\d\s().-]+$/.test(input.value.trim());
        }
        input.closest('.field').classList.toggle('is-bad', !good);
        input.setAttribute('aria-invalid', String(!good));
        if (!good && !first) first = input;
      });
      if (first) first.focus();
      return !first;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var data = {};
      keys.forEach(function (key) { data[key] = form.elements[key].value.trim(); });
      data.recu_le = new Date().toISOString(); data.source = location.href;
      var lines = ['Bonjour, je viens du site Mirvana Land.', ''];
      keys.forEach(function (key) { if (data[key]) lines.push(LABELS[key] + ' : ' + data[key]); });
      var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
      // Keep the window open inside the user gesture, before any asynchronous work.
      window.open(url, '_blank', 'noopener');
      document.getElementById('waLink').href = url;
      btn.disabled = true;
      try {
        var stored = JSON.parse(localStorage.getItem('mirvana_leads') || '[]');
        if (!Array.isArray(stored)) stored = [];
        stored.push(data); localStorage.setItem('mirvana_leads', JSON.stringify(stored));
      } catch (err) { /* WhatsApp remains available if browser storage is disabled. */ }
      if (ENDPOINT) {
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) }).catch(function () {});
      }
      form.hidden = true; done.hidden = false;
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: MOTION ? 'smooth' : 'instant', block: 'center' });
    });
    document.getElementById('editLead').addEventListener('click', function () {
      done.hidden = true; form.hidden = false; btn.disabled = false;
      form.elements.nom.focus();
    });
  })();
  (function floatingWhatsApp() {
    // The contact section carries its own WhatsApp action, so the floating
    // button steps aside there instead of stacking a duplicate over the form.
    var float = document.querySelector('.wa-float');
    var contact = document.getElementById('contact');
    if (!float || !contact || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      float.classList.toggle('is-away', entries[0].isIntersecting);
    }, { rootMargin: '0px 0px -35% 0px' }).observe(contact);
  })();

  document.getElementById('year').textContent = new Date().getFullYear();
})();
