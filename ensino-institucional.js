"use strict";
/* FAAAB — portais individuais de ensino, notícias por instituição, sem permissões simuladas. */
(()=>{
 const $=id=>document.getElementById(id);
 const page=document.body.dataset.portal||"",group=document.body.dataset.dir||"";
 const dirs={FTB:{title:"DECEx — Escolas Militares",short:"DECEx",url:"decex.html",force:"Exército",forceUrl:"exercito.html",desc:"Formação, aperfeiçoamento e educação especializada do Exército da FAAAB. Cada escola tem seus próprios cursos e comunicados."},FMB:{title:"Ensino da Marinha",short:"Ensino Naval",url:"ensino-marinha.html",force:"Marinha",forceUrl:"marinha.html",desc:"Escolas de formação e centros navais, com a SSPM para administrar seleções. O Corpo de Fuzileiros Navais possui seleção própria."},FAB:{title:"Ensino da Aeronáutica",short:"Ensino FAB",url:"ensino-fab.html",force:"Aeronáutica",forceUrl:"aeronautica.html",desc:"Instituições de ensino da FAB. A UNIFA organiza o portal acadêmico da FAAAB para ECEMAR e EAOAR."}};
 const node=(name,cls,text)=>{const x=document.createElement(name);if(cls)x.className=cls;if(text!=null)x.textContent=String(text);return x};
 const link=(href,text,cls)=>{const e=node("a",cls,text);e.href=href;return e};
 const allowedUrl=s=>{try{const u=new URL(s);return u.protocol==="https:"?u.href:null}catch{return null}};
 const pageId=id=>/^[a-z0-9-]{1,35}$/.test(id);
 const appendNews=(all,site,section)=>{
  const host=$("news-list");if(!host)return;host.replaceChildren();
  let news=all.filter(n=>n&&typeof n.titulo==="string"&&typeof n.resumo==="string"&&(
   site?String(n.instituicao||n.unidade||"").toLowerCase()===site:
    (n.setor===(section==="FTB"?"exercito":section==="FMB"?"marinha":"fab")&&n.nivel==="diretoria")));
  news.sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));
  if(!news.length){const c=node("div","news-empty news-empty-art"),img=node("img");img.src="assets/sem-noticia-bloqueio.svg";img.alt="Noticiário sem publicação";img.width=75;img.height=75;const desc=node("div");desc.append(node("h3",null,"Sem notícia"),node("p",null,"Nenhuma publicação desta instituição no momento."));c.append(img,desc);host.append(c);return}
  for(const n of news.slice(0,8)){
   const a=node("article","story");
   a.append(node("span","meta",(n.categoria||"Notícia")+" · "+(n.data||"")),node("h3",null,n.titulo),node("p",null,n.resumo));
   a.append(link("noticia.html?id="+encodeURIComponent(n.id||""),"Ler matéria completa ↗","source"));host.append(a)}
 };
 const renderCards=(items,target,emptyText)=>{
  const host=$(target);if(!host)return;host.replaceChildren();
  if(!items.length){host.append(node("p","news-empty",emptyText||"Nenhuma escola cadastrada."));return}
  for(const item of items){
   const c=node("article","card");
   if(item.estado==="futuro_condicional")c.append(node("span","eyebrow","Proposta para o futuro"));
   else c.append(node("span","eyebrow",item.tipo||"Instituição"));
   c.append(node("h3",null,item.sigla+" · "+item.nome),node("p",null,item.resumo));
   c.append(link(item.id+".html","Acessar portal ↗","foot-link"));host.append(c)
  }
 };
 const renderSite=(item,all,news)=>{
  document.body.dataset.force=item.grupo;
  document.title=item.nome+" | FAAAB";$("site-name").textContent=item.nome;$("site-small").textContent=item.sigla+" · "+item.tipo;
  $("hero-title").textContent=item.nome;$("hero-desc").textContent=item.resumo;
  $("intro-title").textContent=item.tipo;$("real-desc").textContent=item.real;
  $("game-desc").textContent=item.jogo;
  const d=dirs[item.grupo];
  $("nav-force").href=d.forceUrl;$("nav-force").textContent=d.force;
  $("nav-directory").href=d.url;$("nav-directory").textContent=d.short;
  const source=$("source"),url=allowedUrl(item.fonte);
  if(url){source.href=url;source.hidden=false}else source.hidden=true;
  const test=$("exam-link");test.href="provas-faaab.html?instituicao="+encodeURIComponent(item.id);
  if(item.id==="unifa"){test.textContent="Consultar cursos e avaliações ↗";$("exam-note").textContent="A UNIFA não é uma seleção única. Consulte a ECEMAR e a EAOAR para verificar provas ou requisitos específicos."}
  else $("exam-note").textContent="Sem inscrições oficiais abertas. A elegibilidade real exige validação de patente e grupo pelo backend.";
  $("themes").replaceChildren();
  for(const t of item.noticias||[])$("themes").append(node("span","chip",t));
  const sub=all.filter(x=>(item.subunidades||[]).includes(x.id));
  const subsec=$("sub-section");subsec.hidden=!sub.length;if(sub.length)renderCards(sub,"subunit-list");
  if(item.id==="unifa"){$("special-note").hidden=false;$("special-note").textContent="No universo FAAAB, UNIFA reúne os portais acadêmicos de ECEMAR e EAOAR. Na estrutura real atual, a DIRENS é responsável pelas escolas, que funcionam no campus da UNIFA."}
  if(item.estado==="congelado_para_revisao"||item.estado==="aguardando_progressao"){$("special-note").hidden=false;$("special-note").textContent=item.estado==="congelado_para_revisao"?"Projeto congelado para revisão: esta escola não aceita inscrições ou novos cursos no momento.":"Progressão ainda não homologada: esta escola não pode abrir etapas seletivas sem aprovação do comando."}
  if(item.id==="sspm"){$("special-note").hidden=false;$("special-note").textContent="A SSPM administra as seleções navais fictícias. As seleções dos Fuzileiros Navais permanecem separadas. Não concede patente ou matrícula automaticamente."}
  appendNews(news,item.id,null);
 };
 const renderDirectory=(group,all,news)=>{
  document.body.dataset.force=group;
  const d=dirs[group];document.title=d.title+" | FAAAB";
  $("site-name").textContent=d.title;$("site-small").textContent=d.force+" · Educação institucional";
  $("hero-title").textContent=d.title;$("hero-desc").textContent=d.desc;
  $("nav-force").href=d.forceUrl;$("nav-force").textContent=d.force;
  $("directory-note").textContent=group==="FTB"?"EsPCEx prepara, AMAN e ESA formam, EASA, EsAO e ECEME aperfeiçoam. EsACosAAe e ESFCEx não integram esta estrutura.":
    group==="FMB"?"SSPM faz seleções; EN, CN, CIAA, CIAW e EAM realizam formações. Seleções dos Fuzileiros Navais são distintas.":
    "UNIFA reúne academicamente os portais ECEMAR e EAOAR na FAAAB; na FAB real atual, a DIRENS figura como superior das escolas.";
  $("exam-link").href="provas-faaab.html?forca="+group;
  renderCards(all.filter(x=>x.grupo===group),"institution-list");
  appendNews(news,null,group)
 };
 async function start(){
  try{
   const [a,b]=await Promise.all([fetch("dados/ensino_instituicoes.json",{cache:"no-store"}),fetch("dados/noticias.json",{cache:"no-store"})]);
   if(!a.ok)throw Error("Catálogo de ensino indisponível");
   const raw=await a.json(),n=b.ok?await b.json():[];
   const all=Array.isArray(raw.instituicoes)?raw.instituicoes:[],news=Array.isArray(n)?n:[];
   if(page){if(!pageId(page))throw Error("Identificação inválida");const item=all.find(x=>x.id===page);if(!item)throw Error("Instituição não cadastrada");renderSite(item,all,news)}
   else if(dirs[group])renderDirectory(group,all,news);
   else throw Error("Página de ensino sem identificação.");
  }catch(err){$("hero-desc").textContent="Não foi possível carregar os dados desta página: "+err.message;
   const host=$("news-list");if(host){host.replaceChildren(node("div","news-empty","Notícias temporariamente indisponíveis."))}}
 }
 start();
})();