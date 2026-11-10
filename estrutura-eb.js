"use strict";
/* FAAAB: árvore exclusiva FTB. Filiação sempre derivada de dados/estrutura_eb_2026.json. */
(()=>{
 const $=id=>document.getElementById(id),wrap=$("eb-content"),view=document.body.dataset.ebView||"home";
 const qs=new URLSearchParams(location.search);
 const cleanParam=x=>/^[a-z0-9-]{1,32}$/.test(x||"")?x:null;
 const selectedDiv=cleanParam(qs.get("divisao")||qs.get("id")),selectedBrig=cleanParam(qs.get("brigada"));
 const el=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=String(txt);return node};
 const a=(href,txt,cls)=>{const x=el("a",cls,txt);x.href=href;return x};
 const stateTag=x=>x?.catalogoId?"Cadastrada na FAAAB":x?.situacao||"Planejada";
 const unitLabel=x=>{
  const li=el("li"),sig=el("strong",null,x.sigla),name=x.catalogoId?a("ficha.html?id="+encodeURIComponent(x.catalogoId),x.nome):el("span",null,x.nome);
  const badge=window.FAAABEmblemas?.element(x.catalogoId,"eb-tree-mini");if(badge)li.append(badge);li.append(sig,name);if(!x.catalogoId)li.append(el("small","pending",stateTag(x)));
  return li
 };
 const unitList=items=>{const ul=el("ul","unitlist");(items||[]).forEach(x=>ul.append(unitLabel(x)));return ul};
 const paragraph=(text,cls)=>el("p",cls,text);
 const head=(title,desc)=>{
  const hdr=el("header","sect-head"),left=el("div");left.append(el("h2",null,title));if(desc)hdr.append(left,paragraph(desc));else hdr.append(left);return hdr
 };
 const divisionUrl=id=>"divisoes.html?id="+encodeURIComponent(id);
 const brigadeUrl=(divId,id)=>"brigadas.html?divisao="+encodeURIComponent(divId)+"&brigada="+encodeURIComponent(id);
 const divisionCard=d=>{
  const card=el("article","div-card");const badge=window.FAAABEmblemas?.element("FTB-"+String(d.sigla).match(/^\d+/)?.[0]+"DE","eb-tree-emblem eb-tree-division");if(badge)card.append(badge);card.append(el("span","code",d.sigla),el("h3",null,d.nome),paragraph(d.perfil+" · "+d.brigadas.length+" brigadas"));
  card.append(a(divisionUrl(d.id),"Abrir divisão e suas brigadas ↗"));return card;
 };
 function brigadeCard(d,b,showUnits=true){
  const card=el("article","brig-card");
  const brigadeLogos={"inf-selva":"FTB-Bda-Inf-Sl","inf-montanha":"FTB-Bda-Inf-Mth","inf-aeromovel":"FTB-Bda-Inf-AMV","inf-mecanizada":"FTB-Bda-Inf-Mec","cav-mecanizada":"FTB-Bda-C-Mec","inf-motorizada":"FTB-Bda-Inf-Mtz","inf-blindada":"FTB-Bda-Inf-Bld","cav-blindada":"FTB-Bda-C-Bld"};
  const badge=window.FAAABEmblemas?.element(brigadeLogos[b.id],"eb-tree-emblem eb-tree-brigade");
  if(badge)card.append(badge);
  card.append(el("span","code","Brigada · "+d.sigla),el("h4",null,b.nome));
  card.append(el("small","status",stateTag(b)));
  if(showUnits)card.append(unitList(b.unidades));
  card.append(a(brigadeUrl(d.id,b.id),"Consultar organização da brigada ↗","go"));
  return card
 }
 function divisionBlock(d,onlyBrig=null){
  const section=el("article","branch"),bar=el("div","branch-top"),lhs=el("div");lhs.append(el("span","code",d.sigla),el("h3",null,d.nome),paragraph(d.perfil));bar.append(lhs,a(divisionUrl(d.id),"Página da divisão ↗"));section.append(bar);
  const list=el("div","brig-grid");d.brigadas.filter(b=>!onlyBrig||b.id===onlyBrig).forEach(b=>list.append(brigadeCard(d,b)));
  section.append(list);return section
 }
 function unitBlock(d){
  const section=el("article","eb-unit-division"),header=el("div","eb-unit-division-head");
  header.append(el("span","code",d.sigla),el("h3",null,d.nome));
  section.append(header);
  for(const b of d.brigadas||[]){
   const group=el("section","eb-unit-group");
   group.append(el("h4",null,b.nome));
   const entries=el("div","eb-units-grid");
   for(const x of b.unidades||[]){
    const item=el(x.catalogoId?"a":"article","eb-unit-item");
    if(x.catalogoId)item.href="ficha.html?id="+encodeURIComponent(x.catalogoId);
    item.append(el("strong",null,x.sigla||"Unidade"),el("span",null,x.nome));
    if(x.catalogoId)item.append(el("small",null,"Abrir ficha da unidade ↗"));
    else item.append(el("small","pending",x.situacao||"Planejada"));
    entries.append(item);
   }
   group.append(entries);section.append(group);
  }
  return section;
 }
 function commands(data){
  const section=el("section"),headWrap=el("div","sect-head"),heading=el("div");heading.append(el("h2",null,"Comandos e apoio direto"));headWrap.append(heading,paragraph("Fora da cadeia das nove brigadas. Não são brigadas adicionais."));section.append(headWrap);
  const grid=el("div","other-commands");
  for(const c of data.comandos||[]){const card=el("article","block-card");const badge=c.id==="copesp"?window.FAAABEmblemas?.element("FTB-COpEsp","eb-tree-emblem"):null;if(badge)card.append(badge);card.append(el("span","code","Comando direto"),el("h3",null,c.nome),paragraph(c.descricao),unitList(c.unidades));grid.append(card)}
  const card=el("article","block-card");card.append(el("span","code","Estrutura de apoio"),el("h3",null,"Apoio direto do Exército"),paragraph("Organizações sem inclusão artificial em brigadas."),unitList(data.apoioDireto||[]));grid.append(card);section.append(grid);return section
 }
 function intro(page){
  const data={home:["Exército — estrutura organizacional","Divisões, brigadas e unidades do Exército da FAAAB. Nenhuma hierarquia ou organização de outras forças aparece nesta página."],divisoes:["Divisões de Exército","As brigadas aparecem dentro das divisões a que pertencem."],brigadas:["Brigadas do Exército","Todas as brigadas estão organizadas dentro da divisão correspondente; selecione uma para consultar suas unidades."],unidades:["Unidades por brigada","Batalhões, regimentos e companhias são exibidos apenas dentro de suas brigadas ou comandos." ]};
  const [title,sub]=data[page]||data.home;
  $("eb-title").textContent=title;$("eb-summary").textContent=sub;document.title=title+" | FAAAB";
 }
 function sectionTitle(text){const s=el("div","sect-head"),x=el("div");x.append(el("h2",null,text));s.append(x);return s}
 async function load(){
  try{
   const r=await fetch("dados/estrutura_eb_2026.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);
   const data=await r.json();if(data.forca!=="FTB"||!Array.isArray(data.divisoes))throw Error("Estrutura não corresponde ao Exército");
   intro(view);wrap.replaceChildren();
   const divisions=data.divisoes;
   if(selectedDiv&&!divisions.some(d=>d.id===selectedDiv)){wrap.append(el("p","note","Divisão inexistente; mostrando a estrutura oficial do projeto."))}
   const chosen=selectedDiv?divisions.filter(d=>d.id===selectedDiv):divisions;
   if(view==="home"){
    const section=el("section");section.append(head("Divisões do Exército","Três divisões que reúnem nove brigadas. Abra a divisão para conhecer suas unidades."));
    const grid=el("div","divgrid");divisions.forEach(d=>grid.append(divisionCard(d)));section.append(grid);wrap.append(section);
    wrap.append(commands(data));
   }else if(view==="unidades"){
    const section=el("section");
    section.append(head("Batalhões, regimentos e companhias","As brigadas aparecem somente como indicação de subordinação. Cada cartão abaixo é uma unidade."));
    for(const d of chosen)section.append(unitBlock(d));
    wrap.append(section);
    if(!selectedDiv)wrap.append(commands(data));
   }else{
    const section=el("section");
    const title=view==="divisoes"?"Divisões e suas brigadas":"Brigadas por divisão";
    section.append(head(title,"Hierarquia 2026 da FAAAB: divisão → brigada → unidade. Propostas são identificadas."));
    for(const d of chosen){const unit=selectedBrig&&d.brigadas.some(b=>b.id===selectedBrig)?selectedBrig:null;section.append(divisionBlock(d,unit))}
    wrap.append(section);
   }
   const note=el("div","note","O plano de 07/11/2026 distingue unidades já cadastradas e propostas. Organizações sem subordinação homologada não foram colocadas arbitrariamente em nenhuma brigada.");
   wrap.append(note);
  }catch(err){wrap.replaceChildren(el("div","note","Não foi possível consultar a estrutura atual do Exército: "+err.message))}
 }
 load();
})();