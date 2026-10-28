"use strict";
(()=>{const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));let me=null,people=[],catalog=[],courses=[],authorities=[],registry=null;
const name=p=>p.displayName||p.email||p.userKey;
const say=(t,bad=false)=>{$("staff-status").textContent=t;$("staff-status").className=bad?"role-note error":"role-note"};
async function data(file){const r=await fetch("/dados/"+file+".json",{cache:"no-store",credentials:"same-origin"});if(!r.ok)throw Error("Não abriu "+file);return r.json()}
async function post(path,payload){const r=await fetch(path,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json","x-faaab-csrf":me.csrf},body:JSON.stringify(payload)}),out=await r.json();if(!r.ok)throw Error(out.error||"Erro "+r.status);return out}
async function refresh(){
 const r=await fetch("/api/staff",{credentials:"same-origin",cache:"no-store"}),out=await r.json();if(!r.ok)throw Error(out.error||"Sem acesso");
 people=out.members||[];
 $("staff-registrations").innerHTML=people.length?people.map(p=>'<article class="role-row"><div class="role-head"><div><strong>'+esc(name(p))+'</strong><p>'+esc(p.provider.toUpperCase())+(p.email?" · E-mail verificado":'')+'</p></div><span class="status-pill '+(p.approved?"ok":"")+'">'+(p.approved?"Whitelist aprovada no banco":"Verificar whitelist")+'</span></div><div class="form-actions">'+(p.approved?'<button class="btn secondary" data-access="revoke" data-user="'+esc(p.userKey)+'">Revogar whitelist</button>':'<button class="btn primary" data-access="grant" data-user="'+esc(p.userKey)+'">Aprovar whitelist</button>')+'</div></article>').join(""):'<div class="empty">Nenhuma pessoa fez login ainda.</div>';
 const old=$("member-target").value;
 $("member-target").innerHTML='<option value="">Selecione um membro</option>'+people.map(p=>'<option value="'+esc(p.userKey)+'">'+esc(name(p))+(p.approved?" · Whitelist aprovada":" · Precisa de whitelist")+'</option>').join("");
 if(people.some(p=>p.userKey===old))$("member-target").value=old;
 $("staff-assignments").innerHTML=people.length?people.map(p=>'<article class="role-row"><strong>'+esc(name(p))+'</strong><p>'+esc(p.userKey)+'</p><div class="role-pills">'+(p.assignments.length?p.assignments.map(a=>'<span>'+esc(labelRole(a.role))+(Object.keys(a.scope||{}).length?' · '+esc(Object.values(a.scope).join(" / ")):"")+'</span>').join(""):'<span>Sem cargo</span>')+'</div>'+p.assignments.map(a=>'<button class="btn danger-outline" data-remove-role="'+esc(a.role)+'" data-user="'+esc(p.userKey)+'">Remover '+esc(labelRole(a.role))+'</button>').join(" ")+'</article>').join(""):'<div class="empty">Sem atribuições.</div>';
 say("Whitelist e cargos carregados. Aprovar whitelist e atribuir cargo são duas ações distintas.");
}
function labelRole(key){return registry?.roles?.find(r=>r.id===key)?.nome||key}
function scopeRender(){
 const role=$("role-key").value;
 $("scope-instrutor").hidden=role!=="instrutor";$("scope-governo").hidden=role!=="governo";$("scope-alto").hidden=role!=="alto_escalao";
 $("role-detail").textContent=registry?.roles?.find(x=>x.id===role)?.descricao||"Selecione o cargo.";
 if(role==="instrutor")targetRender();
}
function targetRender(){
 const type=$("instrutor-tipo").value;
 let options=[];
 if(type==="curso"){options=courses.map(x=>({id:x.id,nome:x.titulo||x.nome||x.id}))}
 else if(type==="batalhao"){options=catalog.filter(x=>/batalh|brigad|unidade|centro/i.test([x.tipo,x.nome].join(" "))).map(x=>({id:x.id,nome:x.nome}))}
 else {options=catalog.map(x=>({id:x.id,nome:x.nome}))}
 $("instrutor-target").innerHTML='<option value="">Selecione um registro</option>'+options.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.nome)+'</option>').join("");
}
function scopeFor(){
 const role=$("role-key").value;
 if(role==="instrutor")return {tipo:$("instrutor-tipo").value,targetId:$("instrutor-target").value};
 if(role==="governo")return {cargoId:$("governo-cargo").value};
 if(role==="alto_escalao")return {categoria:$("alto-categoria").value,forca:$("alto-forca").value};
 return {};
}
async function handleActions(ev){
 const btn=ev.target.closest("[data-access],[data-remove-role]");if(!btn)return;
 const userKey=btn.dataset.user,who=people.find(x=>x.userKey===userKey);if(!who)return;
 if(btn.dataset.access){
  if(!confirm((btn.dataset.access==="grant"?"Aprovar whitelist de ":"Revogar whitelist e todos os cargos de ")+name(who)+"?"))return;
  try{await post("/api/grant",{action:btn.dataset.access,userKey});await refresh()}catch(e){say("Erro: "+e.message,true)}
 }else{
  const role=btn.dataset.removeRole;
  if(!confirm("Retirar "+labelRole(role)+" de "+name(who)+"?"))return;
  try{await post("/api/staff",{action:"remove",userKey,roleKey:role});await refresh()}catch(e){say("Erro: "+e.message,true)}
 }
}
$("role-form").addEventListener("submit",async e=>{
 e.preventDefault();const userKey=$("member-target").value,roleKey=$("role-key").value,scope=scopeFor();if(!userKey||!roleKey)return;
 const p=people.find(x=>x.userKey===userKey);if(!p){say("Selecione um membro",true);return}
 if(!confirm("Atribuir "+labelRole(roleKey)+" a "+name(p)+"? Esta ação é manual."))return;
 try{await post("/api/staff",{action:"assign",userKey,roleKey,scope});await refresh()}catch(err){say("Cargo não atribuído: "+err.message,true)}
});
$("staff-registrations").addEventListener("click",handleActions);
$("staff-assignments").addEventListener("click",handleActions);
$("staff-reload").addEventListener("click",()=>refresh().catch(e=>say(e.message,true)));
$("role-key").addEventListener("change",scopeRender);
$("instrutor-tipo").addEventListener("change",targetRender);
(async()=>{try{const r=await fetch("/api/me",{credentials:"same-origin",cache:"no-store"});me=await r.json();if(me.role!=="owner"){location.replace("/membros");return}
 const values=await Promise.all([data("admin_roles"),data("catalogo"),data("cursos"),data("autoridades")]);[registry,catalog,courses,authorities]=values;
 $("role-key").innerHTML='<option value="">Escolha um cargo</option>'+registry.roles.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.nome)+'</option>').join("");
 $("governo-cargo").innerHTML='<option value="">Escolha um cargo do Governo</option>'+authorities.filter(x=>x.forca==="GOV").map(x=>'<option value="'+esc(x.id)+'">'+esc(x.nome)+'</option>').join("");
 scopeRender();await refresh()
 }catch(e){say("Não foi possível carregar a área de cargos: "+e.message,true)}})();
})();