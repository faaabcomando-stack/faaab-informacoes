(() => {
  'use strict';
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const closeMenu = () => { menu?.classList.remove('is-open'); toggle?.setAttribute('aria-expanded', 'false'); };
  toggle?.addEventListener('click', () => {
    const opened = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(opened));
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
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
    const duration = 6500;
    let entries;
    try {
      const response = await fetch('assets/visual-library.json?v=5', {cache: 'no-cache'});
      if (!response.ok) throw new Error('Catálogo indisponível');
      const catalog = await response.json();
      entries = Array.isArray(catalog.midias) ? catalog.midias : [];
    } catch (_error) {
      framesHost.innerHTML = '<div class="visual-fallback"></div>';
      if (subtitle) subtitle.textContent = 'Imagens indisponíveis';
      return;
    }
    if (!entries.length) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0;
    const frames = entries.map((entry,i) => {
      const frame = document.createElement('div');
      frame.className = 'visual-frame' + (i===0 ? ' is-active' : '');
      frame.setAttribute('aria-hidden', String(i!==0));
      frame.dataset.format = entry.formato;
      const image = document.createElement('img');
      image.src = reduce && entry.alternativa ? entry.alternativa : entry.arquivo;
      image.alt = '';
      image.decoding = 'async';
      image.loading = i < 2 ? 'eager' : 'lazy';
      image.addEventListener('error', () => {
        if(entry.alternativa && !image.dataset.fallback) {
          image.dataset.fallback = 'true';
          image.src = entry.alternativa;
          if(i === current && subtitle) subtitle.textContent = entry.titulo + ' · Foto real';
        } else {
          image.hidden = true;
          if(i === current && subtitle) subtitle.textContent = 'Mídia indisponível';
        }
      });
      frame.appendChild(image);
      framesHost.appendChild(frame);
      return frame;
    });
    function show(next) {
      current = (next + frames.length) % frames.length;
      frames.forEach((frame,i)=>{
        const active=i === current;
        frame.classList.toggle('is-active',active);
        frame.setAttribute('aria-hidden', String(!active));
      });
      if(forceName) forceName.textContent = entries[current].forca;
      if(subtitle) subtitle.textContent = entries[current].titulo + ' · ' + (entries[current].formato==='gif'?'GIF real':'Foto real');
    }
    show(0);
    if(!reduce && frames.length > 1) {
      const timer = setInterval(()=>{if(!document.hidden)show(current+1);},duration);
      window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
    }
  }

  function initNewsCarousel(carousel){
    const slides=[...carousel.querySelectorAll('[data-slide]')];
    const dots=[...carousel.querySelectorAll('[data-dot]')];
    if(slides.length<2)return;
    let current=0,progress=0,last=null,paused=false,manualPause=false;
    const duration=6500,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(to,automatic=false){
      current=((to%slides.length)+slides.length)%slides.length;
      slides.forEach((slide,i)=>{
        const active=i===current;slide.classList.toggle('is-active',active);
        slide.setAttribute('aria-hidden',String(!active));
        const link=slide.querySelector('a');if(link)link.tabIndex=active?0:-1;
      });
      dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===current)));
      if(automatic)progress=0;
    }
    carousel.querySelector('[data-prev]')?.addEventListener('click',()=>show(current-1));
    carousel.querySelector('[data-next]')?.addEventListener('click',()=>show(current+1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
    carousel.addEventListener('mouseenter',()=>{paused=true;});
    carousel.addEventListener('mouseleave',()=>{paused=false;});
    carousel.addEventListener('focusin',e=>{if(e.target.matches(':focus-visible'))paused=true;});
    carousel.addEventListener('focusout',e=>{if(!carousel.contains(e.relatedTarget))paused=false;});
    show(0);
    if(!reduced){
      function tick(time){
        if(last!==null&&!paused&&!manualPause&&!document.hidden){
          progress+=Math.min(Math.max(time-last,0),80);
          if(progress>=duration)show(current+1,true);
          dots.forEach((dot,i)=>dot.style.setProperty('--fill',i===current?(progress/duration*100)+'%':'0%'));
        }
        last=time;requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }
})();
