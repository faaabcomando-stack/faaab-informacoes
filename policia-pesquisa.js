"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c==='"'?"&quot;":"&#39;");
const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
let data=[],group="",mode="prioridade",q="";
const sourceUrl=v=>{try{const u=new URL(v);return u.protocol==="https:"&&["atosnormativos.pm.df.gov.br","portal.pm.df.gov.br"].includes(u.hostname)?u.href:null}catch{return null}};
function entry(x){
const priority=x.RelevantToCurrentUnits,src=sourceUrl(x.SourceURL);
return '<article class="pm-course"><div class="pm-course-head"><div class="pm-number">'+String(x.Index).padStart(2,"0")+'</div><div class="pm-course-body"><div class="pm-overline">'+esc(x.ProposalGroup||"Outra área")+' · '+(priority?"Prioridade de pesquisa":"Opção adicional")+'</div><h3>'+esc(x.DisplayName||x.NameAsProvided)+'</h3><small>'+esc(x.ShortCode?"Sigla: "+x.ShortCode+" · ":"")+'Referência PMDF · Página '+esc(x.PDFPage??"—")+'</small></div><span class="pm-status">Não selecionado</span></div><details><summary>Ver informações da pesquisa</summary><dl><div><dt>Denominação na fonte</dt><dd>'+esc(x.NameAsProvided||"—")+'</dd></div><div><dt>Órgão apontado na fonte</dt><dd>'+esc(x.ResponsibleAsProvided||"—")+'</dd></div><div><dt>Seleção pela FAAAB</dt><dd>Não selecionado. A prioridade não representa aprovação.</dd></div><div><dt>Uniforme exclusivo</dt><dd>Não confirmado. Depende de análise por curso, função e unidade.</dd></div><div><dt>Execução da turma</dt><dd>Não comprovada apenas pelo plano de ensino.</dd></div><div><dt>Qualificação concedida</dt><dd>Não — nenhuma qualificação automática na FAAAB.</dd></div></dl>'+(src?'<a href="'+esc(src)+'" target="_blank" rel="noopener noreferrer">Consultar a referência original</a>':"")+'</details></article>'}
function draw(){
const rows=data.filter(x=>(mode==="todos"||(mode==="prioridade"?x.RelevantToCurrentUnits:!x.RelevantToCurrentUnits))&&(!group||x.ProposalGroup===group)&&norm([x.NameAsProvided,x.DisplayName,x.ShortCode,x.ProposalGroup].join(" ")).includes(norm(q)));
$("pm-count").textContent=rows.length+" opções exibidas · Nenhuma aprovada automaticamente";
$("pm-list").innerHTML=rows.length?rows.map(entry).join(""):'<div class="pm-empty">Nenhuma opção encontrada nos filtros escolhidos.</div>';
}
document.addEventListener("DOMContentLoaded",async()=>{
try{const r=await fetch("dados/pmdf_pesquisa_cursos_2026.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);const doc=await r.json();data=doc.AllResearchOptions||[];
$("pm-total").textContent=data.length;$("pm-priorities").textContent=data.filter(x=>x.RelevantToCurrentUnits).length;$("pm-selected").textContent=(doc.SelectedCourseIds||[]).length;
const groups=[...new Set(data.map(x=>x.ProposalGroup).filter(Boolean))];$("pm-group").innerHTML='<option value="">Todas as áreas</option>'+groups.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
draw()}catch(e){$("pm-list").textContent="Falha ao carregar a pesquisa: "+e.message;$("pm-count").textContent="Pesquisa indisponível."}
$("pm-search").addEventListener("input",e=>{q=e.target.value;draw()});
$("pm-filter").addEventListener("change",e=>{mode=e.target.value;draw()});
$("pm-group").addEventListener("change",e=>{group=e.target.value;draw()});
});
