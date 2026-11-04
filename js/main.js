/* ============================================================
   BIG 4 ACCOUNTING RECRUITMENT — interaction engine
   jQuery-powered: loader, wipe transitions, custom cursor,
   scroll reveals, SVG line drawing, marquees, counters,
   parallax, tilt, magnetic buttons, accordions, dialogs.
   ============================================================ */
(function ($) {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var SIG = 'cubic-bezier(.83,.01,.29,1)';

  /* ---------------------------------------------------------
     LOADER — percentage counter + masked lines + curtain exit
  --------------------------------------------------------- */
  function runLoader(done) {
    var $loader = $('.loader');
    if (!$loader.length) { done(); return; }
    if (reduceMotion) {
      $loader.remove();
      done();
      return;
    }
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { $loader.addClass('is-boot'); });

    var $num = $('.loader__percent span');
    var start = null, DUR = 1500;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      $num.text(String(Math.round(eased * 100)).padStart(3, '0') + '%');
      $('.loader__bar').css('width', (eased * 100) + '%');
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    }
    function finish() {
      setTimeout(function () {
        $loader.addClass('is-done');
        document.body.classList.remove('is-locked');
        done();
        setTimeout(function () { $loader.remove(); }, 1000);
      }, 350);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     PAGE WIPE TRANSITIONS
  --------------------------------------------------------- */
  function initWipe() {
    var $wipe = $('.wipe');
    // entry: play wipe out
    $wipe.addClass('is-in');
    setTimeout(function () {
      $wipe.addClass('is-out');
      setTimeout(function () { $wipe.removeClass('is-in is-out'); }, 650);
    }, 80);

    $(document).on('click', 'a[href$=".html"], a[href="index.html"]', function (e) {
      var href = $(this).attr('href');
      if (!href || href.charAt(0) === '#' || e.metaKey || e.ctrlKey || $(this).attr('target')) return;
      if (href.split('#')[0] === location.pathname.split('/').pop()) return; // same page anchor
      e.preventDefault();
      if (reduceMotion) { location.href = href; return; }
      $wipe.removeClass('is-out').addClass('is-in');
      setTimeout(function () { location.href = href; }, 580);
    });
  }

  /* ---------------------------------------------------------
     CUSTOM CURSOR (difference blend)
  --------------------------------------------------------- */
  function initCursor() {
    if (isTouch || reduceMotion) return;
    var $dot = $('<div class="cursor-dot"></div>').appendTo('body');
    var $ring = $('<div class="cursor-ring"></div>').appendTo('body');
    var mx = -100, my = -100, rx = -100, ry = -100;
    $(document).on('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      $dot.css('transform', 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)');
      $ring.css('transform', 'translate(' + (rx - $ring.width() / 2) + 'px,' + (ry - $ring.height() / 2) + 'px)');
      requestAnimationFrame(loop);
    })();
    $(document).on('mouseenter', 'a,button,.svc-item,.job__head,.post,.chip', function () { $ring.addClass('is-hover'); });
    $(document).on('mouseleave', 'a,button,.svc-item,.job__head,.post,.chip', function () { $ring.removeClass('is-hover'); });
  }

  /* ---------------------------------------------------------
     HEADER — hide on scroll down, show on scroll up
  --------------------------------------------------------- */
  function initHeader() {
    var $header = $('.header');
    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      $header.toggleClass('is-scrolled', y > 40);
      if (y > 320 && y > lastY + 4) { $header.removeClass('in').addClass('out'); }
      else if (y < lastY - 4 || y < 120) { $header.removeClass('out').addClass('in'); }
      lastY = y;
      $('.to-top').toggleClass('is-show', y > 700);
      // scroll progress
      var h = document.documentElement.scrollHeight - innerHeight;
      $('.progress').css('width', (h > 0 ? (y / h) * 100 : 0) + '%');
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     FULLSCREEN MENU
  --------------------------------------------------------- */
  function initMenu() {
    $('.burger').on('click', function () {
      var open = $('.menu').toggleClass('is-open').hasClass('is-open');
      $(this).toggleClass('is-open', open);
      document.body.classList.toggle('is-locked', open);
    });
    $('.menu a').on('click', function () {
      $('.menu').removeClass('is-open');
      $('.burger').removeClass('is-open');
      document.body.classList.remove('is-locked');
    });
  }

  /* ---------------------------------------------------------
     SCROLL REVEALS (wow-style) + stagger + split headings
  --------------------------------------------------------- */
  function splitHeadings() {
    $('.split').each(function () {
      var $el = $(this);
      if ($el.data('split')) return;
      $el.data('split', true);
      var words = $el.text().trim().split(/\s+/);
      $el.empty();
      words.forEach(function (w, i) {
        var $w = $('<span class="w"><span></span></span>');
        $w.find('span').text(w).css('transition-delay', (i * 0.07) + 's');
        $el.append($w).append(document.createTextNode(' '));
      });
    });
  }

  function initReveals() {
    splitHeadings();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
          if (en.target.hasAttribute('data-count-to')) animateCount(en.target);
          if (en.target.hasAttribute('data-vivus')) playVivus(en.target);
          if (en.target.hasAttribute('data-drawpath')) armPath(en.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    $('[data-reveal],[data-stagger],.img-reveal,.split,[data-count-to],[data-vivus],[data-drawpath]').each(function () {
      io.observe(this);
    });
  }

  /* ---------------------------------------------------------
     COUNTERS
  --------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    var suffix = el.getAttribute('data-count-suffix') || '';
    var dur = 1800, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.firstChild.nodeValue = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    if (reduceMotion) { el.firstChild.nodeValue = target; return; }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     VIVUS — SVG stroke drawing on scroll
  --------------------------------------------------------- */
  function playVivus(el) {
    if (typeof Vivus === 'undefined') return;
    var dur = parseInt(el.getAttribute('data-vivus'), 10) || 50;
    new Vivus(el.id, {
      start: 'manual', type: 'oneByOne', duration: dur,
      animTimingFunction: Vivus.EASE
    }, function () {}).play();
  }

  /* ---------------------------------------------------------
     SCROLL-DRIVEN PATH (timeline line draws with scroll)
  --------------------------------------------------------- */
  var drawPaths = [];
  function armPath(section) {
    var path = section.querySelector('path');
    if (!path || path.dataset.armed) return;
    path.dataset.armed = '1';
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    drawPaths.push({ section: section, path: path, len: len });
  }
  function updatePaths() {
    var vh = innerHeight;
    drawPaths.forEach(function (d) {
      var r = d.section.getBoundingClientRect();
      var progress = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      progress = Math.max(0, Math.min(1, progress));
      d.path.style.strokeDashoffset = d.len * (1 - progress);
    });
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(updatePaths); }, { passive: true });

  /* ---------------------------------------------------------
     PARALLAX — [data-parallax] elements drift with scroll
  --------------------------------------------------------- */
  var plxEls = [];
  function initParallax() {
    if (reduceMotion) return;
    $('[data-parallax]').each(function () { plxEls.push(this); });
    if (!plxEls.length) return;
    window.addEventListener('scroll', function () { requestAnimationFrame(applyPlx); }, { passive: true });
    applyPlx();
  }
  function applyPlx() {
    var vh = innerHeight;
    plxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
      var r = el.getBoundingClientRect();
      var delta = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = 'translate3d(0,' + delta.toFixed(1) + 'px,0)';
    });
  }

  /* ---------------------------------------------------------
     MARQUEES — duplicate content for seamless loop
  --------------------------------------------------------- */
  function initMarquees() {
    $('.marquee__track').each(function () {
      var $t = $(this);
      if ($t.data('dup')) return;
      $t.data('dup', true);
      $t.html($t.html() + $t.html());
    });
  }

  /* ---------------------------------------------------------
     MAGNETIC BUTTONS + CARD TILT
  --------------------------------------------------------- */
  function initMagnetic() {
    if (isTouch || reduceMotion) return;
    $('.btn,.to-top,.hero__spin').each(function () {
      var el = this;
      $(el).on('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.28;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transition = 'transform .12s ease-out';
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      $(el).on('mouseleave', function () {
        el.style.transition = 'transform .5s ' + SIG;
        el.style.transform = '';
      });
    });
  }
  function initTilt() {
    if (isTouch || reduceMotion) return;
    $('.post,.value,.perk,.aud__card').each(function () {
      var el = this;
      $(el).on('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        el.style.transform = 'translateY(-8px) perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      $(el).on('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     ACCORDIONS (services + jobs) — animated max-height
  --------------------------------------------------------- */
  function initAccordions() {
    $('.svc-item').on('click', function () {
      var $item = $(this), $body = $item.next('.svc-body');
      var isOpen = $item.hasClass('is-open');
      $('.svc-item.is-open').removeClass('is-open').next('.svc-body').css('max-height', 0);
      if (!isOpen) {
        $item.addClass('is-open');
        $body.css('max-height', $body[0].scrollHeight + 'px');
      }
    });
    $('.job__head').on('click', function () {
      var $job = $(this).closest('.job'), $body = $job.find('.job__body');
      var isOpen = $job.hasClass('is-open');
      $job.toggleClass('is-open', !isOpen);
      $body.css('max-height', isOpen ? 0 : $body[0].scrollHeight + 'px');
    });
  }

  /* ---------------------------------------------------------
     BLOG — filters + reading dialog
  --------------------------------------------------------- */
  function initBlog() {
    $('.chip[data-filter]').on('click', function () {
      var f = $(this).data('filter');
      $('.chip').removeClass('is-active');
      $(this).addClass('is-active');
      $('.post').each(function () {
        var cats = ($(this).data('cat') || '') + '';
        $(this).toggleClass('is-hidden', f !== 'all' && cats.indexOf(f) === -1);
      });
    });

    var $dlg = $('.dialog');
    $(document).on('click', '.post', function () {
      var $p = $(this);
      $('.dialog__hero img').attr('src', $p.find('.post__img img').attr('src'));
      $('.dialog__cat').text($p.find('.post__cat').text());
      $('.dialog__body h2').text($p.find('.post__title').text());
      $('.dialog__meta').html($p.find('.post__meta').html());
      $('.dialog__article').html($p.find('.post__full').html());
      $dlg.addClass('is-open');
      document.body.classList.add('is-locked');
      $dlg.find('.dialog__panel').scrollTop(0);
    });
    function closeDlg() {
      $dlg.removeClass('is-open');
      document.body.classList.remove('is-locked');
    }
    $('.dialog__close,.dialog__veil').on('click', closeDlg);
    $(document).on('keydown', function (e) { if (e.key === 'Escape') closeDlg(); });
  }

  /* ---------------------------------------------------------
     CAREERS — filters
  --------------------------------------------------------- */
  function initCareers() {
    $('.chip[data-jfilter]').on('click', function () {
      var f = $(this).data('jfilter');
      $('.chip').removeClass('is-active');
      $(this).addClass('is-active');
      $('.job').each(function () {
        var lvl = $(this).data('level');
        $(this).toggleClass('is-hidden', f !== 'all' && lvl !== f);
      });
    });
  }

  /* ---------------------------------------------------------
     CONTACT FORM → mailto draft
  --------------------------------------------------------- */
  function initContact() {
    $('#contact-form').on('submit', function (e) {
      e.preventDefault();
      var name = $('#cf-name').val().trim();
      var email = $('#cf-email').val().trim();
      var phone = $('#cf-phone').val().trim();
      var type = $('#cf-type').val();
      var msg = $('#cf-msg').val().trim();
      if (!name || !email || !msg) return;
      var subject = encodeURIComponent('[' + type + '] Enquiry from ' + name);
      var body = encodeURIComponent(
        'Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + phone +
        '\nI am a: ' + type + '\n\n' + msg
      );
      window.location.href = 'mailto:raj@big4business.com?subject=' + subject + '&body=' + body;
      $('.form-ok').addClass('is-show');
    });
  }

  /* ---------------------------------------------------------
     BOOT
  --------------------------------------------------------- */
  $(function () {
    initWipe();
    initHeader();
    initMenu();
    initMarquees();

    runLoader(function () {
      document.body.classList.add('is-loaded');
      initReveals();
      initParallax();
      initMagnetic();
      initTilt();
    });

    initAccordions();
    initBlog();
    initCareers();
    initContact();
    initCursor();

    $('.to-top').on('click', function () {
      $('html,body').animate({ scrollTop: 0 }, 800);
    });
    $('#year').text(new Date().getFullYear());
  });

})(jQuery);
