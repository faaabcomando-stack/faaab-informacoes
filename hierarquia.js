"use strict";
const H=s=>String(s??"").replace(/[&<>"']/g,x=>x==="&"?"&amp;":x==="<"?"&lt;":x===">"?"&gt;":x.charCodeAt(0)===34?"&quot;":"&#39;");
const F=[["FTB","Exército Brasileiro","Terra e operações militares"],["FAB","Força Aérea Brasileira","Carreira aeronáutica"],["FMB","Marinha Brasileira","Carreira naval; CFN integra a Marinha"],["CBM","Corpo de Bombeiros Militar","Emergências e salvamento civil"],["PM","Polícia Militar","Segurança pública"]];
const $=id=>document.getElementById(id);let list=[],active="FTB";
function render(){
const f=F.find(x=>x[0]===active),items=list.filter(x=>x.forca===active).sort((a,b)=>a.ordem-b.ordem);
$("forces").innerHTML=F.map(x=>'<button class="'+(x[0]===active?"selected":"")+'" type="button" data-f="'+x[0]+'">'+H(x[1])+'<span>'+list.filter(y=>y.forca===x[0]).length+'</span></button>').join("");
$("forces").querySelectorAll("button").forEach(b=>b.onclick=()=>{active=b.dataset.f;render()});
$("rank-force-name").textContent=f[1];
$("rank-desc").textContent="Hierarquia da "+f[1]+": "+f[2]+". Patentes sem foto, nome de titular ou mandato.";
$("rank-stats").innerHTML='<span>'+items.length+' postos e graduações</span><span>Ordem: maior → menor</span><span>CDP: Capacitação de Patente</span>';
$("hierarchy-list").innerHTML=items.length?items.map((x,i)=>{
 const steps=Array.isArray(x.cdpEtapas)?x.cdpEtapas:[];
 const confirmed=steps.length&&x.cdpStatus?.startsWith("Confirmada");
 let body=confirmed?'<div class="detail-content"><strong>Etapas da CDP (confirmadas):</strong><ol class="cdp-steps">'+steps.map(a=>'<li>'+H(a.nome)+'</li>').join("")+'</ol></div>':'<div class="detail-content"><strong>CDP em revisão.</strong><p>As etapas obrigatórias desta patente ainda não estão confirmadas. Não confundir descrição de competências com CDP aprovada.</p></div>';
 if(!confirmed&&(x.requisitos||x.formacao))body+='<p><small>Manual anterior (não confirmado como CDP atual): '+H(x.requisitos||x.formacao)+'</small></p>';
 return '<article class="hierarchy-item"><span class="position">'+String(i+1).padStart(2,"0")+'</span><div><div class="rank-name">'+H(x.nome)+'</div><div class="rank-class">'+H(x.classe||"Patente/graduação")+'</div></div><span class="rank-code">['+H(x.sigla)+']</span><details><summary>CDP — Capacitação de Patente · '+(confirmed?"confirmada":"em revisão")+'</summary>'+body+'</details></article>'
}).join(""):'<div class="empty-lead">Hierarquia ainda não documentada.</div>';
}
document.addEventListener("DOMContentLoaded",async()=>{try{const r=await fetch("dados/hierarquias.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);list=await r.json();const url=new URLSearchParams(location.search);if(F.some(x=>x[0]===url.get("forca")))active=url.get("forca");render()}catch(e){$("hierarchy-list").textContent="Erro ao carregar a hierarquia: "+e.message}});
