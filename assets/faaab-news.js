/* Publicação editorial FAAAB. Só exibe itens com estado publicado. */
(()=>{
'use strict';
const central=document.querySelector('.publication-feature-grid');
const force=document.body.dataset.forceNews;
if(!central&&!force)return;
const source=central?'assets/publicacoes-data.json':'../assets/publicacoes-data.json';
const forceNames={eb:'Exército Brasileiro',mb:'Marinha Brasileira',fab:'Força Aérea Brasileira',cbm:'Corpo de Bombeiros Militar',pm:'Polícia Militar'};
const fmt=s=>new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(s+'T12:00:00Z'));
const valid=n=>n&&n.status==='publicado'&&/^[a-z0-9-]+$/.test(n.id||'')&&/^\d{4}-\d{2}-\d{2}$/.test(n.data||'')&&forceNames[n.forca]&&['publicacao','comunicado'].includes(n.tipo)&&typeof n.titulo==='string'&&n.titulo.trim().length>0;
const link=(id)=>central?'publicacoes/materia.html?id='+encodeURIComponent(id):'../publicacoes/materia.html?id='+encodeURIComponent(id);
function item(n,category=''){
 const a=document.createElement('a');a.href=link(n.id);a.className='fx-story '+category;
 a.setAttribute('aria-label','Abrir '+(n.tipo==='comunicado'?'comunicado':'publicação')+' '+n.titulo);
 if(n.imagem&&n.credito&&/^(https:\/\/|assets\/)/.test(n.imagem)){
   const photo=document.createElement('img');
   photo.alt=n.alt||'';photo.loading='lazy';photo.decoding='async';
   photo.src=n.imagem.startsWith('assets/')?(central?'':'../')+n.imagem:n.imagem;
   photo.className='fx-story-photo';a.append(photo);
 }
 const inner=document.createElement('div');inner.className='fx-story-text';
 const date=document.createElement('time');date.dateTime=n.data;date.textContent=fmt(n.data);inner.append(date);
 const meta=document.createElement('span');meta.className='fx-story-kind';
 meta.textContent=(n.tipo==='comunicado'?'Comunicado':'Publicação')+' · '+forceNames[n.forca];inner.append(meta);
 const h=document.createElement('strong');h.textContent=n.titulo;inner.append(h);
 if(n.credito){const caption=document.createElement('small');caption.className='fx-story-credit';caption.textContent='Imagem: '+n.credito;inner.append(caption);}
 a.append(inner);return a;
}
fetch(source,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Catálogo indisponível');return r.json()}).then(items=>{
 if(!Array.isArray(items))throw Error('Catálogo inválido');
 const news=items.filter(valid).sort((a,b)=>b.data.localeCompare(a.data));
 if(central){
   if(!news.length)return; // preserva os três espaços e o carrossel vazios
   const slots=[...central.querySelectorAll('.publication-slot')];
   news.slice(0,3).forEach((n,i)=>{
     if(!slots[i])return;
     const slot=slots[i];slot.removeAttribute('role');slot.removeAttribute('aria-label');slot.replaceChildren(item(n,'fx-story-feature'));
   });
   const rest=news.slice(3);
   if(!rest.length)return;
   const carousel=document.querySelector('.publication-carousel');
   const win=carousel?.querySelector('.publication-carousel-window');
   const prev=carousel?.querySelector('.publication-carousel-previous');
   const next=carousel?.querySelector('.publication-carousel-next');
   const dots=carousel?.querySelector('.publication-carousel-dots');
   if(!win||!carousel||!dots)return;
   const slides=rest.map(n=>item(n,'fx-story-carousel'));let index=0;
   const paint=()=>{
     win.replaceChildren(slides[index]);
     dots.replaceChildren(...slides.map((_,i)=>{
       const mark=document.createElement('span');
       mark.className=i===index?'is-selected':'';
       return mark;
     }));
     carousel.setAttribute('aria-label','Notícia '+(index+1)+' de '+slides.length);
   };
   prev.disabled=next.disabled=slides.length<=1;
   prev.addEventListener('click',()=>{index=(index+slides.length-1)%slides.length;paint()});
   next.addEventListener('click',()=>{index=(index+1)%slides.length;paint()});
   carousel.addEventListener('keydown',e=>{
     if(e.key==='ArrowLeft'&&!prev.disabled){e.preventDefault();prev.click();}
     if(e.key==='ArrowRight'&&!next.disabled){e.preventDefault();next.click();}
   });
   paint();
 }else{
   const matched=news.filter(n=>n.forca===force);
   if(!matched.length)return;
   const target=document.querySelector('.eb-news-empty')||document.querySelector('.section .empty');
   if(!target)return;
   const grid=document.createElement('div');grid.className='fx-force-articles';
   matched.forEach(n=>grid.append(item(n,'fx-story-force')));
   target.replaceWith(grid);
 }
}).catch(err=>{console.warn('Noticiário FAAAB: conteúdo não carregado.',err.message)});
})();