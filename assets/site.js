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
    const previous = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    if(slides.length < 2) return;
    const duration = 6500;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0, elapsed = 0, lastFrame = 0, hovering = false, focused = false;
    function paint() {
      dots.forEach((dot,i) => {
        const active = i === current;
        const degrees = active ? Math.min(360, 360 * elapsed / duration) : 0;
        dot.style.background = active
          ? 'conic-gradient(#ffffff ' + degrees + 'deg, rgba(255,255,255,.27) ' + degrees + 'deg)'
          : 'rgba(255,255,255,.27)';
      });
    }
    function show(target) {
      current = (target + slides.length) % slides.length;
      elapsed = 0;
      slides.forEach((slide,i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        const link=slide.querySelector('a');
        if(link) link.tabIndex = active ? 0 : -1;
      });
      dots.forEach((dot,i) => {
        dot.setAttribute('aria-current', String(i === current));
        dot.setAttribute('aria-label', 'Mostrar notícia ' + (i+1));
      });
      paint();
    }
    previous?.addEventListener('click', () => show(current-1));
    next?.addEventListener('click', () => show(current+1));
    dots.forEach((dot,i) => dot.addEventListener('click', () => show(i)));
    carousel.addEventListener('mouseenter', () => {hovering=true;});
    carousel.addEventListener('mouseleave', () => {hovering=false;});
    carousel.addEventListener('focusin', () => {focused=true;});
    carousel.addEventListener('focusout', ev => {if(!carousel.contains(ev.relatedTarget))focused=false;});
    show(0);
    if(!reduced){
      function tick(t){
        if(lastFrame){
          const delta = Math.min(t-lastFrame,100);
          if(!hovering&&!focused&&!document.hidden){
            elapsed+=delta;
            if(elapsed>=duration) show(current+1);
            paint();
          }
        }
        lastFrame=t;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  });
})();
