"use strict";
/* Diretório estático de organizações fictícias: somente registros aprovados. */
const FAAABPolitics={
 esc:s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),
 async data(){
  const response=await fetch("dados/organizacoes_politicas.json",{cache:"no-store"});
  if(!response.ok)throw Error("Catálogo de organizações indisponível");
  const rows=await response.json();
  if(!Array.isArray(rows))throw Error("Catálogo inválido");
  return rows.filter(r=>r&&r.id&&r.nome&&r.status==="aprovado"&&r.ficticia===true);
 },
 async list(){
  const host=document.getElementById("v3-political-groups-list");if(!host)return;
  const rows=await FAAABPolitics.data();
  if(!rows.length){host.innerHTML='<div class="v3-gov-empty"><h3>Nenhuma organização registrada</h3><p>A FAAAB ainda não confirmou nomes de organizações políticas fictícias. Não há filiação ou candidatura disponível por esta página.</p></div>';return}
  host.innerHTML=rows.map(r=>'<article class="v3-record-item"><span class="v3-record-code">'+FAAABPolitics.esc(r.sigla||"ORG")+'</span><div><h3><a href="governo-partido.html?id='+encodeURIComponent(r.id)+'">'+FAAABPolitics.esc(r.nome)+'</a></h3><p>'+FAAABPolitics.esc(r.descricao||"Organização fictícia registrada pela FAAAB")+'</p></div><a href="governo-partido.html?id='+encodeURIComponent(r.id)+'">Abrir ficha →</a></article>').join("");
 },
 async detail(){
  const host=document.getElementById("v3-political-group-detail");if(!host)return;
  const id=new URLSearchParams(location.search).get("id");
  const rows=await FAAABPolitics.data();
  const row=rows.find(r=>r.id===id);
  if(!row){host.innerHTML='<h2>Organização não encontrada</h2><p>Este registro não existe ou ainda não foi aprovado para exibição pública.</p>';return}
  document.title=row.nome+" | Governo FAAAB";
  host.innerHTML='<div class="v3-gov-role-single"><span class="v3-label">Organização fictícia / '+FAAABPolitics.esc(row.sigla||"")+'</span><h2>'+FAAABPolitics.esc(row.nome)+'</h2><div class="v3-gov-detail-line"><h3>Apresentação</h3><p>'+FAAABPolitics.esc(row.descricao||"Descrição ainda não publicada")+'</p></div><div class="v3-gov-detail-line"><h3>Filiação</h3><p>A pessoa ingressa como <strong>Membro</strong> e não recebe outro cargo automaticamente.</p></div><div class="v3-gov-detail-line"><h3>Nomeações e funções</h3><p>A função depende de decisão expressa do presidente responsável e de autorização para alterar as funções, sem concessão automática de poderes administrativos.</p></div><div class="v3-gov-detail-line"><h3>Situação</h3><p>Organização aprovada para constar no catálogo da FAAAB; a integração Roblox, caso aplicável e permitida pelas normas, depende do backend.</p></div></div>';
 }
};
document.addEventListener("DOMContentLoaded",()=>{
 const target=document.getElementById("v3-political-groups-list")||document.getElementById("v3-political-group-detail");
 if(!target)return;
 (target.id==="v3-political-groups-list"?FAAABPolitics.list():FAAABPolitics.detail()).catch(e=>{console.error("Diretório fictício FAAAB",e);target.textContent="Não foi possível carregar os registros desta página.";});
});
