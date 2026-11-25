(() => {
  const root = document.documentElement;
  const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const revealNodes = [...document.querySelectorAll('[data-reveal]')];
  let revealObserver = null;

  const showAllMotionContent = () => {
    revealObserver?.disconnect();
    root.classList.remove('motion-ready');
    revealNodes.forEach((node) => node.classList.add('is-visible'));
  };

  if (motionPreference?.matches) {
    showAllMotionContent();
  } else if ('IntersectionObserver' in window && revealNodes.length) {
    const staggerGroups = ['.summary-grid', '.loop-list', '.library-grid', '.study-grid', '.paper-grid', '.team-grid'];
    staggerGroups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((group) => {
        [...group.children].forEach((item, index) => {
          item.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 70}ms`);
        });
      });
    });

    root.classList.add('motion-ready');
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });
    revealNodes.forEach((node) => revealObserver.observe(node));
  }

  motionPreference?.addEventListener?.('change', (event) => {
    if (event.matches) showAllMotionContent();
  });

  const themeButton = document.querySelector('#theme-toggle');
  const themeLabel = themeButton?.querySelector('.theme-label');
  const themeIcon = themeButton?.querySelector('.theme-icon');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const storageKey = 'cybershield-theme';
  const systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)');
  let savedTheme = null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'dark' || stored === 'light') savedTheme = stored;
  } catch (_) {
    // Theme switching remains available when browser storage is blocked.
  }

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(isDark));
      themeButton.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }
    if (themeLabel) themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
    if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
    if (themeMeta) themeMeta.content = isDark ? '#07121f' : '#f3f7fb';

    if (persist) {
      savedTheme = isDark ? 'dark' : 'light';
      try { localStorage.setItem(storageKey, savedTheme); } catch (_) {
        // The current page still changes theme even if saving a preference fails.
      }
    }
  };

  applyTheme(savedTheme || (systemTheme?.matches ? 'dark' : 'light'));
  themeButton?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  systemTheme?.addEventListener?.('change', (event) => {
    if (!savedTheme) applyTheme(event.matches ? 'dark' : 'light');
  });

  const menuButton = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const navLinks = [...document.querySelectorAll('.side-link')];

  const closeMenu = () => {
    if (!menuButton || !sidebar) return;
    sidebar.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open section navigation');
  };

  if (menuButton && sidebar) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      sidebar.classList.toggle('is-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close section navigation' : 'Open section navigation');
    });

    document.addEventListener('click', (event) => {
      if (!sidebar.classList.contains('is-open')) return;
      if (sidebar.contains(event.target) || menuButton.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const navSections = navLinks.map((link) => ({
    link,
    target: document.querySelector(link.getAttribute('href')),
  })).filter((item) => item.target);

  const setActiveLink = (activeLink) => {
    navLinks.forEach((link) => {
      const active = link === activeLink;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  let scrollQueued = false;
  const updateActiveSection = () => {
    scrollQueued = false;
    if (!navSections.length) return;
    const marker = window.scrollY + Math.min(window.innerHeight * 0.35, 220) + 68;
    let current = navSections[0];
    navSections.forEach((item) => {
      const top = item.target.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = item;
    });
    setActiveLink(current.link);
  };

  const queueActiveSectionUpdate = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateActiveSection);
  };

  if (navSections.length) {
    window.addEventListener('scroll', queueActiveSectionUpdate, { passive: true });
    window.addEventListener('resize', queueActiveSectionUpdate, { passive: true });
    window.addEventListener('hashchange', queueActiveSectionUpdate);
    queueActiveSectionUpdate();
  }

  navLinks.forEach((link) => link.addEventListener('click', closeMenu));
})();
