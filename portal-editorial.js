"use strict";
/* FAAAB — Renderizador editorial público. Textos via textContent; não publica nada. */
(()=> {
 const $=id=>document.getElementById(id);
 const state={posts:[],filter:"todas"};
 const sectionLabel={institucional:"Institucional",ensino:"Ensino e formação",exercito:"Exército",marinha:"Marinha",fab:"Aeronáutica",policia:"Segurança pública",governo:"Governo",comunidade:"Comunidade"};
 const theme={ensino:"ensino",exercito:"geral",marinha:"marinha",fab:"aviacao",policia:"geral",governo:"governo",comunidade:"geral",institucional:"geral"};
 const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const slug=s=>norm(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100);
 const isAd=x=>["publicidade","patrocinado","anuncio"].includes(norm(x?.categoria||x?.tipo));
 const safeUrl=s=>{try{const u=new URL(s);return u.protocol==="https:"?u.href:null}catch{return null}};
 const date=x=>{const s=String(x||"");if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return "Data não informada";const [y,m,d]=s.split("-").map(Number);return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,d,12)))};
 const a=(href,text,cls)=>{const link=document.createElement("a");link.href=href;link.textContent=text;if(cls)link.className=cls;return link};
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
 const linkPost=x=>"noticia.html?id="+encodeURIComponent(x.id||slug(x.titulo));
 const classification=x=>norm(x?.categoria||x?.prioridade||(x?.destaque===true?"importante":"informativa"));
 const caption=x=>sectionLabel[norm(x?.setor)]||x?.setor||"FAAAB";
 const meta=x=>caption(x)+" · "+date(x.data);
 const letter=x=>({exercito:"E",marinha:"M",fab:"A",governo:"G",policia:"P",ensino:"E",institucional:"F",comunidade:"C"})[norm(x.setor)]||"F";
 function mainStory(x){
  const card=el("article","lead-story");
  const media=el("div","lead-media");media.dataset.theme=theme[norm(x.setor)]||"geral";
  media.append(el("span","media-mark",classification(x)==="urgente"?"Urgente":classification(x)==="importante"?"Notícia importante":caption(x)),el("span","media-constellation",letter(x)),el("span","media-bottom","FAAAB  /  Comunicação institucional"));
  const copy=el("div","lead-copy"),tag=el("div","meta",meta(x)),h=el("h3"),p=el("p",null,x.resumo||""),read=a(linkPost(x),"Ler notícia completa ↗","read-more");
  h.append(a(linkPost(x),x.titulo));copy.append(tag,h,p,read);card.append(media,copy);return card
 }
 function sideStory(x){
  const card=el("article","side-story"),tag=el("div","meta",meta(x)),h=el("h3"),p=el("p",null,x.resumo||""),read=a(linkPost(x),"Ler notícia ↗","read-more");
  h.append(a(linkPost(x),x.titulo));card.append(tag,h,p,read);return card
 }
 function fallbackCard(){
  const card=el("article","side-story");card.append(el("div","meta","Diretório FAAAB"),el("h3",null,"Explore unidades, centros de ensino e carreiras"),el("p",null,"As informações das organizações estão disponíveis em suas páginas próprias."),a("instituicoes.html","Consultar unidades ↗","read-more"));return card
 }
 function leadRender(posts){
  const list=$("lead-news");list.replaceChildren();
  if(!posts.length){const c=el("article","lead-story"),media=el("div","lead-media"),content=el("div","lead-copy");media.append(el("span","media-mark","Central de Notícias"),el("span","media-constellation","F"),el("span","media-bottom","Aguardando novas publicações"));content.append(el("div","meta","Comunicados FAAAB"),el("h3",null,"As próximas notícias da FAAAB aparecerão aqui."),el("p",null,"O portal já está preparado para publicar notícias importantes, gerais e comunicados de unidades."),a("central.html#noticias","Acessar Central de Comunicação ↗","read-more"));c.append(media,content);list.append(c);const col=el("div","lead-side");col.append(fallbackCard());list.append(col);return}
  list.append(mainStory(posts[0]));
  const col=el("div","lead-side");for(const x of posts.slice(1,3))col.append(sideStory(x));for(let n=col.children.length;n<2;n++)col.append(fallbackCard());list.append(col)
 }
 function newsRow(x){
  const card=el("article","feed-row"),thumb=el("div","feed-thumb",letter(x)),copy=el("div"),tag=el("div","meta",meta(x)),h=el("h3"),p=el("p",null,x.resumo||"");
  thumb.dataset.theme=theme[norm(x.setor)]||"geral";thumb.setAttribute("aria-hidden","true");h.append(a(linkPost(x),x.titulo));copy.append(tag,h,p);card.append(thumb,copy);return card
 }
 function sponsored(x){
  const card=el("article","sponsored-item"),tag=el("span","label","Publicidade · Conteúdo patrocinado"),h=el("h3",null,x.titulo||"Conteúdo patrocinado"),p=el("p",null,x.resumo||"");
  card.append(tag,h,p);
  if(x.patrocinador)card.append(el("small","sponsor-name","Anunciante: "+x.patrocinador));
  const href=safeUrl(x.url||x.destino);
  if(href){const link=a(href,"Conhecer o anunciante ↗");link.target="_blank";link.rel="sponsored noopener noreferrer";card.append(link)}
  return card
 }
 function renderFeed(){
  const list=$("news-feed");list.replaceChildren();
  const posts=state.posts.filter(x=>!isAd(x)),ads=state.posts.filter(isAd);
  let filter=state.filter;
  let feed=filter==="todas"?posts.slice(3):posts.filter(x=>norm(x.setor)===filter);
  if(filter==="publicidade"){feed=[];if(ads.length){ads.forEach(x=>list.append(sponsored(x)));return}list.append(sponsored({titulo:"Nenhum anúncio patrocinado publicado",resumo:"Espaço reservado a parceiros aprovados. Conteúdo comercial só aparece após identificação do anunciante."}));return}
  if(filter==="todas"&&feed.length===0&&posts.length>0){list.append(el("div","feed-empty","Todas as publicações recentes estão nas manchetes acima."))}
  else if(!feed.length){list.append(el("div","feed-empty",posts.length?"Nenhuma publicação nessa categoria.":"Não há notícias publicadas ainda."))}
  feed.forEach((p,i)=>{list.append(newsRow(p));if(filter==="todas"&&i===0){if(ads[0])list.append(sponsored(ads[0]));else list.append(sponsored({titulo:"Seu projeto pode aparecer aqui",resumo:"Espaço de divulgação disponível para projetos e parceiros aprovados da FAAAB."}))}});
  if(filter==="todas"&&feed.length===0&&!ads.length){list.append(sponsored({titulo:"Espaço para divulgação",resumo:"Quando houver publicidade aprovada, os anúncios serão identificados e separados do conteúdo jornalístico."}))}
 }
 function renderTicker(){
  const u=state.posts.filter(x=>!isAd(x)&&classification(x)==="urgente");
  if(u.length){$("urgent-title").textContent=u[0].titulo;$("urgent-title").href=linkPost(u[0]);$("urgent-bar").hidden=false}
 }
 function renderSideAd(){
  const ads=state.posts.filter(isAd),slot=$("sidebar-ad");
  if(!slot)return;
  if(!ads.length)return;
  slot.replaceChildren(el("span","ad-label","Publicidade · Conteúdo patrocinado"));
  const x=ads[0],title=el("h3",null,x.titulo||"Anúncio"),txt=el("p",null,x.resumo||"");slot.append(title,txt);
  if(x.patrocinador)slot.append(el("p","sponsor-name","Anunciante: "+x.patrocinador));
  const href=safeUrl(x.url||x.destino);if(href){const link=a(href,"Visitar anunciante ↗");link.rel="sponsored noopener noreferrer";link.target="_blank";slot.append(link)}
 }
 function dateDisplay(){const e=$("today");if(e)e.textContent=new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date())}
 function setupNav(){
  const b=$("menu-toggle"),nav=$("nav-links");if(!b||!nav)return;b.addEventListener("click",()=>{const open=nav.classList.toggle("open");b.setAttribute("aria-expanded",String(open))});
  nav.addEventListener("click",ev=>{if(ev.target.closest("a")){nav.classList.remove("open");b.setAttribute("aria-expanded","false")}})
 }
 function bindFilters(){const group=$("filters");if(!group)return;group.addEventListener("click",ev=>{const button=ev.target.closest("button[data-filter]");if(!button)return;state.filter=button.dataset.filter;for(const b of group.querySelectorAll("button")){const active=b===button;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))}renderFeed()})}
 function setupLogin(){
  fetch("dados/auth_public.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(cfg=>{
   if(!cfg||!cfg.enabled||!cfg.backendUrl)return;
   let u;try{u=new URL(cfg.backendUrl)}catch{return}
   if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash)return;
   const b=$("login-link");if(b){b.href=u.origin+"/auth/roblox";b.setAttribute("title","Entrar com conta Roblox por autenticação oficial")}const s=$("login-status");if(s)s.textContent="Acesso autorizado";
  }).catch(()=>{})
 }
 async function load(){
  dateDisplay();setupNav();bindFilters();setupLogin();
  try{const r=await fetch("dados/noticias.json",{cache:"no-store"});if(!r.ok)throw Error("Arquivo não disponível");
  const raw=await r.json();if(!Array.isArray(raw))throw Error("Formato inválido");
  state.posts=raw.filter(x=>x&&typeof x.titulo==="string"&&typeof x.resumo==="string")
   .sort((a,b)=>{const p=x=>classification(x)==="urgente"?2:classification(x)==="importante"?1:0;return p(b)-p(a)||String(b.data||"").localeCompare(String(a.data||""))});
  const editorial=state.posts.filter(x=>!isAd(x));
  leadRender(editorial);renderFeed();renderTicker();renderSideAd();
  const counter=$("news-total");if(counter)counter.textContent=editorial.length+" publicação(ões)";
  }catch(err){leadRender([]);renderFeed();const status=$("news-total");if(status)status.textContent="Noticiário temporariamente indisponível"}
 }
 load()
})();
