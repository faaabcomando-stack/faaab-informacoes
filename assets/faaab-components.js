
/* Shared progressive enhancement; the HTML remains useful without JavaScript. */
(()=>{
  'use strict';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  document.querySelectorAll('[data-faaab-filter-group]').forEach(group=>{
    const controls=[...group.querySelectorAll('[data-filter-name]')];
    const target=group.getAttribute('data-target');
    const cards=[...document.querySelectorAll(target || '[data-faaab-card]')];
    const status=group.parentElement.querySelector('[data-faaab-filter-status]')||document.querySelector('[data-faaab-filter-status]');
    const empty=group.parentElement.querySelector('[data-faaab-filter-empty]')||document.querySelector('[data-faaab-filter-empty]');
    const apply=()=>{
      let visible=0;
      for(const card of cards){
        const okay=controls.every(c=>{
          const wanted=norm(c.value).trim();
          if(!wanted||wanted==='todos')return true;
          const field=c.dataset.filterName;
          const current=norm(card.getAttribute('data-'+field)||card.textContent);
          return current.includes(wanted);
        });
        card.hidden=!okay;
        if(okay)visible++;
      }
      if(status)status.textContent=visible+' resultado'+(visible===1?'':'s')+' encontrado'+(visible===1?'':'s');
      if(empty)empty.hidden=visible!==0;
    };
    controls.forEach(c=>c.addEventListener(c.tagName==='INPUT'?'input':'change',apply));
    apply();
  });
  const credits=document.querySelector('[data-credits-filter]');
  if(credits){
    const list=document.querySelector('.credits-list');
    const select=credits.querySelector('select');
    const counter=credits.querySelector('[data-credits-count]');
    const classify=s=>{
      if(/Pol[ií]cia Militar/i.test(s))return 'pm';
      if(/Bombeiros/i.test(s))return 'cbm';
      if(/Marinha|Naval/i.test(s))return 'mb';
      if(/Aeron[aá]utica|For[cç]a A[eé]rea|FAB/i.test(s))return 'fab';
      if(/Ex[eé]rcito|Terrestre/i.test(s))return 'eb';
      return 'geral';
    };
    const items=[...(list?.querySelectorAll('li')||[])];
    items.forEach(li=>li.dataset.force=classify(li.textContent));
    const apply=()=>{
      let n=0;
      for(const li of items){
        const show=select.value==='todos'||li.dataset.force===select.value;
        li.hidden=!show;if(show)n++;
      }
      counter.textContent=n+' crédito'+(n===1?'':'s')+' exibido'+(n===1?'':'s');
    };
    select?.addEventListener('change',apply);
    apply();
  }
  const article=document.querySelector('[data-faaab-article]');
  if(article){
    const params=new URLSearchParams(window.location.search);
    const id=params.get('id');
    const status=article.querySelector('[data-article-status]');
    if(!id){status.textContent='Matéria não cadastrada. Nenhuma publicação fictícia foi criada.';return;}
    fetch('../assets/publicacoes-data.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Sem catálogo');return r.json()}).then(data=>{
      const item=data.find(x=>x.id===id);
      if(!item){status.textContent='Matéria não encontrada.';return;}
      const h=article.querySelector('[data-article-title]');
      const date=article.querySelector('[data-article-date]');
      const force=article.querySelector('[data-article-force]');
      const kind=article.querySelector('[data-article-type]');
      const body=article.querySelector('[data-article-content]');
      const cover=article.querySelector('[data-article-cover]');
      const back=article.querySelector('[data-article-back]');
      const allowed={eb:['Exército Brasileiro','../exercito/noticias.html'],fab:['Força Aérea Brasileira','../aeronautica/noticias.html'],mb:['Marinha Brasileira','../marinha/noticias.html'],pm:['Polícia Militar','../policia-militar/noticias.html'],cbm:['Corpo de Bombeiros Militar','../bombeiros/noticias.html']};
      const f=allowed[item.forca];
      if(!f||item.status!=='publicado'||!item.titulo||!item.data||!['publicacao','comunicado'].includes(item.tipo))throw Error('Registro incompleto');
      const parsedDate=new Date(item.data+'T12:00:00Z');
      if(Number.isNaN(parsedDate.getTime()))throw Error('Data inválida');
      date.dateTime=item.data;date.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',day:'2-digit',month:'long',year:'numeric'}).format(parsedDate);
      h.textContent=item.titulo;force.textContent=f[0];kind.textContent=item.tipo==='comunicado'?'Comunicado':'Publicação';
      body.textContent=item.texto||'';back.href=f[1];back.textContent='Voltar às notícias de '+f[0];
      if(item.imagem && item.credito && /^(https?:\/\/|assets\/)/.test(item.imagem)){
        const fig=document.createElement('figure');
        const img=document.createElement('img');img.src=item.imagem.startsWith('assets/')?'../'+item.imagem:item.imagem;
        img.alt=item.alt||'';img.loading='lazy';fig.append(img);
        const caption=document.createElement('figcaption');caption.className='fx-news-caption';caption.textContent=item.credito;
        fig.append(caption);cover.append(fig);
      }
      status.textContent='';
      article.querySelector('[data-article-details]').hidden=false;
    }).catch(()=>{status.textContent='Não foi possível carregar esta matéria. Tente novamente.';});
  }
})();
