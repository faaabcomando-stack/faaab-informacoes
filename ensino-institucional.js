"use strict";
(()=>{const $=id=>document.getElementById(id),site=document.body.dataset.site,dir=document.body.dataset.dir,portal=document.body.dataset.portal;
 const E=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
 const A=(href,text,cls)=>{const a=E("a",cls,text);a.href=href;return a};
 const sectionName={FTB:"DECEx — Ensino do Exército",FMB:"Diretoria de Ensino da Marinha"};
 const dirUrl={FTB:"decex.html",FMB:"ensino-marinha.html"};
 const forceUrl={FTB:"exercito.html",FMB:"marinha.html"};
 const slug=id=>/^[a-z0-9-]{1,30}$/.test(id);
 const srcSafe=u=>{try{const x=new URL(u);return x.protocol==="https:"?x.href:null}catch{return null}};
 const nameNews=v=>v==="sspm"?"Seleções, editais e convocações":"Notícias e comunicados";
 function newsList(all,id,group){
   const box=$("news-list");box.replaceChildren();
   const list=all.filter(x=>x&&typeof x.titulo==="string"&&
    ((id&&String(x.instituicao||x.unidade||"").toLowerCase()===id)||
    (!id&&group&&x.setor===(group==="FTB"?"exercito":"marinha")&&x.nivel==="diretoria")));
   list.sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));
   if(!list.length){const holder=E("article","news-empty");holder.append(E("h3",null,"Nenhuma publicação desta instituição no momento."),E("p",null,"Quando a equipe publicar comunicados específicos, eles aparecerão aqui. Notícias gerais da FAAAB não são copiadas para esta página."));box.append(holder);return}
   for(const x of list.slice(0,6)){const article=E("article","story");article.append(E("span","meta",(x.categoria||"Informativa")+" · "+(x.data||"")),E("h3",null,x.titulo),E("p",null,x.resumo||""));const a=A("noticia.html?id="+encodeURIComponent(x.id||""),"Ler notícia completa ↗","source");article.append(a);box.append(article)}
 }
 function renderCards(items){
   const box=$("institution-list");box.replaceChildren();
   for(const x of items){const card=E("article","card"),tag=E("span","eyebrow",x.tipo||(x.formacao?"Formação":"Seleção")),h=E("h3",null,x.sigla+" — "+x.nome),p=E("p",null,x.resumo);
    const a=A(x.id+".html","Abrir portal da instituição ↗","foot-link");if(x.estado==="futuro_condicional")card.append(E("span","eyebrow","Proposta para expansão futura"));card.append(tag,h,p,a);box.append(card)}
 }
 function addScopes(list){const box=$("themes");box.replaceChildren();for(const value of list){box.append(E("span","chip",value))}}
 function apply(item,data){
   document.title=item.nome+" | FAAAB";
   $("site-name").textContent=item.nome;$("site-small").textContent=item.sigla+" · "+item.tipo;
   $("hero-title").textContent=item.nome;$("hero-desc").textContent=item.resumo;
   $("intro-title").textContent=item.foco||item.tipo;$("real-desc").textContent=item.real;$("game-desc").textContent=item.jogo;
   $("source").href=srcSafe(item.fonte)||"https://www.marinha.mil.br/ensino/";$("source").textContent="Consultar instituição de referência ↗";
   $("exam-link").href="provas.html?instituicao="+encodeURIComponent(item.id);
   $("nav-directory").href=dirUrl[item.grupo];$("nav-directory").textContent=sectionName[item.grupo];
   $("nav-force").href=forceUrl[item.grupo];$("nav-force").textContent=item.grupo==="FTB"?"Exército":"Marinha";
   $("local-news-name").textContent=nameNews(item.id);
   $("exam-status").textContent="Seleção FAAAB: aguardando edital e verificação de cargo/patente";
   addScopes(item.noticias||[]);newsList(data,item.id,null);
   if(item.id==="sspm"){$("custom").hidden=false;$("custom").textContent="A SSPM organiza as seleções navais do universo FAAAB. O Corpo de Fuzileiros Navais mantém sua própria estrutura de recrutamento. A entrada em escolas e cursos depende de edital autorizado, vagas e requisitos de patente, nunca do simples clique no site.";}
 }
 function applyDirectory(all,group,news){
   const list=all.filter(x=>x.grupo===group),isMB=group==="FMB";
   document.title=(isMB?"Ensino da Marinha":"DECEx — Escolas Militares")+" | FAAAB";
   $("site-name").textContent=isMB?"Diretoria de Ensino da Marinha":"Departamento de Educação e Cultura do Exército";
   $("site-small").textContent=isMB?"Ensino naval · FAAAB":"DECEx · FAAAB";
   $("hero-title").textContent=isMB?"Ensino naval e seleções":"DECEx — Escolas Militares";
   $("hero-desc").textContent=isMB?"Conheça as instituições responsáveis pela formação naval, o aperfeiçoamento profissional e a SSPM, responsável pelas seleções.":"Escolas e academias com funções próprias na formação e no aperfeiçoamento da carreira militar fictícia.";
   $("nav-force").href=forceUrl[group];$("nav-force").textContent=isMB?"Marinha":"Exército";
   $("source").href=isMB?"https://www.marinha.mil.br/ensino/":"https://www.decex.eb.mil.br/";
   $("source").textContent="Portal de referência oficial ↗";
   $("roles-desc").textContent=isMB?"SSPM é serviço de seleção. CIAA, CIAW, EN, CN e EAM oferecem formações distintas; os processos dos Fuzileiros Navais permanecem separados.":"EsPCEx prepara, AMAN e ESA formam; EASA, EsAO e ECEME aperfeiçoam. As escolas são diferentes e seus regulamentos FAAAB serão próprios.";
   $("exam-link").href="provas.html"+(isMB?"?forca=FMB":"?forca=FTB");
   renderCards(list);newsList(news,null,group);
 }
 async function init(){
  try{
   const [r,n]=await Promise.all([fetch("dados/ensino_instituicoes.json",{cache:"no-store"}),fetch("dados/noticias.json",{cache:"no-store"})]);if(!r.ok)throw Error("Dados institucionais indisponíveis");
   const data=await r.json(),news=n.ok?await n.json():[];
   const all=Array.isArray(data.instituicoes)?data.instituicoes:[],item=all.find(x=>x.id===portal);
   if(portal){if(!slug(portal)||!item)throw Error("Instituição não cadastrada");apply(item,Array.isArray(news)?news:[])}
   else if(dir){applyDirectory(all,dir,Array.isArray(news)?news:[])}
   else throw Error("Página sem identificação");
  }catch(e){$("hero-desc").textContent="Não foi possível carregar os dados institucionais. "+e.message;$("institution-list")?.replaceChildren(E("p","news-empty","Catálogo temporariamente indisponível"))}
 }
 init();
})();