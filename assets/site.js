(() => {
  'use strict';
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const closeMenu = (restoreFocus = false) => {
    const wasOpen = Boolean(menu?.classList.contains('is-open'));
    menu?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && wasOpen) toggle?.focus();
  };
  toggle?.addEventListener('click', () => {
    const opened = menu?.classList.toggle('is-open') ?? false;
    toggle.setAttribute('aria-expanded', String(opened));
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) closeMenu();
  });
  const desktopMenu = window.matchMedia('(min-width: 761px)');
  desktopMenu.addEventListener?.('change', event => {
    if (event.matches) closeMenu();
  });
  let toastTimer;
  function toast(message) {
    const el = document.querySelector('[data-toast]'); if(!el) return;
    el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  document.querySelectorAll('[data-campaign-test]').forEach(el => el.addEventListener('click', () => toast('Espaço reservado para divulgação.')));
  document.querySelectorAll('[data-news-test]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); toast('Clique registrado. Sem notícia cadastrada.'); }));

  // Mídias: componentes sem GIF disponível usam uma foto real, nunca uma animação falsificada.
  const host = document.querySelector('[data-visual-hero]');
  if (host) initVisualHero(host);

  // Carrossel de notícias na outra página (quando aplicável).
  document.querySelectorAll('[data-carousel]').forEach(initNewsCarousel);

  async function initVisualHero(host) {
    const framesHost = host.querySelector('[data-visual-frames]');
    const forceName = host.querySelector('[data-visual-force]');
    const subtitle = host.querySelector('[data-visual-subtitle]');
    const credit = host.querySelector('[data-visual-credit]');
    const next = host.querySelector('[data-visual-next]');
    const initial = framesHost?.querySelector('img');
    if (!next || !initial) return;

    let entries;
    try {
      const response = await fetch('assets/visual-library.json?v=6', {cache:'no-cache'});
      if (!response.ok) return;
      entries = (await response.json()).midias;
      if (!Array.isArray(entries)) return;
    } catch {
      return;
    }

    const forceLabels = { 'Marinha Brasileira': 'Marinha do Brasil' };
    const applyCaption = entry => {
      forceName.textContent = forceLabels[entry.forca] || entry.forca;
      subtitle.textContent = entry.titulo;
      credit.textContent = entry.credito || '';
    };
    const initialEntry = entries.find(entry => entry.arquivo === initial.getAttribute('src'));
    if (initialEntry) applyCaption(initialEntry);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const photoEntries = entries.filter(entry => entry.formato !== 'gif' || entry.alternativa);
    let displayed = initialEntry;
    next.hidden = !entries.length;
    next.addEventListener('click', async () => {
      if (next.getAttribute('aria-disabled') === 'true') return;
      const gallery = reduced.matches ? photoEntries : entries;
      const start = gallery.indexOf(displayed);
      next.setAttribute('aria-disabled', 'true');
      try {
        for (let offset = 1; offset <= gallery.length; offset++) {
          const entry = gallery[(start + offset) % gallery.length];
          if (entry === displayed) continue;
          const sources = reduced.matches && entry.formato === 'gif'
            ? [entry.alternativa] : [entry.arquivo, entry.arquivo_reserva, entry.alternativa];
          for (const source of sources.filter(Boolean)) {
            const image = new Image();
            image.alt = '';
            image.decoding = 'async';
            image.src = source;
            try {
              await image.decode();
            } catch {
              continue;
            }
            displayed = entry;
            const matchingImage = entries.find(item => item.arquivo === source);
            framesHost.replaceChildren(image);
            applyCaption(matchingImage || entry);
            return;
          }
        }
      } finally {
        next.removeAttribute('aria-disabled');
      }
    });
  }


  function initNewsCarousel(carousel){
    const slides=[...carousel.querySelectorAll('[data-slide]')];
    const dots=[...carousel.querySelectorAll('[data-dot]')];
    const previous=carousel.querySelector('[data-prev]');
    const next=carousel.querySelector('[data-next]');
    if(slides.length<2)return;
    const duration=6500;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current=0, elapsed=0, last=null, pointerInside=false, keyboardInside=false;
    function paint(){
      dots.forEach((dot,i)=>{
        const pct=i===current?Math.min(100,elapsed/duration*100):0;
        dot.style.background='linear-gradient(to right,#ffffff '+pct+'%,rgba(255,255,255,.27) '+pct+'%)';
      });
    }
    function show(target){
      current=(target+slides.length)%slides.length;
      elapsed=0;
      slides.forEach((slide,i)=>{
        const active=i===current;
        slide.classList.toggle('is-active',active);
        slide.setAttribute('aria-hidden',String(!active));
        const link=slide.querySelector('a');
        if(link)link.tabIndex=active?0:-1;
      });
      dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===current)));
      paint();
    }
    previous?.addEventListener('click',()=>show(current-1));
    next?.addEventListener('click',()=>show(current+1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
    carousel.addEventListener('pointerenter',()=>{pointerInside=true;});
    carousel.addEventListener('pointerleave',()=>{pointerInside=false;});
    carousel.addEventListener('focusin',e=>{if(e.target.matches(':focus-visible'))keyboardInside=true;});
    carousel.addEventListener('focusout',e=>{if(!carousel.contains(e.relatedTarget))keyboardInside=false;});
    carousel.querySelectorAll('.carousel-arrow').forEach(button=>
      button.addEventListener('pointerup',()=>{if(!button.matches(':focus-visible'))button.blur();})
    );
    show(0);
    if(!reduced){
      const frame=t=>{
        if(last!==null&&!pointerInside&&!keyboardInside&&!document.hidden){
          elapsed+=Math.min(Math.max(t-last,0),90);
          if(elapsed>=duration)show(current+1);else paint();
        }
        last=t;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  }

})();
