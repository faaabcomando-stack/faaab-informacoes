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
 typeRows(rows,type){if(!type)return rows;if(type==="divisao")return rows.filter(x=>x.tipo==="divisao");if(type==="unidade")return rows.filter(x=>x.tipo==="unidade");return rows.filter(x=>x.tipo===type)},
 url(e){return "ficha.html?id="+encodeURIComponent(e.id)},
 row(e){return '<article class="v3-record-item"><div class="v3-record-code">'+V3.esc(e.sigla||e.forca)+'</div><div><h3><a href="'+V3.url(e)+'">'+V3.esc(e.nome)+'</a></h3><p>'+V3.esc(V3.forces[e.forca]?.name||e.forca)+' · '+V3.esc(V3.types[e.tipo]||e.tipo||"Organização")+' · '+V3.esc(e.estadoImplementacao||"Situação a confirmar")+'</p></div></article>'},
 rows(rows){return rows.length?'<div class="v3-record-list">'+rows.map(V3.row).join("")+'</div>':'<p class="v3-empty">Nenhuma organização desse tipo está registrada no catálogo atual. Não foram criadas entradas fictícias.</p>'},
 note(txt){return '<div class="v3-note">'+V3.esc(txt)+'</div>'},
 context(key,active=""){
  const p=V3.forces[key];if(!p)return;
  const brand=document.querySelector(".v3-brand");
  if(brand){brand.textContent=p.full||p.name;brand.href=p.url;brand.classList.add("v3-force-brand")}
  const desc=document.querySelector(".v3-brand-desc");
  if(desc){desc.textContent="";desc.append(document.createTextNode(p.sector==="civil"?"SETOR CIVIL":"FAAAB CENTRAL"),document.createElement("br"),document.createTextNode("Organizações e formação"))}
  if(["FTB","FAB","FMB","CFN","CBM","PM"].includes(key)){
   const nav=document.querySelector(".v3-nav");
   const holder=document.querySelector(".v3-nav .v3-wrap");
   if(nav&&holder){
    nav.classList.add("v3-nav-force");
    nav.setAttribute("aria-label","Categorias existentes na instituição");
    holder.innerHTML=V3.navMarkup([{title:"Início",url:p.url,group:"home"},V3.backLink(key)],active);
    V3.refreshForceNav(key,active,holder).catch(e=>console.error("Categorias FAAAB indisponíveis",e));
   }
  }
 },
 backLink(key){
  const parent=V3.forces[key]?.sector==="civil"?"civil.html":key==="CFN"?"marinha.html":"central-faaab.html";
  const title=V3.forces[key]?.sector==="civil"?"← Civil":key==="CFN"?"← Marinha":"← FAAAB CENTRAL";
  return {title,url:parent,group:"back"};
 },
 navMarkup(items,active){
  return items.map(item=>'<a href="'+V3.esc(item.url)+'"'+(item.group===active?' aria-current="page"':'')+'>'+V3.esc(item.title)+'</a>').join("");
 },
 async forceMenuItems(key){
  const [catalogue,courses,career,positions]=await Promise.all([V3.get("catalogo"),V3.get("cursos"),V3.get("hierarquias"),V3.get("cargos")]);
  const entries=V3.forceList(catalogue,key);
  const names={FTB:"Batalhões e unidades",FAB:"Unidades aéreas",FMB:"Unidades navais e Fuzileiros",CFN:"Batalhões e unidades",PM:"Unidades da Polícia Militar",CBM:"Unidades dos Bombeiros"};
  const allTypes=[["unidade",names[key]||"Unidades"],["brigada","Brigadas"],["divisao","Divisões"],["centro","Centros de instrução"],["escola","Escolas"],["academia","Academias"],["subdivisao","Subdivisões"],["administracao","Administração"],["instituicao","Instituições"]];
  const items=[{title:"Início",url:V3.forces[key].url,group:"home"}];
  for(const [type,title] of allTypes){
   if(entries.some(e=>e.tipo===type)){
    items.push({title,url:"organizacoes.html?forca="+encodeURIComponent(key)+"&tipo="+encodeURIComponent(type),group:type});
   }
  }
  const courseRows=V3.forceList(courses,key);
  if(courseRows.length||entries.some(e=>e.tipo==="curso"))items.push({title:"Cursos",url:"formacao.html?forca="+encodeURIComponent(key),group:"curso"});
  if(career.some(e=>e.forca===key))items.push({title:"Patentes e CDP",url:"carreira.html?forca="+encodeURIComponent(key),group:"career"});
  if(positions.some(e=>e.forca===key))items.push({title:"Comando",url:"comando.html",group:"command"});
  items.push(V3.backLink(key));
  return items;
 },
 async refreshForceNav(key,active,holder){
  const items=await V3.forceMenuItems(key);
  const nav=document.querySelector(".v3-nav");
  if(nav&&holder&&document.body){
   if(document.querySelector(".v3-brand")?.getAttribute("href")===V3.forces[key].url)holder.innerHTML=V3.navMarkup(items,active);
  }
  const related=document.getElementById("v3-force-related");
  if(related&&document.body.dataset.force===key){
    const links=items.filter(x=>["curso","career","command"].includes(x.group));
    related.innerHTML=links.length?links.map(x=>'<a href="'+V3.esc(x.url)+'"><strong>'+V3.esc(x.title)+'</strong><small>Informações registradas da instituição</small></a>').join(""):'<p>Não há outras categorias registradas nesta instituição.</p>';
    const parent=related.closest(".v3-section");
    if(parent&&!links.length)parent.hidden=true;
  }
  return items;
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
   const govRoles=cargos.filter(x=>x.forca==="GOV");
   V3.set("v3-sector-count",govRoles.length+" cargos registrados");
   const scopes={
    "GOV-PRE":["Presidência e representação institucional","O Governo prevê direção política e representação no roleplay. Alcance de decisões, atos e competências exclusivas ainda precisa ser aprovado.","O Governo possui competência para alterar patentes e batalhões do Exército. A participação individual da Presidência e a execução técnica dependem dos procedimentos do projeto."],
    "GOV-V-PRE":["Vice-Presidência e coordenação política","O cargo integra a direção do Governo. Condições de substituição, sucessão e delegações estão pendentes.","Não há concessão automática dos poderes do Presidente nem acesso privilegiado ao painel administrativo."],
    "GOV-M-DEF":["Área ministerial da Defesa","Cargo ministerial registrado para assuntos de Defesa no Governo. Relação funcional com as forças ainda precisa de normas próprias.","O Governo pode decidir mudanças de patentes e estruturas do Exército; o papel individual do Ministro da Defesa ainda precisa ser confirmado."],
    "GOV-P-STF":["Presidência do tribunal fictício","Cargo de direção do STF do universo FAAAB; organização do tribunal e procedimento judicial ainda não definidos.","Sem autorização registrada para abrir processos, determinar punições, banir jogadores ou acessar dados privados."],
    "GOV-M-STF":["Composição do STF fictício","Integra a estrutura judiciária planejada. Julgamentos, regras de voto e processos dependem de regulamentação.","Não há permissão aprovada para julgar, punir, remover cargos ou modificar contas do Roblox."],
    "GOV-SGP":["Secretaria-Geral da Presidência","Área de coordenação e expediente da Presidência. Competências específicas ainda não constam do regulamento.","Publicar atos, editar cargos, acessar registros ou representar o Presidente depende de autorização específica."],
    "GOV-V-SGP":["Vice-Secretaria-Geral da Presidência","Função adjunta à Secretaria-Geral. Atribuições e hipóteses de substituição ainda não definidas.","Não herda automaticamente poderes da Secretaria-Geral ou acesso ao painel do proprietário."],
    "GOV-S-DEF":["Secretaria de Defesa","Setor temático de Defesa no Governo. A relação com a pasta ministerial e as forças ainda não foi regulamentada.","O Governo pode alterar patentes e batalhões do Exército; acesso técnico individual de secretário ainda não definido."],
    "GOV-V-S-DEF":["Vice-Secretaria de Defesa","Apoio à área de Defesa. Responsabilidades concretas ainda exigem regulamentação.","A vice-função não concede comando militar ou recursos administrativos automaticamente."],
    "GOV-S-JUS":["Secretaria de Justiça","Área administrativa de Justiça prevista no Governo. Não se confunde com a magistratura do STF.","Não integra o STF por esse cargo; atos judiciais, punições e acesso a processos não estão autorizados."],
    "GOV-V-S-JUS":["Vice-Secretaria de Justiça","Função adjunta à Secretaria de Justiça. Substituições e acesso documental ainda pendentes.","Nenhuma competência judicial nem administração do STF é automática."],
    "GOV-S-RI":["Secretaria de Relações Institucionais","Área de relacionamento institucional do Governo, com procedimentos específicos ainda não definidos.","Negociações em nome de outras forças, alterações de cargos e acesso a grupos dependem de aprovação."],
    "GOV-V-S-RI":["Vice-Secretaria de Relações Institucionais","Função adjunta às relações institucionais. Delegações ainda não definidas.","Não pode ser presumida representação automática de instituições ou acesso administrativo."],
    "GOV-S-SEG":["Secretaria de Segurança Pública","Área temática de segurança pública do Governo. Não se confunde com postos e comandos da Polícia Militar.","Não concede automaticamente comando da PM, armamentos virtuais, equipamentos nem poder de punição."],
    "GOV-V-S-SEG":["Vice-Secretaria de Segurança Pública","Apoio à área de Segurança Pública. Atividades e substituições aguardam definição.","A função não herda acesso automático a sistemas policiais, grupos e registros."],
    "GOV-S-COM":["Secretaria de Comunicação Social","Área de comunicação do Governo. Regras para notícias, comunicados e publicação oficial ainda precisam de autorização.","Publicar ou editar notícias no portal exige permissão editorial separada, não apenas o cargo Roblox."],
    "GOV-V-S-COM":["Vice-Secretaria de Comunicação Social","Função adjunta à Comunicação Social. Atividades próprias ainda pendentes.","Nenhum acesso de publicação ou administração é herdado automaticamente da Secretaria."]
   };
   const groups=[
    {name:"Presidência e direção política",intro:"Direção política do Governo, com eleições individuais previstas para Presidente e Vice-Presidente.",ids:["GOV-PRE","GOV-V-PRE","GOV-M-DEF"]},
    {name:"Supremo Tribunal Federal",intro:"Cargos previstos na estrutura judiciária fictícia. Processos e competências jurídicas ainda não possuem regulamentação aprovada.",ids:["GOV-P-STF","GOV-M-STF"]},
    {name:"Secretarias e vice-secretarias",intro:"Áreas do Governo com cargos próprios. Cada setor aguarda a definição formal de suas competências, ingressos e autorizações.",ids:["GOV-SGP","GOV-V-SGP","GOV-S-DEF","GOV-V-S-DEF","GOV-S-JUS","GOV-V-S-JUS","GOV-S-RI","GOV-V-S-RI","GOV-S-SEG","GOV-V-S-SEG","GOV-S-COM","GOV-V-S-COM"]}
   ];
   V3.set("v3-government-offices",groups.map(group=>'<section class="v3-government-role-group"><h3>'+V3.esc(group.name)+'</h3><p>'+V3.esc(group.intro)+'</p><div class="v3-government-roles">'+group.ids.map(id=>{
     const role=govRoles.find(x=>x.id===id);if(!role)return "";
     const info=scopes[id]||["Área institucional","Atribuições detalhadas ainda não aprovadas.","Nenhuma permissão automática registrada."];
     return '<article class="v3-government-role" id="cargo-'+V3.esc(id)+'">'+
       '<div class="v3-government-role-top"><span class="v3-label">'+V3.esc(role.sigla||"GOV")+'</span><h4>'+V3.esc(role.nome)+'</h4></div>'+
       '<div class="v3-government-role-body"><div><span class="v3-gov-field">Área de atuação</span><strong>'+V3.esc(info[0])+'</strong><p>'+V3.esc(info[1])+'</p></div>'+
       '<div><span class="v3-gov-field">Como ingressar</span><p>'+V3.esc(role.tipoIngresso||"Forma de ingresso ainda não definida")+'</p><span class="v3-gov-field">Permissões do cargo</span><p>'+V3.esc(info[2])+'</p></div></div>'+
       '<p class="v3-government-role-status"><b>Situação:</b> '+(role.titular?"Titular cadastrado":"Titular não definido")+' · Acessos internos e poderes específicos aguardam regras e autorização do servidor.</p></article>';
    }).join("")+'</div></section>').join(""));
   const entries=sistemas.filter(x=>x.forca==="GOV").sort((a,b)=>String(a.id).localeCompare(String(b.id)));
   V3.set("v3-government-docs",entries.map(x=>'<article class="v3-government-doc"><div class="v3-government-doc-title"><span class="v3-label">'+V3.esc(x.id)+'</span><h3>'+V3.esc(x.nome)+'</h3><span class="v3-state">'+V3.esc(x.estado||"A confirmar")+'</span></div><p>'+V3.esc(x.resumo||"")+'</p>'+(x.jogo?'<p><strong>No jogo:</strong> '+V3.esc(x.jogo)+'</p>':"")+(x.regras?'<p><strong>Regra documentada ou pendência:</strong> '+V3.esc(x.regras)+'</p>':"")+'</article>').join(""));
  }else{
   const keys=sector==="central"?["FTB","FMB","FAB"]:["PM","CBM"];
   const blocks=keys.map(k=>{const r=V3.forceList(rows,k);return '<div class="v3-category-block"><h3><a href="'+V3.forces[k].url+'">'+V3.forces[k].name+'</a></h3><p>'+r.length+' registros de organizações, centros e unidades.</p>'+V3.rows(r.slice(0,3))+'<div class="v3-pager"><a class="v3-button" href="'+V3.forces[k].url+'">Explorar a instituição</a></div></div>';}).join("");
   V3.set("v3-sector-groups",blocks);
  }
 },
 async force(){
  const key=document.body.dataset.force;
  V3.context(key,"home");const all=await V3.get("catalogo"),rows=V3.forceList(all,key);
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
   const genericFooter=document.querySelector(".v3-section.tint");
   if(genericFooter)genericFooter.hidden=true;
   V3.context(force,type);
   const p=V3.forces[force],name=p.full||p.name;
   const crumb=document.querySelector(".v3-breadcrumb");
   if(crumb)crumb.innerHTML='<a href="index.html">Início</a><span>/</span><a href="'+(p.sector==="civil"?"civil.html":"central-faaab.html")+'">'+(p.sector==="civil"?"Civil":"FAAAB CENTRAL")+'</a><span>/</span><a href="'+p.url+'">'+V3.esc(name)+'</a><span>/</span>'+V3.esc(V3.types[type]||"Organizações");
   const k=document.querySelector(".v3-intro .v3-label");
   if(k)k.textContent="Organizações / "+name;
   const intro=document.querySelector(".v3-intro p");
   if(intro)intro.textContent="Página de "+(V3.types[type]||"organizações").toLowerCase()+" de "+name+". Selecione uma organização para abrir sua ficha individual.";
   document.title=(V3.types[type]||"Organizações")+" | "+name+" | FAAAB";
  }
  let rows=V3.typeRows(V3.forceList(V3.sectorRows(all,sector),force),type);
  if(!force&&!sector)rows=rows.filter(x=>x.forca!=="ADM"&&x.forca!=="GOV");
  const title=type?(V3.types[type]||"Organizações"):body.dataset.collectionName||"Organizações";
  const detail=document.getElementById("v3-dynamic-title");if(detail&&type)detail.textContent=title+(force?" — "+(V3.forces[force]?.full||V3.forces[force]?.name||force):"");
  const descriptor=document.getElementById("v3-dynamic-description");if(descriptor)descriptor.textContent=(force?"Instituição: "+(V3.forces[force]?.name||force)+". ":"")+rows.length+" registros disponíveis. Todos levam a uma ficha individual.";
  const input=document.getElementById("v3-search");
  function paint(){
   const q=V3.clean(input?.value.trim()||"");
   const f=document.getElementById("v3-force-filter")?.value||"",t=document.getElementById("v3-type-filter")?.value||"";
   const list=rows.filter(x=>(!q||V3.clean([x.nome,x.sigla,x.forca,x.secao].join(" ")).includes(q))&&(!f||(f==="FMB"?["FMB","CFN"].includes(x.forca):x.forca===f))&&(!t||x.tipo===t));
   V3.set("v3-list-count",list.length+" organizações encontradas");V3.set("v3-directory",V3.rows(list));
  }
  input?.addEventListener("input",paint);
  document.getElementById("v3-force-filter")?.addEventListener("change",paint);
  document.getElementById("v3-type-filter")?.addEventListener("change",paint);
  paint();
 },
 async record(){
  const id=new URLSearchParams(location.search).get("id");
  const s=new URLSearchParams(location.search).get("secao")||"sobre";
  const sections={sobre:"Missão e atividades",estrutura:"Estrutura e equipes",cargos:"Patentes e comando",treinamentos:"Formação e cursos",sistemas:"Sistemas do jogo"};
  const [cat,unitData,perfis,cursos]=await Promise.all([V3.get("catalogo"),V3.get("estrutura_unidades"),V3.get("perfis_unidades"),V3.get("cursos")]);
  const e=cat.find(x=>x.id===id);
  const unit=unitData.mapeamentos?.[id]||null;
  const perfil=perfis.perfis?.[id]||null;
  const parentUnits=Object.entries(unitData.mapeamentos||{}).filter(([_,o])=>o.subunidades?.some(y=>y.catalogoId===id)).map(([parentId])=>cat.find(x=>x.id===parentId)).filter(Boolean);
  if(!e){V3.set("v3-profile",' <h1>Organização não encontrada</h1><p>Confira o endereço ou volte à <a href="instituicoes.html">página de instituições</a>.</p>');return}
  const sec=Object.prototype.hasOwnProperty.call(sections,s)?s:"sobre";
  V3.context(e.forca);
  document.title=e.nome+" · "+sections[sec]+" | FAAAB";
  V3.set("v3-crumb-force",'<a href="'+(V3.forces[e.forca]?.url||"instituicoes.html")+'">'+V3.esc(V3.forces[e.forca]?.name||"FAAAB")+'</a>');
  V3.set("v3-crumb-name",V3.esc(e.nome));
  V3.set("v3-profile-header",'<span class="v3-label">'+V3.esc(V3.forces[e.forca]?.name||e.forca)+' / '+V3.esc(V3.types[e.tipo]||e.tipo)+'</span><h1>'+V3.esc(e.nome)+'</h1><p>'+V3.esc(perfil?.papel||((e.noJogo&&!/prevista no catálogo aprovado|instituição de ensino prevista|subunidade interna de organização|brigada interna da FAAAB|estrutura do universo FAAAB/i.test(e.noJogo))?e.noJogo:"Organização registrada no catálogo da FAAAB, vinculada à "+(V3.forces[e.forca]?.name||e.forca)+"."))+'</p>'+(e.estadoImplementacao&&e.estadoImplementacao!=="Não confirmado"?'<span class="v3-state">'+V3.esc(e.estadoImplementacao)+'</span>':""));
  V3.set("v3-profile-nav",Object.entries(sections).map(([key,val])=>'<a href="ficha.html?id='+encodeURIComponent(id)+'&secao='+key+'"'+(sec===key?' aria-current="page"':'')+'>'+val+'</a>').join(""));
  let content="";
  if(sec==="sobre"){
   const activities=perfil?.atividades||[];
   const real=e.vidaReal&&!/Instituição ou estrutura de coordenação|Organização|Exige examinar|Uma comparação com/i.test(e.vidaReal)?e.vidaReal:"";
   const noGame=e.noJogo&&!/prevista no catálogo aprovado|instituição de ensino prevista|subunidade interna de organização|brigada interna da FAAAB|estrutura do universo FAAAB/i.test(e.noJogo)?e.noJogo:"";
   content='<div class="v3-doc"><h3>O papel desta organização</h3><p>'+V3.esc(perfil?.papel||noGame||e.nome+" integra o catálogo institucional da FAAAB.")+'</p>'+
      (activities.length?'<h3>Atividades e responsabilidades</h3><ul class="v3-profile-bullets">'+activities.map(x=>'<li>'+V3.esc(x)+'</li>').join("")+'</ul>':"")+
      (!perfil&&noGame?'<h3>No universo do jogo</h3><p>'+V3.esc(noGame)+'</p>':"")+
      (real?'<h3>Referência de função</h3><p>'+V3.esc(real)+'</p>':"")+
      (perfil?.observacoes?.length?'<h3>Regras e distinções</h3><ul class="v3-profile-bullets">'+perfil.observacoes.map(x=>'<li>'+V3.esc(x)+'</li>').join("")+'</ul>':"")+
      '<p class="v3-profile-source">Estas são decisões e concepções do roleplay FAAAB; sua descrição não afirma que os recursos já foram instalados no Roblox Studio.</p></div>';
  }else if(sec==="estrutura"){
   const subs=unit?.subunidades||[];
   const linked=parentUnits.map(x=>'<a href="'+V3.url(x)+'">'+V3.esc(x.nome)+'</a>').join(", ");
   content='<div class="v3-doc"><h3>Localização na estrutura</h3><p>'+V3.esc(e.nome)+' pertence à '+V3.esc(V3.forces[e.forca]?.name||e.forca)+' e está classificado como '+V3.esc(V3.types[e.tipo]||e.tipo)+'.</p>'+
     (e.tipo==="brigada"?'<p>Na FAAAB, as brigadas organizam o ingresso e a formação das unidades. Integram a estrutura interna do Exército, e não são grupos Roblox independentes nem possuem fardas próprias.</p>':"")+
     (linked?'<h3>Unidade principal</h3><p>'+linked+'</p>':"")+
     (subs.length?'<h3>Subdivisões confirmadas</h3><div class="v3-profile-subunits">'+subs.map(x=>'<article><strong>['+V3.esc(x.sigla)+'] '+V3.esc(x.nome||"Nome completo não registrado")+'</strong>'+(x.catalogoId?'<p><a href="ficha.html?id='+encodeURIComponent(x.catalogoId)+'">Consultar equipe</a></p>':"")+'</article>').join("")+'</div>':"")+
     (unit?.hierarquiaInterna?.nota?'<h3>Organização dos cargos</h3><p>'+V3.esc(unit.hierarquiaInterna.nota)+'</p>':"")+
     (e.grupoSeparado===false?'<p class="v3-profile-source">Esta é uma estrutura interna, não um grupo Roblox separado.</p>':"")+'</div>';
  }else if(sec==="cargos"){
   if(unit?.hierarquiaInterna?.modelo==="batalhao"){
    const ranks=unit.hierarquiaInterna.patentes||[];
    content='<div class="v3-doc"><h3>Patentes do batalhão — Soldado até Coronel</h3><p>Esta é a relação de patentes adotada para os batalhões do Exército FAAAB, em ordem crescente. Recruta, generais e cargos administrativos não estão nesta faixa.</p><ol class="v3-unit-rank-list">'+ranks.map(x=>'<li>'+V3.esc(x)+'</li>').join("")+'</ol><p>As regras de ingresso, promoção e atribuição de funções próprias desta unidade dependem de seus critérios específicos.</p></div>';
   }else{
    content='<div class="v3-doc"><h3>Funções da organização</h3><p>Os nomes específicos dos cargos ainda não foram integralmente recuperados para '+V3.esc(e.nome)+'. Não serão inventados.</p></div>';
   }
  }else if(sec==="treinamentos"){
   content='<div class="v3-doc"><h3>Treinamentos e estágios</h3><p>Cada organização poderá ter etapas próprias de instrução, aulas, treinamentos, estágios e avaliações conforme sua finalidade. A seleção de exercícios não foi aprovada para esta organização.</p><p>Os roteiros dependentes de parkours, estandes e instalações serão preenchidos depois da construção do mapa. Nenhum treinamento genérico será exigido automaticamente de todos os integrantes.</p></div>';
   if(e.forca==="FTB")content+=V3.note("Referência da FAAAB: Recrutas precisam escolher uma brigada e um batalhão antes do treinamento e da progressão regular. A participação em guerras exige alcançar Soldado. O TC-1 é treinamento geral para classes, praças e graduados; cadetes e superiores não realizam TC-1. Centros ou batalhões não são automaticamente responsáveis por ministrá-lo.");
   if(e.forca==="FTB"&&unit?.hierarquiaInterna?.modelo==="batalhao")content+='<h3>Progressão de especialização</h3><p>'+V3.esc(unitData.esquema.especializacoes.join(" → "))+'</p><p>Essa progressão não substitui as patentes militares.</p>';
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
  V3.set("v3-profile",'<span class="v3-label">Seção da organização</span><h2 style="margin:9px 0 23px">'+sections[sec]+'</h2>'+content);
 },
 async courses(){
  const rows=await V3.get("cursos"),input=document.getElementById("v3-search");
  const order=["FTB","FAB","FMB","CFN","CBM"];const params=new URLSearchParams(location.search);const selected=params.get("forca")||"";
  if(selected&&V3.forces[selected]){
   const genericFooter=document.querySelector(".v3-section.tint");
   if(genericFooter)genericFooter.hidden=true;
   V3.context(selected,"curso");
  }
  V3.set("v3-course-forces",order.map(k=>'<a class="v3-button'+(k===selected?' primary':'')+'" href="formacao.html?forca='+k+'">'+V3.forces[k].name+'</a>').join("")+'<a class="v3-button'+(!selected?' primary':'')+'" href="formacao.html">Todos</a>');
  function paint(){let list=selected?rows.filter(x=>x.forca===selected):rows;const q=V3.clean(input?.value||"");if(q)list=list.filter(x=>V3.clean([x.titulo,x.sigla,x.detalhes].join(" ")).includes(q));V3.set("v3-course-count",list.length+" cursos e formações documentados");V3.set("v3-course-list",list.map(x=>'<details class="rank"><summary><span>'+V3.esc(x.titulo)+'</span><small>'+V3.esc(x.forca)+'</small></summary><div class="rank-detail"><p><b>Situação:</b> '+V3.esc(x.estado||"A confirmar")+'</p><p style="white-space:pre-wrap">'+V3.esc(x.detalhes||"Detalhes a confirmar")+'</p></div></details>').join("")||'<p>Não há cursos registrados nesta seleção.</p>')}
  input?.addEventListener("input",paint);paint();
 },
 async career(){
  const [rows,patentes]=await Promise.all([V3.get("hierarquias"),V3.get("patentes")]);
  const allowed=["FTB","FAB","FMB","CBM","PM"];let key=new URLSearchParams(location.search).get("forca");if(!allowed.includes(key))key="FTB";
  V3.context(key,"career");
  V3.set("v3-career-forces",allowed.map(k=>'<a class="v3-button'+(k===key?' primary':'')+'" href="carreira.html?forca='+k+'">'+V3.forces[k].name+'</a>').join(""));
  const list=rows.filter(x=>x.forca===key).sort((a,b)=>a.ordem-b.ordem);
  V3.set("v3-career-count",list.length+" patentes e graduações · "+V3.forces[key].name);
  V3.set("v3-career-list",'<h2>'+V3.forces[key].name+'</h2>'+list.map(x=>{const p=patentes.find(y=>y.forca===x.forca&&(y.cargo===x.nome||y.sigla===x.sigla));const stages=p?.cdpEtapas||x.cdpEtapas||[];return '<details class="rank"><summary><span>'+V3.esc(x.nome)+'</span><small>'+V3.esc(x.sigla)+'</small></summary><div class="rank-detail"><p><b>Situação da CDP:</b> '+V3.esc(p?.cdpStatus||x.cdpStatus||"A confirmar")+'</p><p><b>Critérios:</b> '+V3.esc(p?.cdpCriterios||x.cdpCriterios||x.requisitos||"A confirmar")+'</p>'+(stages.length?'<p><b>Etapas:</b> '+stages.map(z=>V3.esc(z.nome)).join(" · ")+'</p>':'')+'<p><b>Tempo documentado:</b> '+V3.esc(x.cdpTempoProposto||"Não definido")+' (não é prazo final aprovado)</p></div></details>'}).join(""));
 }
};
document.addEventListener("DOMContentLoaded",()=>{
 const key=document.body.dataset.v3Page;
 const params=new URLSearchParams(location.search);
 const explicit=params.get("forca")||document.body.dataset.force;
 const rec=params.get("id");
 const force=explicit||(rec&&["FTB","FAB","FMB","CFN","PM","CBM"].includes(rec.split("-")[0])?rec.split("-")[0]:"");
 if(force&&V3.forces[force])V3.context(force,key==="force"?"home":key==="catalogue"?params.get("tipo")||"":key==="courses"?"curso":key==="career"?"career":"");
 const fn={home:"home",sector:"sector",force:"force",catalogue:"catalogue",record:"record",courses:"courses",career:"career"}[key];
 if(fn)Promise.resolve().then(()=>V3[fn]()).catch(e=>{console.error("FAAAB remaster",e);const target=document.getElementById("v3-directory")||document.getElementById("v3-force-sections")||document.getElementById("v3-profile")||document.getElementById("v3-course-list")||document.getElementById("v3-career-list")||document.getElementById("v3-latest")||document.getElementById("v3-sector-groups");if(target)target.innerHTML='<p role="alert">Não foi possível consultar estes dados. Verifique sua conexão e recarregue a página.</p>'});
});
