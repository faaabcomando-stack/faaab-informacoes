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
    const progressHost = host.querySelector('[data-visual-progress]');
    const forceName = host.querySelector('[data-visual-force]');
    const subtitle = host.querySelector('[data-visual-subtitle]');
    const previous = host.querySelector('[data-visual-prev]');
    const next = host.querySelector('[data-visual-next]');
    const pauseButton = host.querySelector('[data-visual-pause]');
    const duration = 6500;
    let data;
    try {
      const r = await fetch('assets/visual-library.json?v=3', {cache:'no-cache'});
      if (!r.ok) throw Error('Não foi possível carregar o catálogo');
      data = await r.json();
    } catch(err) {
      framesHost.innerHTML = '<div class="visual-fallback"></div>';
      subtitle.textContent = 'Referências visuais indisponíveis';
      return;
    }
    const entries = data.midias || [];
    if (!entries.length) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0;
    let progress = 0;
    let last = null;
    let manualPause = reducedMotion;
    let pointerInside = false;
    let keyboardInside = false;
    const panels = entries.map((entry,i) => {
      const frame = document.createElement('div');
      frame.className = 'visual-frame' + (i===0?' is-active':'');
      frame.setAttribute('aria-hidden', String(i!==0));
      frame.dataset.format = entry.formato;
      // Fallback do CSS permanece se a mídia remota for bloqueada ou estiver indisponível.
      const image = document.createElement('img');
      image.src = reducedMotion && entry.alternativa ? entry.alternativa : entry.arquivo;
      image.alt = '';
      image.decoding = 'async';
      image.loading = i<2 ? 'eager' : 'lazy';
      image.addEventListener('error', () => {
        if(entry.alternativa && !image.dataset.fallback) {
          image.dataset.fallback = 'true'; image.src = entry.alternativa;
          credit.textContent = 'Imagem fornecida pelo usuário (fotografia estática)';
          if (i===index) subtitle.textContent = entry.titulo + ' · Foto real';
        } else {image.hidden=true;frame.classList.add('media-unavailable');if(i===index)subtitle.textContent='Mídia indisponível no momento';}
      });
      frame.appendChild(image);
      const credit = document.createElement('span');credit.className='visual-image-credit';credit.textContent=entry.credit;
      frame.appendChild(credit);
      framesHost.appendChild(frame);
      return frame;
    });
    const dots = entries.map((entry,i) => {
      const button = document.createElement('button');
      button.type='button'; button.className='visual-dot';
      button.setAttribute('aria-label','Mostrar cena de '+entry.forca+': '+entry.titulo);
      button.setAttribute('aria-current',String(i===0));
      button.addEventListener('click',()=>show(i,false));
      progressHost.appendChild(button);
      return button;
    });
    function show(target, automatic=false) {
      index = ((target%entries.length)+entries.length)%entries.length;
      const entry = entries[index];
      panels.forEach((panel,i)=>{
        const active=i===index;
        panel.classList.toggle('is-active',active);
        panel.setAttribute('aria-hidden',String(!active));
      });
      dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));
      forceName.textContent = entry.forca;
      subtitle.textContent=entry.titulo + ' · ' + (entry.formato==='gif'?'GIF real':'Foto real');
      // Preserve o tempo do carrossel quando uma seta é clicada.
      // A rotação natural, sim, inicia o tempo do próximo item.
      if(automatic) progress=0;
      renderProgress();
    }
    function renderProgress(){
      for(let i=0;i<dots.length;i++) {
        const amount=i===index?Math.min(100,progress/duration*100):0;
        dots[i].style.setProperty('--fill', amount+'%');
      }
    }
    previous.addEventListener('click',()=>show(index-1));
    next.addEventListener('click',()=>show(index+1));
    function refreshPause(){
      pauseButton.textContent = manualPause ? '▶' : 'Ⅱ';
      pauseButton.setAttribute('aria-pressed',String(manualPause));
      pauseButton.setAttribute('aria-label',manualPause?'Retomar apresentação':'Pausar apresentação');
      pauseButton.title=manualPause?'Retomar apresentação':'Pausar apresentação';
    }
    pauseButton.addEventListener('click',()=>{manualPause=!manualPause;refreshPause();});
    host.addEventListener('pointerenter',()=>{pointerInside=true;});
    host.addEventListener('pointerleave',()=>{pointerInside=false;});
    host.addEventListener('focusin',e=>{if(e.target.matches(':focus-visible'))keyboardInside=true;});
    host.addEventListener('focusout',e=>{if(!host.contains(e.relatedTarget))keyboardInside=false;});
    host.addEventListener('keydown',event=>{
      if(event.target.closest('button') && ['ArrowRight','ArrowLeft'].includes(event.key)) {
        event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));
      }
    });
    // Evita que o foco visual da seta permaneça depois de um clique de mouse.
    host.querySelectorAll('.visual-control').forEach(btn=>btn.addEventListener('pointerup',()=>{
      if(btn.matches(':focus:not(:focus-visible)'))btn.blur();
    }));
    refreshPause();show(0);
    function tick(time){
      if(last !== null){
        const elapsed=Math.min(Math.max(time-last,0),80);
        if(!manualPause&&!pointerInside&&!keyboardInside&&!document.hidden){
          progress+=elapsed;
          if(progress>=duration)show(index+1,true);
          else renderProgress();
        }
      }
      last=time;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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
