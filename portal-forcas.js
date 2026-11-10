"use strict";
/* Portal de cada forca: noticias e unidades reais do catalogo, sem dados inventados. */
(()=>{
 const p=document.querySelector("body.forceportal");if(!p)return;
 const force=p.dataset.force;
 const sector={FTB:"exercito",FMB:"marinha",FAB:"fab"}[force];
 const feature={
  FTB:["FTB-CIGS","FTB-BPE","FTB-CIE","FTB-BFE"],
  FMB:["FMB-CIM","FMB-COMSUB","FMB-DEnsM","FMB-EN"],
  FAB:["FAB-DIRENS","FAB-AFA","FAB-ECEMAR","FAB-GSD"]
 }[force]||[];
 const $=id=>document.getElementById(id);
 const elem=(name,cls,text)=>{const e=document.createElement(name);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
 const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const labels={unidade:"Unidade",comando:"Comando",diretoria:"Diretoria",administracao:"Administração",instituicao:"Instituição",centro:"Centro",escola:"Escola",academia:"Academia",brigada:"Brigada",subdivisao:"Subdivisão",companhia:"Companhia",curso:"Curso",regimento:"Regimento"};
 const menu=$("fp-toggle"),nav=$("fp-links");
 if(menu&&nav){menu.addEventListener("click",()=>{const opened=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(opened))});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false")}))}
 const absent=()=>{const art=elem("article","fp-news-empty");art.append(elem("span","glyph","✦"));const body=elem("div");body.append(elem("strong","", "Nenhuma notícia publicada"),elem("p","", "Os próximos comunicados desta força aparecerão aqui após serem publicados pela equipe FAAAB."));art.append(body);return art};
 const renderNews=posts=>{const host=$("fp-news");if(!host)return;host.replaceChildren();const list=(Array.isArray(posts)?posts:[]).filter(x=>x&&typeof x.titulo==="string"&&norm(x.setor)===sector&&!["publicidade","anuncio","patrocinado"].includes(norm(x.categoria||x.tipo))).sort((a,b)=>String(b.data||"").localeCompare(String(a.data||""))).slice(0,4);if(!list.length){host.append(absent());return}for(const x of list){const a=elem("a","fp-news-article");a.href="noticia.html?id="+encodeURIComponent(x.id||"");a.append(elem("small","",(x.categoria||"Comunicado")+" · "+(x.data||"Data não informada")),elem("strong","",x.titulo),elem("p","",x.resumo||"Consultar publicação completa."));host.append(a)}};
 fetch("dados/noticias.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Noticias indisponiveis");return r.json()}).then(renderNews).catch(()=>{$("fp-news")?.replaceChildren(absent())});
 function catalog(data){
  const all=(Array.isArray(data)?data:[]).filter(x=>x&&typeof x.id==="string"&&typeof x.nome==="string"&&(x.forca===force||(force==="FMB"&&x.forca==="CFN")));
  const count=$("fp-total"),select=$("fp-type"),input=$("fp-query"),list=$("fp-list"),more=$("fp-more"),info=$("fp-count"),spot=$("fp-spotlight");
  if(count)count.textContent=all.length+" registros";
  if(!list)return;
  const types=[...new Set(all.map(x=>x.tipo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  types.forEach(t=>{let o=elem("option","",labels[t]||t);o.value=t;select?.append(o)});
  if(spot){spot.replaceChildren();for(const id of feature){const x=all.find(y=>y.id===id);if(!x)continue;const a=elem("a","",(x.sigla||x.nome)+" · "+(labels[x.tipo]||x.tipo||"Organização"));a.href="ficha.html?id="+encodeURIComponent(x.id);spot.append(a)}}
  let limit=10;
  function render(){const term=norm(input?.value.trim()),type=select?.value||"";const matched=all.filter(x=>(!type||x.tipo===type)&&(!term||norm([x.sigla,x.nome,x.tipo,x.secao].join(" ")).includes(term)));
   list.replaceChildren();
   if(!matched.length)list.append(elem("p","fp-empty",all.length?"Nenhuma organização corresponde aos filtros.":"Nenhum registro disponível."));
   for(const x of matched.slice(0,limit)){const a=elem("a","fp-unit");a.href="ficha.html?id="+encodeURIComponent(x.id);const content=elem("span");content.append(elem("strong","",x.nome),elem("small","",(x.sigla||"")+(x.tipo?" · "+(labels[x.tipo]||x.tipo):"")+" · "+(x.estadoImplementacao||"Situação não confirmada")));a.append(content,elem("b","","↗"));list.append(a)}
   if(info)info.textContent=matched.length+" organizações encontradas";if(more)more.hidden=matched.length<=limit;
  }
  input?.addEventListener("input",()=>{limit=10;render()});select?.addEventListener("change",()=>{limit=10;render()});more?.addEventListener("click",()=>{limit+=10;render()});render();
 }
 fetch("dados/catalogo.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Catalogo indisponivel");return r.json()}).then(catalog).catch(()=>{$("fp-list")?.replaceChildren(elem("p","fp-empty","Não foi possível carregar o catálogo."));if($("fp-total"))$("fp-total").textContent="Indisponível"});
})();
