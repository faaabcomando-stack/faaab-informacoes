"use strict";
(()=>{const $=id=>document.getElementById(id),e=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let me=null,sha=null,noticias=[];
const fmt=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
function render(){const all=noticias.slice().sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));$("ann-feed").innerHTML=all.length?all.map(n=>'<article class="ann-article"><time>'+e(n.data||"Sem data")+'</time><h3>'+e(n.titulo||"Sem título")+'</h3><p>'+e(n.resumo||"")+'</p></article>').join(""):'<div class="empty">Nenhum anúncio publicado até agora.</div>'}
async function refresh(){const r=await fetch("/dados/noticias.json",{credentials:"same-origin",cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);sha=(r.headers.get("etag")||"").replace(/^"|"$/g,"");noticias=await r.json();render()}
$("ann-form").addEventListener("submit",async ev=>{ev.preventDefault();if(!me?.permissions?.canAnnounce)return;
const titulo=$("ann-title").value.trim(),resumo=$("ann-text").value.trim(),data=$("ann-date").value;if(!titulo||!resumo||!data)return;
if(!confirm("Publicar este comunicado no site da FAAAB?"))return;
const button=$("ann-form").querySelector('button[type="submit"]');button.disabled=true;
try{
 const body=[...noticias,{data,titulo,resumo}],r=await fetch("/api/data/noticias",{method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json","x-faaab-csrf":me.csrf},body:JSON.stringify({sha,content:JSON.stringify(body)})});
 const out=await r.json();if(!r.ok)throw Error(out.error||"Falha ao publicar");
 $("ann-form").reset();$("ann-date").value=fmt();$("ann-status").textContent="Anúncio registrado com sucesso no GitHub. A atualização pública seguirá a publicação do site.";await refresh();
}catch(err){$("ann-status").textContent="Erro: "+err.message+" — recarregue para obter a versão atual se outro administrador publicou."}finally{button.disabled=false}
});
(async()=>{try{const r=await fetch("/api/me",{credentials:"same-origin",cache:"no-store"}),d=await r.json();if(!d.whitelisted){location.replace("/");return}me=d;$("ann-date").value=fmt();const allowed=!!d.permissions?.canAnnounce;$("ann-editor").hidden=!allowed;$("ann-status").textContent=allowed?"Você pode publicar anúncios conforme seu cargo atribuído.":"Seu acesso como membro permite consultar notícias. Para publicar, é necessário receber o cargo Jornalista ou outra autorização manual.";await refresh()}catch(e){$("ann-status").textContent="Não foi possível carregar anúncios: "+e.message}})();
})();