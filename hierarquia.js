"use strict";
const H=s=>String(s??"").replace(/[&<>"']/g,x=>x==="&"?"&amp;":x==="<"?"&lt;":x===">"?"&gt;":x.charCodeAt(0)===34?"&quot;":"&#39;");
const F=[["FTB","Exército Brasileiro","Terra e operações militares"],["FAB","Força Aérea Brasileira","Carreira aeronáutica"],["FMB","Marinha Brasileira","Carreira naval; CFN integra a Marinha"],["CBM","Corpo de Bombeiros Militar","Emergências e salvamento civil"],["PM","Polícia Militar","Segurança pública"]];
const $=id=>document.getElementById(id);let list=[],active="FTB";
function render(){
  const f=F.find(x=>x[0]===active),items=list.filter(x=>x.forca===active).sort((a,b)=>a.ordem-b.ordem);
  $("forces").innerHTML=F.map(x=>'<button class="'+(x[0]===active?"selected":"")+'" type="button" data-f="'+x[0]+'">'+H(x[1])+'<span>'+list.filter(y=>y.forca===x[0]).length+'</span></button>').join("");
  $("forces").querySelectorAll("button").forEach(b=>b.onclick=()=>{active=b.dataset.f;render()});
  $("rank-force-name").textContent=f[1];
  $("rank-desc").textContent="Hierarquia da "+f[1]+": "+f[2]+". Todas as patentes possuem CDP. Sem fotos ou titulares nesta página.";
  $("rank-stats").innerHTML='<span>'+items.length+' patentes e graduações</span><span>Do maior ao menor</span><span>Todas possuem CDP</span>';
  $("hierarchy-list").innerHTML=items.length?items.map((x,i)=>{
    const steps=Array.isArray(x.cdpEtapas)?x.cdpEtapas:[];
    const confirmed=x.cdpStatus==="Confirmada pela FAAAB",documented=x.cdpStatus==="Registrada no manual FAAAB";
    const state=confirmed?"CDP confirmada":documented?"CDP no manual":"CDP existente · detalhes a recuperar";
    const stepsHTML=steps.length?'<ol class="cdp-steps">'+steps.map(st=>'<li>'+H(st.nome)+'</li>').join("")+'</ol>':documented?'<p>Nenhum curso novo obrigatório foi indicado nesta etapa do manual. Ver critérios abaixo.</p>':'<p>Essa patente possui CDP na FAAAB, mas seus detalhes ainda não foram recuperados nos arquivos consultados.</p>';
    const rules=x.cdpCriterios?'<p><strong>Critérios registrados:</strong> '+H(x.cdpCriterios)+'</p>':"";
    return '<article class="hierarchy-item"><span class="position">'+String(i+1).padStart(2,"0")+'</span><div><div class="rank-name">'+H(x.nome)+'</div><div class="rank-class">'+H(x.classe||"Patente/graduação")+'</div></div><span class="rank-code">['+H(x.sigla)+']</span><details><summary>CDP — Capacitação de Patente · '+state+'</summary><div class="detail-content"><strong>Capacitações citadas na documentação:</strong>'+stepsHTML+rules+'<p><small>Fonte: '+H(x.cdpFonte||"Não informada")+'</small></p>'+(x.cdpTempoProposto?'<p><small>Prazo indicado anteriormente (proposta): '+H(x.cdpTempoProposto)+'</small></p>':"")+'</div></details></article>'
  }).join(""):'<div class="empty-lead">Hierarquia ainda não documentada.</div>';
}
document.addEventListener("DOMContentLoaded",async()=>{try{const r=await fetch("dados/hierarquias.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);list=await r.json();const url=new URLSearchParams(location.search);if(F.some(x=>x[0]===url.get("forca")))active=url.get("forca");render()}catch(e){$("hierarchy-list").textContent="Erro ao carregar a hierarquia: "+e.message}});
