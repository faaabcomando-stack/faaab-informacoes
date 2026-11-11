"use strict";
const H=s=>String(s??"").replace(/[&<>"']/g,x=>x==="&"?"&amp;":x==="<"?"&lt;":x===">"?"&gt;":x.charCodeAt(0)===34?"&quot;":"&#39;");
const F=[["FTB","Exército da FAAAB","Postos e graduações da força terrestre"]];
const PUBLIC_RANKS=new Set(["MAR","GNRL-E","GNRL-DIV","GNRL-BRG","CRNL","TEN-CNRL","MAJ","CPT","P-TEN","S-TEN","AAO","CDT","SUB-TEN","P-SGT","S-SGT","T-SGT","CB","SLD-1°","SLD","REC"]);
const $=id=>document.getElementById(id);let list=[],active="FTB";
function render(){
  const f=F.find(x=>x[0]===active),items=list.filter(x=>x.forca===active&&PUBLIC_RANKS.has(x.sigla)).sort((a,b)=>a.ordem-b.ordem);
  $("forces").replaceChildren();
  $("forces").closest("aside").hidden=true;
  $("rank-force-name").textContent=f[1];
  document.title="Hierarquia exclusiva do Exército | FAAAB";
  $("rank-desc").textContent="Hierarquia da "+f[1]+": "+f[2]+". Funções de comando e etapas provisórias não são listadas como patentes.";
  $("rank-stats").innerHTML='<span>'+items.length+' postos e graduações</span><span>Do maior ao menor</span><span>CDP exibida quando documentada</span>';
  $("hierarchy-list").innerHTML=items.length?items.map((x,i)=>{
    const steps=Array.isArray(x.cdpEtapas)?x.cdpEtapas:[];
    const confirmed=x.cdpStatus==="Confirmada pela FAAAB",documented=x.cdpStatus==="Registrada no manual FAAAB",proposed=x.cdpStatus?.startsWith("Proposta elaborada")||x.cdpStatus?.startsWith("Progressão indicada");
    const state=confirmed?"CDP confirmada":proposed?"CDP com etapas propostas para validação":documented?"CDP no manual":"CDP existente · detalhes a recuperar";
    const stepsHTML=steps.length?'<ol class="cdp-steps">'+steps.map(st=>'<li>'+H(st.nome)+'</li>').join("")+'</ol>':documented?'<p>Nenhum curso novo obrigatório foi indicado nesta etapa do manual. Ver critérios abaixo.</p>':'<p>Essa patente possui CDP na FAAAB, mas seus detalhes ainda não foram recuperados nos arquivos consultados.</p>';
    const rules=x.cdpCriterios?'<p><strong>Critérios registrados:</strong> '+H(x.cdpCriterios)+'</p>':"";
    return '<article class="hierarchy-item"><span class="position">'+String(i+1).padStart(2,"0")+'</span><div><div class="rank-name">'+H(x.nome)+'</div><div class="rank-class">'+H(x.classe||"Patente/graduação")+'</div></div><span class="rank-code">['+H(x.sigla)+']</span><details><summary>CDP — Capacitação de Patente · '+state+'</summary><div class="detail-content"><strong>Capacitações citadas na documentação:</strong>'+stepsHTML+rules+'<p><small>Fonte: '+H(x.cdpFonte||"Não informada")+'</small></p>'+(x.cdpTempoProposto?'<p><small>Prazo indicado anteriormente (proposta): '+H(x.cdpTempoProposto)+'</small></p>':"")+'</div></details></article>'
  }).join(""):'<div class="empty-lead">Hierarquia ainda não documentada.</div>';
}
document.addEventListener("DOMContentLoaded",async()=>{try{const r=await fetch("dados/hierarquia_eb.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);list=await r.json();const url=new URLSearchParams(location.search);if(url.get("forca")&&url.get("forca")!=="FTB"){window.location.replace("carreira.html?forca="+encodeURIComponent(url.get("forca")));return}list=list.filter(x=>x.forca==="FTB");render()}catch(e){$("hierarchy-list").textContent="Erro ao carregar a hierarquia: "+e.message}});
