(() => {
  'use strict';
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const closeMenu = () => { menu?.classList.remove('is-open'); toggle?.setAttribute('aria-expanded', 'false'); };
  toggle?.addEventListener('click', () => {
    const opened = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(opened));
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeMenu(); });
  document.addEventListener('click', ev => { if (!ev.target.closest('.header')) closeMenu(); });

  const toast = document.querySelector('[data-toast]');
  let toastTimer;
  document.querySelectorAll('[data-news-test]').forEach(el => {
    el.addEventListener('click', event => {
      event.preventDefault();
      if (!toast) return;
      toast.textContent = 'Clique registrado. Sem notícia cadastrada.';
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    });
  });

  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    const dots = [...carousel.querySelectorAll('[data-dot]')];
    const prev = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    if (slides.length <= 1) return;
    let current = 0;
    let paused = false;
    const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function display(target) {
      current = (target + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        const link = slide.querySelector('a');
        if (link) link.tabIndex = active ? 0 : -1;
      });
      dots.forEach((dot, i) => {
        dot.setAttribute('aria-current', String(i === current));
        dot.setAttribute('aria-label', `Mostrar destaque ${i + 1}`);
      });
    }
    prev?.addEventListener('click', () => display(current - 1));
    next?.addEventListener('click', () => display(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => display(i)));
    carousel.addEventListener('mouseenter', () => { paused = true; });
    carousel.addEventListener('mouseleave', () => { paused = false; });
    carousel.addEventListener('focusin', () => { paused = true; });
    carousel.addEventListener('focusout', ev => { if (!carousel.contains(ev.relatedTarget)) paused = false; });
    display(0);
    if (!motionReduced) {
      window.setInterval(() => { if (!paused && !document.hidden) display(current + 1); }, 5800);
    }
  });
})();
