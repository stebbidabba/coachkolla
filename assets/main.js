// Coach Kolla – Interactions
// Smooth scroll, scrollspy, mobile menu, parallax, lazy images, form validation

(function () {
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const storageKey = 'coachkolla-theme';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light');
    if (theme === 'dark') body.classList.add('theme-dark');
    else body.classList.add('theme-light');
    try { localStorage.setItem(storageKey, theme); } catch (_) {}
    const btn = qs('.theme-toggle');
    if (btn) {
      const dark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.innerHTML = dark ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    }
  }

  // Initialize theme
  (function initTheme() {
    let theme = 'dark';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'light' || saved === 'dark') theme = saved;
      else theme = prefersDark ? 'dark' : 'light';
    } catch (_) {}
    applyTheme(theme);
  })();
  // Load design JSON if present
  try {
    fetch('assets/design.json')
      .then((res) => res.json())
      .then((design) => {
        if (!design || !design.hero) return;
        const hero = design.hero;
        // Build dynamic content
        const host = qs('#hero-dyn');
        if (host) {
          const title = document.createElement('h1');
          title.className = 'title';
          title.style.fontSize = hero.content?.titleStyle?.size || 'clamp(2rem,5vw,4rem)';
          title.textContent = (hero.content?.title || 'Coach Kolla').replace(/\n\+/g, ' – ');

          const subtitle = document.createElement('p');
          subtitle.className = 'subtitle';
          subtitle.textContent = hero.content?.subtitle || '';

          const buttons = document.createElement('div');
          buttons.className = 'buttons';
          const btnPrimary = document.createElement('a');
          btnPrimary.href = hero.content?.ctaButtons?.[0]?.href || '#contact';
          btnPrimary.className = 'btn btn-primary';
          btnPrimary.textContent = hero.content?.ctaButtons?.[0]?.label || 'Skrá mig í fjarþjálfun';
          buttons.appendChild(btnPrimary);

          if (hero.content?.ctaButtons?.[1]) {
            const btnSecondary = document.createElement('a');
            btnSecondary.href = hero.content?.ctaButtons?.[1]?.href || '#programs';
            btnSecondary.className = 'btn btn-outline';
            btnSecondary.textContent = hero.content?.ctaButtons?.[1]?.label || 'Sjá prógrömm';
            buttons.appendChild(btnSecondary);
          }

          host.appendChild(title);
          host.appendChild(subtitle);
          host.appendChild(buttons);
        }
      })
      .catch(() => {});
  } catch (_) {}

  // Mobile menu toggle
  // Mobile menus (hero and header instances)
  qsa('.nav').forEach((nav) => {
    const toggleBtn = qs('.nav-toggle', nav);
    const menu = qs('.nav-menu', nav);
    if (!toggleBtn || !menu) return;
    toggleBtn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.matches('a')) {
        menu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Theme toggle handler
  const themeBtn = qs('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  // Smooth scroll for local anchors
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.length <= 1) return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        // close any open hero/header menus
        qsa('.nav-menu.open').forEach((m) => m.classList.remove('open'));
        qsa('.nav-toggle[aria-expanded="true"]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', `#${id}`);
      }
    });
  });

  // Scrollspy: highlight nav link for visible section
  const sections = ['home', 'about', 'programs', 'faq', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = qsa('.nav-link');

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = qs(`.nav-link[href="#${id}"]`);
        if (link) {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
          }
        }
      });
    },
    { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0.2 }
  );

  sections.forEach((sec) => spy.observe(sec));

  // Parallax on hero image
  const heroImg = qs('.hero-img');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (!heroImg) return;
    const translateY = Math.min(y * 0.15, 80);
    if (Math.abs(translateY - lastY) > 0.5) {
      heroImg.style.transform = `translateY(${translateY}px) scale(1.02)`;
      lastY = translateY;
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });

  // Transparent header toggle on scroll
  const header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (!header) return;
    const hero = document.querySelector('.hero');
    const y = window.scrollY || window.pageYOffset;
    const heroHeight = hero ? hero.getBoundingClientRect().height : 0;
    if (y > (heroHeight - 80)) {
      header.removeAttribute('aria-hidden');
      header.classList.add('scrolled');
    } else {
      header.setAttribute('aria-hidden', 'true');
      header.classList.remove('scrolled');
    }
  }
  onScrollHeader();
  document.addEventListener('scroll', onScrollHeader, { passive: true });

  // Side layered nav visibility and active sync
  const sideNav = document.querySelector('.side-nav');
  const sideLinks = qsa('.side-nav-link');
  function onScrollSideNav() {
    if (!sideNav) return;
    const y = window.scrollY || window.pageYOffset;
    // Show after 200px of scroll
    if (y > 200) sideNav.classList.add('visible');
    else sideNav.classList.remove('visible');
  }
  onScrollSideNav();
  document.addEventListener('scroll', onScrollSideNav, { passive: true });

  // Sync active state for side nav using IntersectionObserver
  const sideSpy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = qs(`.side-nav-link[href="#${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          sideLinks.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0.25 }
  );
  sections.forEach((sec) => sideSpy.observe(sec));

  // Lazy load non-critical images (safety if browser lacks native loading)
  if ('loading' in HTMLImageElement.prototype === false) {
    const lazyImgs = qsa('img[loading="lazy"]');
    const lazyObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img instanceof HTMLImageElement) {
            img.src = img.dataset.src || img.src;
            obs.unobserve(img);
          }
        }
      });
    });
    lazyImgs.forEach((img) => lazyObserver.observe(img));
  }

  // Contact form validation and status handling
  const form = qs('#contactForm');
  if (form) {
    const status = qs('.form-status', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formEl = e.currentTarget;
      if (!(formEl instanceof HTMLFormElement)) return;

      // Basic validation
      const name = qs('#name');
      const email = qs('#email');
      const goal = qs('#goal');
      const message = qs('#message');
      const consent = qs('#consent');

      const missing = [];
      if (!(name instanceof HTMLInputElement) || name.value.trim().length < 2) missing.push('Nafn');
      if (!(email instanceof HTMLInputElement) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) missing.push('Netfang');
      if (!(goal instanceof HTMLSelectElement) || !goal.value) missing.push('Markmið');
      if (!(message instanceof HTMLTextAreaElement) || message.value.trim().length < 10) missing.push('Skilaboð');
      if (!(consent instanceof HTMLInputElement) || !consent.checked) missing.push('Samþykki');

      if (missing.length) {
        if (status) status.textContent = `Vantar: ${missing.join(', ')}`;
        formEl.classList.add('error');
        return;
      }

      // Simulate submission
      if (status) status.textContent = 'Sendi…';
      try {
        await new Promise((res) => setTimeout(res, 900));
        if (status) status.textContent = 'Takk! Ég hef samband sem fyrst.';
        formEl.reset();
      } catch (err) {
        if (status) status.textContent = 'Villa kom upp. Reyndu aftur.';
      }
    });
  }

  // FAQ accordion
  // Ensure hidden attributes don't block animation; we'll control via CSS
  qsa('.faq-a[hidden]').forEach((el) => el.removeAttribute('hidden'));
  qsa('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // If opening this one, close others
      if (!expanded) {
        qsa('.faq-item.open').forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove('open');
            const openBtn = openItem.querySelector('.faq-q');
            if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
      btn.setAttribute('aria-expanded', String(!expanded));
      if (item) item.classList.toggle('open', !expanded);
    });
  });

  // Program expandable cards (click and keyboard)
  qsa('.program-expand').forEach((card) => {
    const body = qs('.program-body', card);
    if (!body) return;
    // start collapsed
    card.classList.remove('open');
    function toggle(exclusive = true) {
      const isOpen = card.classList.contains('open');
      if (isOpen) {
        // clicking again closes this card
        card.classList.remove('open');
        return;
      }
      if (exclusive) {
        qsa('.program-expand.open').forEach((c) => c.classList.remove('open'));
      }
      card.classList.add('open');
    }
    card.addEventListener('click', () => toggle(true));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(true);
      }
    });
  });

  // Instagram feed removed per request
})();


