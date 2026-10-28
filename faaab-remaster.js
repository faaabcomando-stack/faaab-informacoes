"use strict";
/* FAAAB Remaster — só informações públicas. Acesso privado exige backend autenticado. */
const V3={
 forces:{FTB:{name:"Exército",full:"Exército Brasileiro",url:"exercito.html",sector:"central"},FAB:{name:"Força Aérea",full:"Força Aérea Brasileira",url:"aeronautica.html",sector:"central"},FMB:{name:"Marinha",full:"Marinha Brasileira",url:"marinha.html",sector:"central"},CFN:{name:"Fuzileiros Navais",full:"Corpo de Fuzileiros Navais",url:"fuzileiros.html",sector:"central"},PM:{name:"Polícia Militar",full:"Polícia Militar",url:"policia-militar.html",sector:"civil"},CBM:{name:"Corpo de Bombeiros",full:"Corpo de Bombeiros Militar",url:"bombeiros.html",sector:"civil"},ADM:{name:"Administração",url:"governo.html",sector:"governo"},GOV:{name:"Governo",url:"governo.html",sector:"governo"}},
 types:{instituicao:"Instituição",unidade:"Batalhões e unidades",brigada:"Brigadas",centro:"Centros de instrução",escola:"Escolas",academia:"Academias",subdivisao:"Subdivisões",curso:"Cursos",administracao:"Setores administrativos",divisao:"Divisões"},
 cached:new Map(),
 esc:v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),
 clean:v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),
 async get(file){if(V3.cached.has(file))return V3.cached.get(file);const response=await fetch("dados/"+file+".json",{cache:"no-store"});if(!response.ok)throw Error("Dados indisponíveis: "+file);const x=await response.json();V3.cached.set(file,x);return x},
 set(id,html){const x=document.getElementById(id);if(x)x.innerHTML=html},
 forceList(rows,key){if(!key)return rows;if(key==="FMB")return rows.filter(x=>x.forca==="FMB"||x.forca==="CFN");return rows.filter(x=>x.forca===key)},
 sectorRows(rows,sector){if(sector==="central")return rows.filter(x=>["FTB","FAB","FMB","CFN"].includes(x.forca)||["ADM-FTB","ADM-FAB","ADM-FMB","ADM-CFN"].includes(x.id));if(sector==="civil")return rows.filter(x=>["PM","CBM"].includes(x.forca)||["ADM-PM","ADM-CBM"].includes(x.id));if(sector==="governo")return rows.filter(x=>x.forca==="ADM"&&!["ADM-FTB","ADM-FAB","ADM-FMB","ADM-CFN","ADM-PM","ADM-CBM"].includes(x.id));return rows},
 typeRows(rows,type){if(!type)return rows;if(type==="divisao")return rows.filter(x=>/divis[aã]o/i.test(x.nome)&&x.tipo!=="curso");if(type==="unidade")return rows.filter(x=>x.tipo==="unidade");return rows.filter(x=>x.tipo===type)},
 url(e){return "ficha.html?id="+encodeURIComponent(e.id)},
 row(e){return '<article class="v3-record-item"><div class="v3-record-code">'+V3.esc(e.sigla||e.forca)+'</div><div><h3><a href="'+V3.url(e)+'">'+V3.esc(e.nome)+'</a></h3><p>'+V3.esc(V3.forces[e.forca]?.name||e.forca)+' · '+V3.esc(V3.types[e.tipo]||e.tipo||"Organização")+' · '+V3.esc(e.estadoImplementacao||"Situação a confirmar")+'</p></div><a href="'+V3.url(e)+'">Abrir organização →</a></article>'},
 rows(rows){return rows.length?'<div class="v3-record-list">'+rows.map(V3.row).join("")+'</div>':'<p class="v3-empty">Nenhuma organização desse tipo está registrada no catálogo atual. Não foram criadas entradas fictícias.</p>'},
 note(txt){return '<div class="v3-note">'+V3.esc(txt)+'</div>'},
 context(key){
  const p=V3.forces[key];if(!p)return;
  const brand=document.querySelector(".v3-brand");
  if(brand){brand.textContent=p.full||p.name;brand.href=p.url;brand.classList.add("v3-force-brand")}
  const desc=document.querySelector(".v3-brand-desc");
  if(desc){desc.textContent="";desc.append(document.createTextNode(p.sector==="civil"?"SETOR CIVIL":"FAAAB CENTRAL"),document.createElement("br"),document.createTextNode("Organizações e formação"))}
 },
 categoryNav(key,active){
  const categories=[["unidade","Batalhões e unidades"],["brigada","Brigadas"],["divisao","Divisões"],["centro","Centros"],["escola","Escolas"],["academia","Academias"],["subdivisao","Subdivisões"],["curso","Cursos"],["administracao","Administração"],["instituicao","Instituições"]];
  return '<div class="v3-label">Categorias da instituição</div><nav class="v3-force-category-links" aria-label="Páginas da instituição">'+categories.map(([t,label])=>{
    const url=t==="curso"?"formacao.html?forca="+key:"organizacoes.html?forca="+key+"&tipo="+t;
    return '<a href="'+url.replace(/&/g,"&amp;")+'"'+(t===active?' aria-current="page"':'')+'>'+label+'</a>';
  }).join("")+'<a href="carreira.html?forca='+(key==="CFN"?"FMB":key)+'">Patentes e CDP</a><a href="comando.html">Comando</a></nav>';
 },
 async home(){
  const [c,h]=await Promise.all([V3.get("catalogo"),V3.get("historico")]);const groups={central:V3.sectorRows(c,"central"),governo:V3.sectorRows(c,"governo"),civil:V3.sectorRows(c,"civil")};
  ["central","governo","civil"].forEach(k=>{const t=document.getElementById("v3-count-"+k);if(t)t.textContent=groups[k].length+" registros no catálogo";});
  V3.set("v3-latest",h.slice().sort((a,b)=>String(b.data).localeCompare(String(a.data))).slice(0,3).map(x=>'<div class="v3-record-item"><span class="v3-record-code">'+V3.esc(x.data)+'</span><div><h3>'+V3.esc(x.titulo)+'</h3><p>'+V3.esc(x.descricao)+'</p></div></div>').join(""));
 },
 async sector(){
  const sector=document.body.dataset.sector,rows=V3.sectorRows(await V3.get("catalogo"),sector);
  const name=sector==="central"?"FAAAB CENTRAL":sector==="civil"?"Setor Civil":"Governo";
  V3.set("v3-sector-count",rows.length+" registros vinculados a "+name);
  if(sector==="governo"){
   const [cargos,sistemas]=await Promise.all([V3.get("cargos"),V3.get("sistemas")]);
   V3.set("v3-government-offices",'<div class="v3-record-list">'+cargos.filter(x=>x.forca==="GOV").map(x=>'<div class="v3-record-item"><span class="v3-record-code">'+V3.esc(x.sigla)+'</span><div><h3>'+V3.esc(x.nome)+'</h3><p>'+(x.titular?"Titular cadastrado":"Titular não definido")+' · '+V3.esc(x.tipoIngresso||"Regra de nomeação a confirmar")+'</p></div><a href="comando.html">Comando →</a></div>').join("")+'</div>');
   V3.set("v3-government-docs",'<div class="v3-record-list">'+sistemas.filter(x=>x.forca==="GOV").slice(0,5).map(x=>'<div class="v3-record-item"><span class="v3-record-code">DOC</span><div><h3>'+V3.esc(x.nome)+'</h3><p>'+V3.esc(x.resumo)+'</p></div><a href="sistemas.html">Manual →</a></div>').join("")+'</div>');
  }else{
   const keys=sector==="central"?["FTB","FMB","FAB"]:["PM","CBM"];
   const blocks=keys.map(k=>{const r=V3.forceList(rows,k);return '<div class="v3-category-block"><h3><a href="'+V3.forces[k].url+'">'+V3.forces[k].name+'</a></h3><p>'+r.length+' registros de organizações, centros e unidades.</p>'+V3.rows(r.slice(0,3))+'<div class="v3-pager"><a class="v3-button" href="'+V3.forces[k].url+'">Explorar a instituição</a></div></div>';}).join("");
   V3.set("v3-sector-groups",blocks);
  }
 },
 async force(){
  const key=document.body.dataset.force;
  V3.context(key);const all=await V3.get("catalogo"),rows=V3.forceList(all,key);
  const types=["unidade","brigada","divisao","centro","escola","academia","subdivisao","curso"];
  const sections=types.map(type=>{let a=V3.typeRows(rows,type);if(!a.length)return "";
  const q="organizacoes.html?forca="+encodeURIComponent(key)+"&tipo="+encodeURIComponent(type);
  return '<section class="v3-category-block"><div class="v3-section-head"><div><span class="v3-label">'+a.length+' registros</span><h2>'+V3.types[type]+'</h2></div><a href="'+q+'">Abrir página desta categoria →</a></div>'+V3.rows(a.slice(0,4))+'</section>'}).filter(Boolean);
  V3.set("v3-force-count",rows.length+" registros pertencentes a esta instituição");
  V3.set("v3-force-sections",sections.join("")||'<p>Não há registros cadastrados para esta organização.</p>');
 },
 async catalogue(){
  const all=await V3.get("catalogo"),params=new URLSearchParams(location.search);const body=document.body;
  const force=params.get("forca")||body.dataset.force||"";
  const sector=params.get("setor")||body.dataset.sector||"";
  const type=params.get("tipo")||body.dataset.type||"";
  if(force&&V3.forces[force]){
   V3.context(force);
   const p=V3.forces[force],name=p.full||p.name;
   const context=document.getElementById("v3-context-menu");
   if(context){context.classList.add("v3-force-index");context.innerHTML='<div class="v3-wrap">'+V3.categoryNav(force,type)+'</div>'}
   const crumb=document.querySelector(".v3-breadcrumb");
   if(crumb)crumb.innerHTML='<a href="index.html">Início</a><span>/</span><a href="'+(p.sector==="civil"?"civil.html":"central-faaab.html")+'">'+(p.sector==="civil"?"Civil":"FAAAB CENTRAL")+'</a><span>/</span><a href="'+p.url+'">'+V3.esc(name)+'</a><span>/</span>'+V3.esc(V3.types[type]||"Organizações");
   const k=document.querySelector(".v3-intro .v3-label");
   if(k)k.textContent="Organizações / "+name;
   const intro=document.querySelector(".v3-intro p");
   if(intro)intro.textContent="Página de "+(V3.types[type]||"organizações").toLowerCase()+" de "+name+". Selecione uma organização para abrir sua ficha individual.";
   document.title=(V3.types[type]||"Organizações")+" | "+name+" | FAAAB";
  }
  let rows=V3.typeRows(V3.forceList(V3.sectorRows(all,sector),force),type);
  const title=type?(V3.types[type]||"Organizações"):body.dataset.collectionName||"Organizações";
  const detail=document.getElementById("v3-dynamic-title");if(detail&&type)detail.textContent=title+(force?" — "+(V3.forces[force]?.full||V3.forces[force]?.name||force):"");
  const descriptor=document.getElementById("v3-dynamic-description");if(descriptor)descriptor.textContent=(force?"Instituição: "+(V3.forces[force]?.name||force)+". ":"")+rows.length+" registros disponíveis. Todos levam a uma ficha individual.";
  const input=document.getElementById("v3-search");
  function paint(){const q=V3.clean(input?.value.trim()||"");const r=q?rows.filter(e=>V3.clean([e.nome,e.sigla,e.forca,e.secao].join(" ")).includes(q)):rows;V3.set("v3-list-count",r.length+" organizações encontradas");V3.set("v3-directory",V3.rows(r))}
  input?.addEventListener("input",paint);paint();
 },
 async record(){
  const id=new URLSearchParams(location.search).get("id");
  const s=new URLSearchParams(location.search).get("secao")||"sobre";
  const sections={sobre:"Apresentação",estrutura:"Estrutura",cargos:"Cargos e atribuições",treinamentos:"Treinamentos e estágios",permissoes:"Permissões",instalacoes:"Instalações",equipamentos:"Equipamentos virtuais",integrantes:"Área de integrantes",agenda:"Agenda"};
  const cat=await V3.get("catalogo");
  const e=cat.find(x=>x.id===id);
  if(!e){V3.set("v3-profile",' <h1>Organização não encontrada</h1><p>Confira o endereço ou volte à <a href="instituicoes.html">página de instituições</a>.</p>');return}
  const sec=Object.prototype.hasOwnProperty.call(sections,s)?s:"sobre";
  V3.context(e.forca);
  document.title=e.nome+" · "+sections[sec]+" | FAAAB";
  V3.set("v3-crumb-force",'<a href="'+(V3.forces[e.forca]?.url||"instituicoes.html")+'">'+V3.esc(V3.forces[e.forca]?.name||"FAAAB")+'</a>');
  V3.set("v3-crumb-name",V3.esc(e.nome));
  V3.set("v3-profile-header",'<span class="v3-label">'+V3.esc(V3.forces[e.forca]?.name||e.forca)+' / '+V3.esc(V3.types[e.tipo]||e.tipo)+'</span><h1>'+V3.esc(e.nome)+'</h1><p>'+V3.esc(e.noJogo||"Organização incluída na documentação da FAAAB; detalhes de implantação a confirmar.")+'</p><span class="v3-state">'+V3.esc(e.estadoImplementacao||"Situação ainda não confirmada")+'</span>');
  V3.set("v3-profile-nav",Object.entries(sections).map(([key,val])=>'<a href="ficha.html?id='+encodeURIComponent(id)+'&secao='+key+'"'+(sec===key?' aria-current="page"':'')+'>'+val+'</a>').join(""));
  let content="";
  if(sec==="sobre"){
   content='<div class="v3-doc"><h3>Identidade da organização</h3><p><b>Sigla:</b> '+V3.esc(e.sigla||"Não definida")+'</p><p><b>Categoria:</b> '+V3.esc(V3.types[e.tipo]||e.tipo)+'</p><p><b>Força:</b> '+V3.esc(V3.forces[e.forca]?.name||e.forca)+'</p><h3>No universo FAAAB</h3><p>'+V3.esc(e.noJogo||"Ainda não documentado")+'</p><h3>Referência externa</h3><p>'+V3.esc(e.vidaReal||"Nenhuma referência documentada")+'</p><h3>Critérios de ingresso documentados</h3><p>'+V3.esc(e.requisitos||"A definir")+'</p></div>'+V3.note("A presença no catálogo não confirma que esta organização ou seus sistemas já estejam disponíveis no mapa do Roblox.");
  }else if(sec==="estrutura"){
   content='<div class="v3-doc"><h3>Organização interna</h3><p><b>Seção do catálogo:</b> '+V3.esc(e.secao||"A definir")+'</p><p><b>Grupo Roblox independente:</b> '+(e.grupoSeparado===true?"Documentado como separado":e.grupoSeparado===false?"Documentado como estrutura interna":"Ainda não confirmado")+'</p><p>Subunidades, companhias, divisões internas e relações de subordinação específicas serão preenchidas somente com documentação confirmada.</p></div>';
  }else if(sec==="cargos"){
   content='<div class="v3-doc"><h3>Cargos da organização</h3><p>Quadro de comando, instrutores, alunos e demais funções internas ainda não foi validado individualmente para '+V3.esc(e.nome)+'. Não atribuímos cargos de outras organizações automaticamente.</p><p>O registro de cargos deverá informar nome, função, limites de competência, requisitos e responsável.</p><p><a href="comando.html">Consultar cargos gerais e autoridades documentados →</a></p></div>';
  }else if(sec==="treinamentos"){
   content='<div class="v3-doc"><h3>Treinamentos e estágios</h3><p>Cada organização poderá ter etapas próprias de instrução, aulas, treinamentos, estágios e avaliações conforme sua finalidade. A seleção de exercícios não foi aprovada para esta organização.</p><p>Os roteiros dependentes de parkours, estandes e instalações serão preenchidos depois da construção do mapa. Nenhum treinamento genérico será exigido automaticamente de todos os integrantes.</p></div>';
   if(e.forca==="FTB")content+=V3.note("Referência da FAAAB: o TC-1 é um treinamento geral para classes, praças e graduados; cadetes e superiores não realizam TC-1. Isso não significa que todo centro ou batalhão seja responsável por ministrá-lo.");
  }else if(sec==="permissoes"){
   content='<div class="v3-doc"><h3>Permissões por função</h3><p>O quadro específico de quem pode comandar instruções, acessar áreas do mapa, operar equipamentos e registrar avaliações ainda precisa ser aprovado.</p><p>Quando o login Roblox estiver implantado, a participação e a função no grupo poderão autorizar <b>acessos comuns de leitura</b>, após verificação segura no servidor.</p><p>Permissões administrativas continuarão dependendo de concessão separada e explícita.</p></div>';
  }else if(sec==="instalacoes"){
   content='<div class="v3-private"><strong>Dependente do mapa do jogo</strong><p>As áreas permitidas, áreas restritas, salas, pistas, guaritas e instalações desta organização serão descritas depois de existirem no Roblox Studio. Não há planta ou liberação fictícia publicada.</p></div>';
  }else if(sec==="equipamentos"){
   content='<div class="v3-private"><strong>Equipamentos aguardando implementação</strong><p>Veículos, ferramentas, armamentos virtuais, uniformes e controles do jogo serão listados quando estiverem disponíveis e testados. A documentação tratará somente do uso das mecânicas do Roblox.</p></div>';
  }else if(sec==="integrantes"){
   content='<div class="v3-private"><strong>Área interna ainda não disponível</strong><p>O login Roblox e a verificação de participação em grupos ainda não estão ativados neste portal. Não são exibidas fichas, nomes, escalas ou materiais restritos nesta página pública.</p><p>Uma página estática não protege dados apenas ocultando o conteúdo. O acesso privado exigirá backend, verificação de identidade e permissões no servidor.</p></div>';
  }else if(sec==="agenda"){
   content='<div class="v3-private"><strong>Programação a definir</strong><p>Não há treinamentos, aulas ou estágios confirmados para publicação nesta organização. A agenda poderá ser preenchida por responsáveis autorizados quando o sistema estiver disponível.</p></div>';
  }
  V3.set("v3-profile",'<span class="v3-label">Seção da organização</span><h2 style="margin:9px 0 23px">'+sections[sec]+'</h2>'+content+'<div class="v3-pager"><a class="v3-button" href="'+(V3.forces[e.forca]?.url||"instituicoes.html")+'">Voltar à instituição</a></div>');
 },
 async courses(){
  const rows=await V3.get("cursos"),input=document.getElementById("v3-search");
  const order=["FTB","FAB","FMB","CFN","CBM"];const params=new URLSearchParams(location.search);const selected=params.get("forca")||"";
  if(selected&&V3.forces[selected])V3.context(selected);
  V3.set("v3-course-forces",order.map(k=>'<a class="v3-button'+(k===selected?' primary':'')+'" href="formacao.html?forca='+k+'">'+V3.forces[k].name+'</a>').join("")+'<a class="v3-button'+(!selected?' primary':'')+'" href="formacao.html">Todos</a>');
  function paint(){let list=selected?rows.filter(x=>x.forca===selected):rows;const q=V3.clean(input?.value||"");if(q)list=list.filter(x=>V3.clean([x.titulo,x.sigla,x.detalhes].join(" ")).includes(q));V3.set("v3-course-count",list.length+" cursos e formações documentados");V3.set("v3-course-list",list.map(x=>'<details class="rank"><summary><span>'+V3.esc(x.titulo)+'</span><small>'+V3.esc(x.forca)+'</small></summary><div class="rank-detail"><p><b>Situação:</b> '+V3.esc(x.estado||"A confirmar")+'</p><p style="white-space:pre-wrap">'+V3.esc(x.detalhes||"Detalhes a confirmar")+'</p></div></details>').join("")||'<p>Não há cursos registrados nesta seleção.</p>')}
  input?.addEventListener("input",paint);paint();
 },
 async career(){
  const [rows,patentes]=await Promise.all([V3.get("hierarquias"),V3.get("patentes")]);
  const allowed=["FTB","FAB","FMB","CBM","PM"];let key=new URLSearchParams(location.search).get("forca");if(!allowed.includes(key))key="FTB";
  V3.context(key);
  V3.set("v3-career-forces",allowed.map(k=>'<a class="v3-button'+(k===key?' primary':'')+'" href="carreira.html?forca='+k+'">'+V3.forces[k].name+'</a>').join(""));
  const list=rows.filter(x=>x.forca===key).sort((a,b)=>a.ordem-b.ordem);
  V3.set("v3-career-count",list.length+" patentes e graduações · "+V3.forces[key].name);
  V3.set("v3-career-list",'<h2>'+V3.forces[key].name+'</h2>'+list.map(x=>{const p=patentes.find(y=>y.forca===x.forca&&(y.cargo===x.nome||y.sigla===x.sigla));const stages=p?.cdpEtapas||x.cdpEtapas||[];return '<details class="rank"><summary><span>'+V3.esc(x.nome)+'</span><small>'+V3.esc(x.sigla)+'</small></summary><div class="rank-detail"><p><b>Situação da CDP:</b> '+V3.esc(p?.cdpStatus||x.cdpStatus||"A confirmar")+'</p><p><b>Critérios:</b> '+V3.esc(p?.cdpCriterios||x.cdpCriterios||x.requisitos||"A confirmar")+'</p>'+(stages.length?'<p><b>Etapas:</b> '+stages.map(z=>V3.esc(z.nome)).join(" · ")+'</p>':'')+'<p><b>Tempo documentado:</b> '+V3.esc(x.cdpTempoProposto||"Não definido")+' (não é prazo final aprovado)</p></div></details>'}).join(""));
 }
};
document.addEventListener("DOMContentLoaded",()=>{
 const key=document.body.dataset.v3Page;const fn={home:"home",sector:"sector",force:"force",catalogue:"catalogue",record:"record",courses:"courses",career:"career"}[key];
 if(fn)Promise.resolve().then(()=>V3[fn]()).catch(e=>{console.error("FAAAB remaster",e);const target=document.getElementById("v3-directory")||document.getElementById("v3-force-sections")||document.getElementById("v3-profile")||document.getElementById("v3-course-list")||document.getElementById("v3-career-list")||document.getElementById("v3-latest")||document.getElementById("v3-sector-groups");if(target)target.innerHTML='<p role="alert">Não foi possível consultar estes dados. Verifique sua conexão e recarregue a página.</p>'});
});
