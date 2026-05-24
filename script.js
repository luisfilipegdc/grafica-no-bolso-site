/* ============================================================
   Gráfica no Bolso — LP V7 JS
   Theme toggle, mobile menu, parallax, floating CTA, count-up, ripple
   ============================================================ */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----------------------------------------------------------
  // Theme toggle (auto OS + localStorage override)
  // ----------------------------------------------------------
  const STORAGE_KEY = 'gnb-theme';
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  // Carrega: localStorage > OS preference > dark (default)
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }

  // Acompanha mudança do OS se não houver override manual
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function (e) {
      let manual = null;
      try { manual = localStorage.getItem(STORAGE_KEY); } catch (err) {}
      if (!manual) applyTheme(e.matches ? 'light' : 'dark');
    });
  }

  // ----------------------------------------------------------
  // Mobile menu (hamburguer + drawer)
  // ----------------------------------------------------------
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      const open = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menu');
      });
    });
  }

  // ----------------------------------------------------------
  // Scroll handlers: header shadow + floating CTA + per-card parallax
  // ----------------------------------------------------------
  const header = document.querySelector('header');
  const hero = document.querySelector('.hero');
  const ctaBlock = document.querySelector('.final-cta');
  const floatingCta = document.getElementById('floatingCta');

  // Cache dos elementos data-parallax (phone, floats, dash-mini)
  const pxData = !reduced
    ? Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')).map(function (el) {
        return { el: el, v: parseFloat(el.getAttribute('data-parallax')) || 0 };
      })
    : [];

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', y > 8);

    // Per-card parallax (marginTop pra não brigar com transforms/keyframes)
    if (hero && !reduced) {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        for (let i = 0; i < pxData.length; i++) {
          const item = pxData[i];
          const move = Math.max(-60, Math.min(60, y * (item.v / 60)));
          item.el.style.marginTop = move.toFixed(1) + 'px';
        }
      }
    }

    // Floating CTA: aparece após hero, some no CTA final
    if (floatingCta && hero) {
      const heroBottom = hero.getBoundingClientRect().bottom;
      const ctaTop = ctaBlock ? ctaBlock.getBoundingClientRect().top : Infinity;
      const vh = window.innerHeight;
      const shouldShow = heroBottom < 60 && ctaTop > vh - 80;
      floatingCta.classList.toggle('is-visible', shouldShow);
      floatingCta.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ----------------------------------------------------------
  // Phone tilt no mouseover da stage (desktop only)
  // ----------------------------------------------------------
  const stage = document.querySelector('.stage');
  if (stage && !reduced && window.matchMedia('(hover:hover) and (min-width:821px)').matches) {
    let stageRect = null;
    function refreshStageRect() { stageRect = stage.getBoundingClientRect(); }
    refreshStageRect();
    window.addEventListener('resize', refreshStageRect);
    window.addEventListener('scroll', refreshStageRect, { passive: true });

    stage.addEventListener('mousemove', function (e) {
      if (!stageRect) return;
      const cx = stageRect.left + stageRect.width / 2;
      const cy = stageRect.top + stageRect.height / 2;
      const dx = (e.clientX - cx) / stageRect.width;
      const dy = (e.clientY - cy) / stageRect.height;
      const maxTilt = 6;
      stage.style.setProperty('--tilt-y', (dx * maxTilt).toFixed(2) + 'deg');
      stage.style.setProperty('--tilt-x', (-dy * maxTilt).toFixed(2) + 'deg');
    });
    stage.addEventListener('mouseleave', function () {
      stage.style.setProperty('--tilt-y', '0deg');
      stage.style.setProperty('--tilt-x', '0deg');
    });
  }

  // ----------------------------------------------------------
  // Count-up das metrics (entrada em viewport)
  // ----------------------------------------------------------
  function animateNumber(el) {
    const raw = el.textContent.trim();
    const m = raw.match(/^(<?)(\d+)(.*)$/);
    if (!m) return;
    const prefix = m[1] || '';
    const target = parseInt(m[2], 10);
    const suffix = m[3] || '';
    if (target === 0) return;
    const duration = 900;
    const start = performance.now();
    const ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const v = Math.round(target * ease(p));
      el.textContent = prefix + v + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (!reduced && 'IntersectionObserver' in window) {
    const metricIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          const b = e.target.querySelector('b');
          if (b) animateNumber(b);
          metricIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.metric').forEach(function (el) {
      metricIO.observe(el);
    });
  }

  // ----------------------------------------------------------
  // Ripple ao clicar nos botões
  // ----------------------------------------------------------
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (reduced) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
      const y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
      const r = document.createElement('span');
      r.style.cssText =
        'position:absolute;border-radius:50%;background:rgba(255,255,255,.40);' +
        'pointer-events:none;width:' + size + 'px;height:' + size + 'px;' +
        'left:' + x + 'px;top:' + y + 'px;transform:scale(0);' +
        'animation:btnRipple .55s ease-out;';
      btn.appendChild(r);
      setTimeout(function () { r.remove(); }, 560);
    });
  });

  // Inject ripple keyframe se não existir
  if (!document.getElementById('btn-ripple-style')) {
    const s = document.createElement('style');
    s.id = 'btn-ripple-style';
    s.textContent = '@keyframes btnRipple{to{transform:scale(4);opacity:0}}';
    document.head.appendChild(s);
  }
})();
