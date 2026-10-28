"use strict";
/* Portal FAAAB. Cada página consulta somente seus dados, sem dependências de login. */
const FAAAB={
 forces:{FTB:["Exército","exercito.html"],FAB:["Força Aérea","aeronautica.html"],FMB:["Marinha","marinha.html"],CFN:["Fuzileiros Navais","fuzileiros.html"],CBM:["Bombeiros","bombeiros.html"],PM:["Polícia Militar","policia-militar.html"],ADM:["Administração","administracao.html"]},
 types:{unidade:"Batalhão ou unidade",centro:"Centro",escola:"Escola",academia:"Academia",instituicao:"Instituição",brigada:"Brigada",subdivisao:"Subdivisão",curso:"Curso",administracao:"Setor administrativo"},
 safe:v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),
 clean:v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),
 async load(path){
   const response=await fetch("dados/"+path+".json",{cache:"no-store"});
   if(!response.ok)throw new Error("HTTP "+response.status);
   const data=await response.json();
   if(!Array.isArray(data))throw new Error("Formato inválido");
   return data;
 },
 nameForce:key=>FAAAB.forces[key]?.[0]||key,
 hrefForce:key=>FAAAB.forces[key]?.[1]||"instituicoes.html",
 summary:item=>(item.noJogo||item.vidaReal||item.requisitos||"").slice(0,180),
 allowedImage:src=>{try{const u=new URL(src);return u.protocol==="https:"&&["www.gov.br","www.marinha.mil.br","upload.wikimedia.org"].includes(u.hostname)}catch{return false}},
 logo:item=>{
  const src=item.logo||item.logoReferencia;
  if(FAAAB.allowedImage(src))return '<span class="logo-slot"><img loading="lazy" src="'+FAAAB.safe(src)+'" alt="Logomarca de referência: '+FAAAB.safe(item.nome)+'" onerror="this.style.display=\'none\';this.nextElementSibling.hidden=false"><span class="initials" hidden>'+FAAAB.safe(item.sigla||"FAAAB")+'</span></span>';
  return '<span class="prefix">'+FAAAB.safe(item.sigla||"FAAAB")+'</span>';
 },
 entry:item=>{
  const url="ficha.html?id="+encodeURIComponent(item.id);
  return '<article class="directory-entry'+(item.logoReferencia?' has-logo':'')+'">'+FAAAB.logo(item)+
  '<div><strong>'+FAAAB.safe(item.nome)+'</strong><small>'+FAAAB.safe(FAAAB.nameForce(item.forca))+' · '+FAAAB.safe(FAAAB.types[item.tipo]||item.tipo)+
  (item.estadoImplementacao?' · '+FAAAB.safe(item.estadoImplementacao):'')+'</small>'+
  (item.logoReferencia?'<small class="ref-note">Marca real de referência; identidade FAAAB será criada</small>':'')+
  '</div><a href="'+url+'">Abrir ficha</a></article>';
 },
 bindSearch(all,container){
  const input=document.getElementById("page-search"),count=document.getElementById("list-count");
  const draw=()=>{const q=FAAAB.clean(input?.value.trim()||"");let rows=all.filter(x=>FAAAB.clean([x.nome,x.sigla,x.forca,x.tipo].join(" ")).includes(q));
    container.innerHTML=rows.length?rows.map(FAAAB.entry).join(""):'<p>Nenhum registro encontrado nesta seção.</p>';
    if(count)count.textContent=rows.length+" registros nesta página";
  };
  if(input)input.addEventListener("input",draw);
  draw();
 },
 async catalogue(){
  const data=await FAAAB.load("catalogo"),section=document.body.dataset.section||"";
  const force=document.body.dataset.force||"";
  let filtered=data;
  if(force)filtered=filtered.filter(x=>x.forca===force||(force==="FMB"&&x.forca==="CFN"));
  if(section==="batalhoes")filtered=filtered.filter(x=>x.tipo==="unidade");
  if(section==="centros")filtered=filtered.filter(x=>x.tipo==="centro");
  if(section==="escolas")filtered=filtered.filter(x=>x.tipo==="escola"||x.tipo==="academia");
  if(section==="brigadas")filtered=filtered.filter(x=>x.tipo==="brigada");
  const container=document.getElementById("listing");if(!container)return;
  FAAAB.bindSearch(filtered,container);
 },
 async courses(){
  const rows=await FAAAB.load("cursos"),target=document.getElementById("course-list");
  const search=document.getElementById("page-search"),count=document.getElementById("list-count");
  function render(){const q=FAAAB.clean(search?.value||"");const found=rows.filter(x=>FAAAB.clean([x.titulo,x.detalhes,x.forca,x.sigla].join(" ")).includes(q));
   target.innerHTML=found.length?found.map(x=>'<details class="rank"><summary><span class="grade">'+FAAAB.safe(x.forca)+'</span><strong>'+FAAAB.safe(x.titulo)+'</strong><span class="status">Ver requisitos</span></summary><div class="rank-detail"><p>'+FAAAB.safe(x.estado||"Planejamento")+'</p><p style="white-space:pre-line">'+FAAAB.safe(x.detalhes||"Critérios ainda não definidos")+'</p></div></details>').join(""):'<p>Nenhuma formação localizada.</p>';
   if(count)count.textContent=found.length+" cursos e formações";
  }
  search?.addEventListener("input",render);render();
 },
 async career(){
  const [rows,confirmed]=await Promise.all([FAAAB.load("hierarquias"),FAAAB.load("patentes")]);
  const target=document.getElementById("career-list");
  const buttons=[...document.querySelectorAll("[data-force-career]")];
  const selector=new URLSearchParams(location.search).get("forca");
  const forces=["FTB","FAB","FMB","CBM","PM"],valid=forces.includes(selector)?selector:null;
  let current=valid||"FTB";
  function draw(){
   buttons.forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.forceCareer===current));b.classList.toggle("selected",b.dataset.forceCareer===current)});
   const filtered=rows.filter(x=>x.forca===current).sort((a,b)=>a.ordem-b.ordem);
   target.innerHTML='<h2>'+FAAAB.safe(FAAAB.nameForce(current))+'</h2><p class="article-intro">Patentes ordenadas do posto mais alto ao mais baixo. Abra cada linha para consultar o registro de Capacitação de Patente.</p><div class="rank-list">'+filtered.map((x,i)=>{
    const extra=confirmed.find(p=>p.forca===x.forca&&(p.cargo===x.nome||p.sigla===x.sigla));
    const requisitos=extra?.cdpCriterios||x.cdpCriterios||x.requisitos||"Informação ainda não confirmada";
    const etapas=extra?.cdpEtapas||x.cdpEtapas||[];
    const status=extra?.cdpStatus||x.cdpStatus||"Em revisão";
    return '<details class="rank"><summary><span class="grade">'+String(i+1).padStart(2,"0")+'</span><strong>'+FAAAB.safe(x.nome)+'</strong><span class="status">'+FAAAB.safe(x.sigla)+'</span></summary><div class="rank-detail"><p><b>CDP:</b> '+FAAAB.safe(status)+'</p><p><b>Critérios registrados:</b> '+FAAAB.safe(requisitos)+'</p>'+
      (etapas.length?'<p><b>Etapas:</b> '+etapas.map(y=>FAAAB.safe(y.nome)).join(" · ")+'</p>':'')+
      '<p><b>Prazo:</b> '+FAAAB.safe(x.cdpTempoProposto||"A confirmar")+' (proposta, não aprovação final)</p></div></details>';
   }).join("")+'</div>';
  }
  for(const b of buttons)b.addEventListener("click",()=>{location.href="carreira.html?forca="+encodeURIComponent(b.dataset.forceCareer)});
  draw();
 },
 async record(){
   const data=await FAAAB.load("catalogo");
   const id=new URLSearchParams(location.search).get("id");
   const x=data.find(x=>x.id===id);const target=document.getElementById("record");
   if(!x){target.innerHTML='<h1>Registro não encontrado</h1><p>Volte ao <a href="batalhoes.html">diretório de unidades</a>.</p>';return}
   document.title=x.nome+" | FAAAB";
   const crumbs=document.getElementById("record-breadcrumb");if(crumbs)crumbs.textContent=x.nome;
   const marked=!!x.logoReferencia&&!x.logo;
   target.innerHTML='<div class="kicker">'+FAAAB.safe(FAAAB.nameForce(x.forca))+' / '+FAAAB.safe(FAAAB.types[x.tipo]||x.tipo)+'</div><h1>'+FAAAB.safe(x.nome)+'</h1>'+
   '<p class="lede">'+FAAAB.safe(x.noJogo||"Organização registrada no catálogo da FAAAB. Detalhes de implantação ainda sujeitos a confirmação.")+'</p>'+
   '<div class="document">'+(marked?'<div class="directory-entry has-logo">'+FAAAB.logo(x)+'<p>Logomarca real apenas como referência temporária. Não representa a identidade da FAAAB.</p></div>':'')+
   '<h3>Situação no projeto</h3><p>'+FAAAB.safe(x.estadoImplementacao||"Não confirmada")+'</p>'+
   '<h3 style="margin-top:20px">Referência na vida real</h3><p>'+FAAAB.safe(x.vidaReal||"Sem correspondência confirmada")+'</p>'+
   '<h3 style="margin-top:20px">Ingresso e requisitos</h3><p>'+FAAAB.safe(x.requisitos||"A confirmar")+'</p>'+
   '<h3 style="margin-top:20px">Estrutura</h3><p>'+FAAAB.safe(x.grupoSeparado===false?"Subdivisão interna; não exige grupo Roblox próprio.":"A definição sobre grupo Roblox separado ainda não foi confirmada.")+'</p>'+
   (x.fonteReferencia?'<p style="margin-top:18px"><a target="_blank" rel="noopener noreferrer" href="'+FAAAB.safe(x.fonteReferencia)+'">Fonte da marca visual usada como referência</a></p>':'')+
   '</div><a class="action" href="'+FAAAB.hrefForce(x.forca)+'">Voltar à instituição</a>';
 },
 async home(){
  const data=await FAAAB.load("historico").catch(()=>[]);
  const news=document.getElementById("updates");
  if(news)news.innerHTML=data.length?data.slice(0,3).map(x=>'<article class="news-line"><time>'+FAAAB.safe(x.data)+'</time><h3>'+FAAAB.safe(x.titulo)+'</h3><p>'+FAAAB.safe(x.descricao)+'</p></article>').join(""):'<p>Ainda não há novos registros.</p>';
 }
};
document.addEventListener("DOMContentLoaded",()=>{
 const page=document.body.dataset.page;
 const actions={home:FAAAB.home,catalogue:FAAAB.catalogue,courses:FAAAB.courses,career:FAAAB.career,record:FAAAB.record};
 if(actions[page])Promise.resolve(actions[page]()).catch(e=>{
  console.error("FAAAB:",e);
  const target=document.getElementById("listing")||document.getElementById("course-list")||document.getElementById("career-list")||document.getElementById("record")||document.getElementById("updates");
  if(target)target.textContent="Não foi possível carregar os registros neste momento. Recarregue a página.";
 });
});
