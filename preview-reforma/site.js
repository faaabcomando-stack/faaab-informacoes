"use strict";
/* FAAAB — componentes públicos. Dados do catálogo e noticiário nunca entram via innerHTML. */
(()=>{
const $=id=>document.getElementById(id);
const D="../dados/";
const AREAS={
 FTB:{title:"Exército Brasileiro",short:"Exército",klass:"eb",desc:"Divisões, brigadas, batalhões, centros e escolas do componente terrestre da FAAAB.",detail:"Organizações terrestres registradas no catálogo."},
 FMB:{title:"Marinha Brasileira",short:"Marinha",klass:"mb",desc:"Estruturas navais, unidades, escolas e o Corpo de Fuzileiros Navais.",detail:"Organizações navais e Fuzileiros registrados no catálogo."},
 FAB:{title:"Força Aérea Brasileira",short:"Aeronáutica",klass:"fab",desc:"Bases, esquadrões, grupos, academias e estruturas de formação aérea.",detail:"Organizações aéreas registradas no catálogo."},
 PM:{title:"Polícia Militar",short:"Polícia Militar",klass:"pm",desc:"Unidades de policiamento, formação e organizações da comunidade.",detail:"Unidades policiais registradas no catálogo."},
 CBM:{title:"Corpo de Bombeiros Militar",short:"Bombeiros",klass:"cbm",desc:"Grupamentos, cursos, unidades de resgate e atendimento de emergências.",detail:"Unidades do Corpo de Bombeiros registradas no catálogo."},
 ADM:{title:"Governo e Administração",short:"Governo",klass:"gov",desc:"Organizações de administração, governo, secretarias e serviços da FAAAB.",detail:"Órgãos e estruturas administrativas registrados no catálogo."}
};
const clean=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const el=(name,klass,text)=>{const e=document.createElement(name);if(klass)e.className=klass;if(text!==undefined)e.textContent=String(text);return e};
const url=(path)=>path;
const read=async file=>{const r=await fetch(D+file+".json",{cache:"no-store"});if(!r.ok)throw Error("Não foi possível carregar "+file);return r.json()};
const getDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||"")))return "Data não informada";const d=new Date(s+"T12:00:00");return Number.isNaN(d.getTime())?String(s):d.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})};
const category=n=>{const c=clean(n.categoria||n.prioridade||(n.destaque?"importante":"informativa"));return ["urgente","importante","informativa","menor_relevancia","anuncio"].includes(c)?c:"informativa"};
const label=n=>({urgente:"Urgente",importante:"Notícia importante",informativa:"Aviso geral",menor_relevancia:"Comunicado",anuncio:"Publicidade da comunidade"})[category(n)];
const articleUrl=index=>"noticia.html?item="+encodeURIComponent(index);
const validNews=data=>Array.isArray(data)?data.map((n,i)=>({n,i})).filter(x=>x.n&&typeof x.n.titulo==="string"&&x.n.titulo.trim()&&typeof x.n.resumo==="string"&&x.n.resumo.trim()).sort((a,b)=>String(b.n.data||"").localeCompare(String(a.n.data||""))):[];
function initMenu(){
 const toggle=$("menu-toggle"),links=$("navlinks");if(!toggle||!links)return;
 const set=open=>{links.classList.toggle("open",open);toggle.setAttribute("aria-expanded",String(open))};
 toggle.addEventListener("click",()=>set(!links.classList.contains("open")));
 links.addEventListener("click",e=>{if(e.target.closest("a"))set(false)});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&links.classList.contains("open")){set(false);toggle.focus()}});
 window.addEventListener("resize",()=>{if(innerWidth>720)set(false)});
}
async function initConfig(){
 try{
  const cfg=await read("portal_config");if(!cfg||typeof cfg!=="object")return;
  if($("site-tagline")&&typeof cfg.heroTitle==="string")$("site-tagline").textContent=cfg.heroTitle.slice(0,120);
  if($("site-intro")&&typeof cfg.heroDescription==="string")$("site-intro").textContent=cfg.heroDescription.slice(0,450);
  if(cfg.maintenanceEnabled&&cfg.maintenanceNotice&&$("maintenance")){$("maintenance").hidden=false;$("maintenance-text").textContent=String(cfg.maintenanceNotice).slice(0,250)}
 }catch(e){/* configuração pública opcional */}
}
async function initAuth(){
 const login=$("login-roblox"),panel=$("open-panel");if(!login)return;
 try{
  const cfg=await read("auth_public");if(!cfg||cfg.enabled!==true||!cfg.backendUrl)throw Error("OAuth ainda não configurado");
  const u=new URL(cfg.backendUrl);
  if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash)throw Error("Endereço OAuth inválido");
  login.href=u.origin+"/auth/roblox";login.title="Autenticar com a conta Roblox no servidor FAAAB";
  if(panel)panel.href=u.origin+"/painel-v2";
 }catch(e){login.title="Login Roblox em configuração. A página explica o status da integração.";login.href="../admin.html";if(panel)panel.href="../admin.html"}
}
function story(item,featured=false){
 const {n,i}=item;
 if(featured){
  const a=el("article","lead-story");
  const flag=el("span","flag",label(n)+" · "+getDate(n.data));
  const h=el("h2","",n.titulo),p=el("p","",n.resumo),link=el("a","story-link","Ler comunicado →");link.href=articleUrl(i);
  a.append(flag,h,p,link);return a;
 }
 const a=el("article","mini-story"),meta=el("span","meta",label(n)+" · "+getDate(n.data)),h=el("h3","",n.titulo),p=el("p","",n.resumo),link=el("a","","Ler mais →");
 link.href=articleUrl(i);a.append(meta,h,p,link);return a;
}
function notice(item){
 const {n,i}=item;const card=el("article","notice"+(category(n)==="anuncio"?" sponsored":""));
 const meta=el("span","meta",label(n)+" · "+getDate(n.data)),h=el("h3","",n.titulo),p=el("p","",n.resumo),a=el("a","","Ler publicação →");a.href=articleUrl(i);
 card.append(meta,h,p,a);return card;
}
function renderHomeNews(items){
 const important=items.filter(x=>["urgente","importante"].includes(category(x.n))).slice(0,3);
 const others=items.filter(x=>["informativa","menor_relevancia"].includes(category(x.n))).slice(0,4);
 const ads=items.filter(x=>category(x.n)==="anuncio").slice(0,2);
 const stage=$("important-news");
 if(stage&&important.length){
  stage.replaceChildren(story(important[0],true));
  const side=el("div","lead-side");
  important.slice(1).forEach(x=>side.append(story(x)));
  if(important.length===1){const placeholder=el("article","mini-story");placeholder.append(el("span","meta","Informação organizada"),el("h3","","Acompanhe as atualizações da comunidade"),el("p","","Comunicados de rotina estão separados das notícias importantes."));const link=el("a","","Ver avisos gerais →");link.href="#avisos";placeholder.append(link);side.append(placeholder)}
  if(important.length===2){const placeholder=el("article","mini-story");placeholder.append(el("span","meta","Acervo"),el("h3","","Mais notícias e comunicados"),el("p","","Todas as publicações disponíveis podem ser consultadas no arquivo."));const link=el("a","","Acessar arquivo →");link.href="noticias.html";placeholder.append(link);side.append(placeholder)}
  stage.append(side);
 }
 const notices=$("general-news");if(notices){notices.replaceChildren();if(others.length)others.forEach(x=>notices.append(notice(x)));else notices.append(el("div","empty-state","Nenhum aviso geral publicado. As atualizações aparecerão aqui após a publicação pela equipe."))}
 const adArea=$("ads-section"),adsContainer=$("sponsored-news");
 if(adArea&&adsContainer){adArea.hidden=!ads.length;adsContainer.replaceChildren();ads.forEach(x=>adsContainer.append(notice(x)))}
 const urgent=items.find(x=>category(x.n)==="urgente");
 const ticker=$("breaking");if(ticker&&urgent){ticker.hidden=false;const link=$("breaking-link");link.textContent=urgent.n.titulo;link.href=articleUrl(urgent.i)}
}
function record(item){
 const article=el("article","record");const code=el("span","record-code",item.sigla||item.id||"FAAAB");
 const body=el("div","record-body"),title=el("strong","",item.nome||"Organização"),sub=el("small","",(item.tipo||"Estrutura")+" · "+(item.estadoImplementacao||"Situação não confirmada"));
 body.append(title,sub);const link=el("a","","↗");link.href="../ficha.html?id="+encodeURIComponent(item.id);link.setAttribute("aria-label","Abrir ficha de "+(item.nome||item.id));
 article.append(code,body,link);return article;
}
function renderHomeDirectory(data){
 const q=$("q"),sel=$("area-select"),target=$("results"),count=$("result-count"),more=$("more-results");
 if(!q||!sel||!target)return;
 const items=Array.isArray(data)?data.filter(x=>x&&x.id&&x.nome):[];let limit=7;
 function draw(){
  const query=clean(q.value.trim()),area=sel.value;
  const filtered=items.filter(x=>(!area||x.forca===area)&&(!query||clean([x.sigla,x.nome,x.tipo,x.secao].join(" ")).includes(query)));
  target.replaceChildren();
  if(!items.length)target.append(el("p","empty-state","O catálogo não pôde ser carregado."));
  else if(!filtered.length)target.append(el("p","empty-state","Nenhum resultado. Tente outra sigla ou selecione outra área."));
  else filtered.slice(0,limit).forEach(x=>target.append(record(x)));
  count.textContent=filtered.length+" registro(s) encontrados · "+Math.min(limit,filtered.length)+" exibidos";
  more.hidden=limit>=filtered.length;more.disabled=!items.length;
 }
 q.addEventListener("input",()=>{limit=7;draw()});sel.addEventListener("change",()=>{limit=7;draw()});more.addEventListener("click",()=>{limit+=7;draw()});draw();
}
function navItem(n){
 const article=el("article","article-card"+(category(n.n)==="urgente"?" urgent":category(n.n)==="anuncio"?" advert":""));
 const stripe=el("div","stripe"),body=el("div","body");
 const meta=el("span","meta",label(n.n)+" · "+getDate(n.n.data)),h=el("h3","",n.n.titulo),p=el("p","",n.n.resumo);
 const a=el("a","","Ler publicação →");a.href=articleUrl(n.i);body.append(meta,h,p,a);article.append(stripe,body);return article;
}
function initArchive(items){
 const q=$("archive-q"),type=$("archive-type"),out=$("archive-results"),count=$("archive-count");if(!out||!q||!type)return;
 function draw(){
  const term=clean(q.value),c=type.value;
  const filtered=items.filter(x=>(!c||category(x.n)===c)&&(!term||clean([x.n.titulo,x.n.resumo].join(" ")).includes(term)));
  out.replaceChildren();filtered.forEach(x=>out.append(navItem(x)));if(!filtered.length)out.append(el("div","empty-state",items.length?"Nenhuma publicação encontrada com esses filtros.":"Ainda não existem publicações aprovadas no noticiário."));
  count.textContent=filtered.length+" publicação(ões) encontrada(s)";
 }
 q.addEventListener("input",draw);type.addEventListener("change",draw);draw();
}
function initDetail(items){
 const place=$("article-detail");if(!place)return;
 const raw=new URLSearchParams(location.search).get("item");
 const index=raw!==null&&/^\d+$/.test(raw)?Number(raw):-1;
 const item=items.find(x=>x.i===index);place.replaceChildren();
 if(!item){place.append(el("h1","","Publicação não encontrada"),el("p","","A notícia pode ter sido removida ou o endereço está incorreto."));const a=el("a","","Voltar ao arquivo →");a.href="noticias.html";place.append(a);document.title="Publicação não encontrada — FAAAB";return}
 const n=item.n;document.title=n.titulo+" — FAAAB";
 place.append(el("span","meta",label(n)+" · "+getDate(n.data)),el("h1","",n.titulo),el("p","",n.resumo));
 if(category(n)==="anuncio")place.append(el("p","","Conteúdo identificado como publicidade da comunidade FAAAB."));
 const a=el("a","","← Voltar às notícias");a.href="noticias.html";place.append(a);
}
function renderArea(data){
 const params=new URLSearchParams(location.search),key=params.get("sigla")||"FTB",a=AREAS[key]||AREAS.FTB,valid=AREAS[key]?key:"FTB";
 const title=$("area-title"),desc=$("area-desc"),seal=$("area-seal"),hero=$("area-hero");
 if(title)title.textContent=a.title;if(desc)desc.textContent=a.desc;
 document.title=a.title+" | FAAAB";if(hero)hero.classList.add(a.klass);
 if(seal){const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href","assets/simbolos.svg#"+valid);seal.replaceChildren(use)}
 if($("area-breadcrumb"))$("area-breadcrumb").textContent=a.short;
 const all=Array.isArray(data)?data.filter(x=>x&&x.id&&x.nome):[];
 const area=all.filter(x=>valid==="FMB"?["FMB","CFN"].includes(x.forca):valid==="ADM"?(x.forca==="ADM"):x.forca===valid);
 const count=$("unit-counter"),out=$("unit-list"),q=$("unit-q"),type=$("unit-type"),more=$("more-units");if(!out)return;
 const typeNames={instituicao:"Instituições",unidade:"Unidades",brigada:"Brigadas",divisao:"Divisões",batalhao:"Batalhões",centro:"Centros",escola:"Escolas",academia:"Academias",curso:"Cursos",subdivisao:"Subdivisões",administracao:"Administração"};
 const types=[...new Set(area.map(x=>x.tipo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
 if(type){types.forEach(v=>{const option=el("option","",typeNames[v]||v);option.value=v;type.append(option)})}
 let limit=18;
 function draw(){
  const term=clean(q?.value.trim()),t=type?.value||"";
  const filtered=area.filter(x=>(!t||x.tipo===t)&&(!term||clean([x.sigla,x.nome,x.secao,x.tipo].join(" ")).includes(term)));
  out.replaceChildren();
  if(!area.length)out.append(el("div","empty-state","Nenhum registro dessa área foi encontrado no catálogo atual."));
  else if(!filtered.length)out.append(el("div","empty-state","Nenhuma organização corresponde aos filtros."));
  else filtered.slice(0,limit).forEach(x=>{
   const card=el("article","entry"),tag=el("span","tag",(x.sigla||x.tipo||"Organização"));
   const h=el("h3","",x.nome),p=el("p","",(x.tipo||"Estrutura")+" · "+(x.estadoImplementacao||"Situação não confirmada"));
   const link=el("a","","Abrir ficha →");link.href="../ficha.html?id="+encodeURIComponent(x.id);
   card.append(tag,h,p,link);out.append(card);
  });
  if(count)count.textContent=filtered.length+" organizações encontradas · "+Math.min(limit,filtered.length)+" exibidas";
  if(more)more.hidden=limit>=filtered.length;
 }
 if(q)q.addEventListener("input",()=>{limit=18;draw()});
 if(type)type.addEventListener("change",()=>{limit=18;draw()});
 if(more)more.addEventListener("click",()=>{limit+=18;draw()});
 draw();
}
initMenu();initAuth();initConfig();
const page=document.body.dataset.page;
if(page==="home"||page==="archive"||page==="article"){
 read("noticias").then(data=>{const items=validNews(data);if(page==="home")renderHomeNews(items);if(page==="archive")initArchive(items);if(page==="article")initDetail(items)}).catch(()=>{
  if(page==="home"){$("news-state")?.replaceChildren(el("span","","Não foi possível atualizar o noticiário no momento."));}
  if(page==="archive")$("archive-results")?.replaceChildren(el("p","empty-state","Notícias indisponíveis. Tente novamente."));
  if(page==="article")$("article-detail")?.replaceChildren(el("p","empty-state","Não foi possível abrir a publicação."));
 });
}
if(page==="home")read("catalogo").then(renderHomeDirectory).catch(()=>renderHomeDirectory([]));
if(page==="area")read("catalogo").then(renderArea).catch(()=>renderArea([]));
})();