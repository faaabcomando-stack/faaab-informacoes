"use strict";
(async()=>{
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
try{
const r=await fetch("/api/me",{cache:"no-store",credentials:"same-origin"}),d=await r.json();
if(!d.loggedIn||!d.whitelisted){location.replace("/");return}
$("member-title").textContent="Olá, "+(d.user?.displayName||"membro");
$("member-status").textContent="Whitelist aprovada. Seus cargos são definidos separadamente e manualmente pelo proprietário da FAAAB.";
$("member-account").textContent=(d.user?.provider==="google"?"Google":"Roblox")+" · "+(d.user?.displayName||"Conta autenticada");
$("member-whitelist").textContent="Acesso liberado para membros";
const roles=d.roles||[];$("member-roles").innerHTML=roles.length?roles.map(x=>'<span>'+esc(x.role.replaceAll("_"," "))+'</span>').join(""):'<span>Sem cargo atribuído</span>';
const links=[{url:"/anunciadores",title:"Painel de anunciadores",desc:d.permissions?.canAnnounce?"Publicar comunicados conforme sua função":"Consultar comunicados publicados"},{url:"/painel",title:"Painel administrativo",desc:"Ferramentas de edição conforme sua atribuição",allowed:d.role==="owner"||d.role!=="membro"},{url:"/cargos",title:"Atribuir cargos",desc:"Whitelist primeiro, cargos depois",allowed:d.role==="owner"}];
$("member-links").innerHTML=links.filter(x=>x.allowed!==false).map(x=>'<a href="'+x.url+'" style="display:flex;gap:14px;justify-content:space-between"><span><b>'+x.title+'</b><small>'+esc(x.desc)+'</small></span><span>›</span></a>').join("");
}catch(e){$("member-status").textContent="Não foi possível verificar a sessão. Reabra o login do site."}
})();