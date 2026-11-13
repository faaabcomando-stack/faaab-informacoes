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
    const creditLabel = host.querySelector('[data-visual-credit]');
    const duration = 6600;
    let entries;
    try {
      const response = await fetch('assets/visual-library.json?v=6', {cache:'no-cache'});
      if (!response.ok) throw Error('Catálogo indisponível');
      entries = (await response.json()).midias;
      if (!Array.isArray(entries)) throw Error('Catálogo inválido');
    } catch (err) {
      framesHost.innerHTML = '<div class="visual-fallback"></div>';
      if (subtitle) subtitle.textContent = 'Imagens indisponíveis';
      return;
    }
    if (!entries.length) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0, stopped = false;
    const slideRecords = entries.map((entry, i) => {
      const frame = document.createElement('div');
      frame.className = 'visual-frame' + (i===0 ? ' is-active' : '');
      frame.setAttribute('aria-hidden', String(i!==0));
      frame.dataset.format = entry.formato;
      const image = document.createElement('img');
      image.alt = '';
      image.decoding = 'async';
      image.loading = 'eager';
      image.fetchPriority = i===0 ? 'high' : 'low';
      frame.appendChild(image);
      framesHost.appendChild(frame);
      return {entry,frame,image,loadPromise:null,loaded:false,broken:false};
    });
    function load(index){
      const record = slideRecords[index];
      if(record.loadPromise) return record.loadPromise;
      const image=record.image;
      record.loadPromise=new Promise(resolve=>{
        const done=ok=>{record.loaded=ok; record.broken=!ok;resolve(ok);};
        image.addEventListener('load',()=>done(true),{once:true});
        image.addEventListener('error',()=>{
          if(record.entry.arquivo_reserva && !image.dataset.reserve){
            image.dataset.reserve='yes'; image.src=record.entry.arquivo_reserva;
          }else if(record.entry.alternativa && !image.dataset.alt){
            image.dataset.alt='yes';image.src=record.entry.alternativa;
          }else{done(false);}
        });
        image.src=reducedMotion && record.entry.alternativa ? record.entry.alternativa : record.entry.arquivo;
      });
      return record.loadPromise;
    }
    function caption(entry) {
      const location=entry.estado ? ' · '+entry.estado : '';
      if(forceName)forceName.textContent=entry.forca+location;
      if(subtitle)subtitle.textContent=entry.descricao || entry.titulo;
      if(creditLabel)creditLabel.textContent=entry.credito+(entry.formato==='gif'?' · GIF real':' · Foto real');
    }
    async function transitionTo(target){
      let index=(target+slideRecords.length)%slideRecords.length;
      for(let attempts=0;attempts<slideRecords.length;attempts++){
        const okay=await load(index);
        if (stopped) return;
        if(okay){
          current=index;
          slideRecords.forEach((r,i)=>{let visible=i===index;r.frame.classList.toggle('is-active',visible);r.frame.setAttribute('aria-hidden',String(!visible));});
          caption(slideRecords[index].entry);
          const next=(index+1)%slideRecords.length;
          load(next); // preload one image ahead to avoid an empty crossfade
          return;
        }
        index=(index+1)%slideRecords.length;
      }
      if(subtitle)subtitle.textContent='Imagens indisponíveis';
    }
    await transitionTo(0);
    if(!reducedMotion && slideRecords.length>1){
      const timer=window.setInterval(()=>{
        if(!document.hidden) transitionTo(current+1);
      },duration);
      window.addEventListener('pagehide',()=>{stopped=true;clearInterval(timer);},{once:true});
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
