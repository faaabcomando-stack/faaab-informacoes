"use strict";
(()=> {
 const $=id=>document.getElementById(id);
 const s={auth:null,news:[],newsBaseline:"",newsSha:"",editing:null,config:null,configBaseline:"",configSha:""};
 const labels={visao:["Visão geral","Acompanhe conteúdos e acesse ferramentas de publicação."],noticias:["Notícias e avisos","Escreva, revise e publique comunicados conforme suas permissões."],grupos:["Verificação de grupos","Confirme vínculos Roblox sem confundir grupos, whitelist e cargos."],config:["Configurações","Gerencie a apresentação pública e as suas preferências locais."]};
 const isoToday=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
 const canNews=()=>!!s.auth?.permissions?.publishNews;
 const canConfig=()=>s.auth?.role==="owner";
 const canEditOld=()=>s.auth?.role==="owner" || !!s.auth?.permissions?.publishAllContent || (s.auth?.roles||[]).some(x=>["administrativo_aprovado","administrativo_aprovado_semitotal"].includes(x.role));
 function msg(message,failed=false){const el=$("message");el.hidden=false;el.classList.toggle("error",failed);el.textContent=message;el.scrollIntoView({behavior:"auto",block:"nearest"})}
 function section(name){if(!labels[name])return;document.querySelectorAll("[data-section]").forEach(x=>x.hidden=x.dataset.section!==name);document.querySelectorAll("[data-view]").forEach(b=>{const active=b.dataset.view===name;b.classList.toggle("active",active);b.setAttribute("aria-current",active?"page":"false")});$("view-title").textContent=labels[name][0];$("crumb-view").textContent=labels[name][0];$("view-description").textContent=labels[name][1];$("message").hidden=true;location.hash=name}
 async function getJSON(url){const r=await fetch(url,{credentials:"same-origin",cache:"no-store"});const body=await r.json().catch(()=>null);if(!r.ok)throw Error(body?.error||"Serviço indisponível (HTTP "+r.status+").");return{body,sha:(r.headers.get("etag")||"").replace(/^"|"$/g,"")}}
 async function putJSON(key,data,sha){if(!s.auth?.csrf)throw Error("Sessão sem proteção CSRF. Faça login novamente.");const r=await fetch("/api/data/"+key,{method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json","x-faaab-csrf":s.auth.csrf},body:JSON.stringify({content:JSON.stringify(data),sha})});const body=await r.json().catch(()=>({}));if(!r.ok)throw Error(body.error||"Erro de publicação (HTTP "+r.status+").");return body}
 function overview(){$("news-count").textContent=String(s.news.length);$("access-count").textContent=s.auth?.whitelisted?"Aprovado":"Pendente";$("access-sub").textContent=s.auth?.role==="owner"?"Proprietário":s.auth?.roles?.length?String(s.auth.roles.length)+" cargo(s) atribuídos":"Sem cargo de edição";$("publish-count").textContent=canNews()?"Liberada":"Restrita";$("oauth-check").textContent=s.auth?.loggedIn?"Confirmado":"Pendente";$("wl-check").textContent=s.auth?.whitelisted?"Aprovada":"Pendente";$("perm-check").textContent=canNews()?"Permitida":"Não atribuída"}
 function newsDirty(){return JSON.stringify(s.news)!==s.newsBaseline}
 function newsPending(){$("draftbar").hidden=!newsDirty();overview()}
 function clearNews(){s.editing=null;$("news-form").reset();$("news-date").value=isoToday();$("editor-heading").textContent="Novo comunicado";$("news-save").textContent="Salvar no rascunho"}
 function renderNews(){
  const target=$("news-list");target.replaceChildren();
  if(!s.news.length){const p=document.createElement("p");p.className="empty";p.textContent="Nenhuma notícia publicada. O catálogo está vazio.";target.append(p);newsPending();return}
  s.news.map((n,i)=>({n,i})).sort((a,b)=>String(b.n.data||"").localeCompare(String(a.n.data||""))).forEach(({n,i})=>{
   const wrap=document.createElement("article");wrap.className="item";
   const meta=document.createElement("div");meta.className="meta";meta.textContent=(n.categoria==="anuncio"?"PUBLICIDADE DA COMUNIDADE":n.categoria||"informativa")+" · "+(n.data||"Sem data");
   const title=document.createElement("h3");title.textContent=n.titulo||"Sem título";
   const summary=document.createElement("p");summary.textContent=n.resumo||"Sem resumo";
   wrap.append(meta,title,summary);
   if(canEditOld()&&canNews()){
    const tools=document.createElement("div");tools.className="item-buttons";
    for(const [action,label] of [["edit","Editar"],["remove","Excluir"]]){const b=document.createElement("button");b.type="button";b.dataset.index=String(i);b.dataset.action=action;b.textContent=label;if(action==="remove")b.className="danger";tools.append(b)}
    wrap.append(tools);
   }target.append(wrap);
  });newsPending()
 }
 async function loadNews(){const data=await getJSON("/dados/noticias.json");if(!Array.isArray(data.body))throw Error("Arquivo de notícias inválido.");s.news=data.body;s.newsBaseline=JSON.stringify(s.news);s.newsSha=data.sha;renderNews()}
 function saveNews(ev){
  ev.preventDefault();if(!canNews()){msg("Seu cargo não permite editar notícias.",true);return}
  const n={data:$("news-date").value,titulo:$("news-title").value.trim(),resumo:$("news-summary").value.trim(),categoria:$("news-category").value};
  if(!n.data||!n.titulo||!n.resumo){msg("Preencha todos os campos.",true);return}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(n.data)){msg("Data inválida.",true);return}
  if(s.editing!==null){if(!canEditOld()){msg("Seu cargo só pode criar novos comunicados.",true);return}s.news[s.editing]={...s.news[s.editing],...n}}else s.news.push(n);
  clearNews();renderNews();msg("Notícia salva no rascunho. Clique em Publicar para enviar ao servidor.")
 }
 function newsAction(ev){const b=ev.target.closest("button[data-action]");if(!b||!canEditOld()||!canNews())return;const i=Number(b.dataset.index),n=s.news[i];if(!n)return;
  if(b.dataset.action==="remove"){if(!confirm("Excluir esta notícia do rascunho? A exclusão só terá efeito depois de publicada."))return;s.news.splice(i,1);clearNews();renderNews();msg("Notícia removida do rascunho.");return}
  s.editing=i;$("news-date").value=n.data||isoToday();$("news-title").value=n.titulo||"";$("news-summary").value=n.resumo||"";$("news-category").value=["urgente","importante","informativa","menor_relevancia","anuncio"].includes(n.categoria)?n.categoria:"informativa";$("editor-heading").textContent="Editar comunicado";$("news-save").textContent="Atualizar rascunho";$("news-title").focus()
 }
 async function publishNews(){if(!canNews()||!newsDirty())return;if(!confirm("Publicar as alterações das notícias no GitHub?"))return;
  $("news-publish").disabled=true;try{const r=await putJSON("noticias",s.news,s.newsSha);s.newsSha=r.sha||s.newsSha;s.newsBaseline=JSON.stringify(s.news);renderNews();msg("Notícias publicadas pelo servidor. O portal atualizará depois da implantação.")}catch(e){msg(e.message,true)}finally{$("news-publish").disabled=false}
 }
 function configData(){return{versao:1,heroTitle:$("config-hero").value.trim(),heroDescription:$("config-desc").value.trim(),maintenanceEnabled:$("config-maint").checked,maintenanceNotice:$("config-maint-text").value.trim()}}
 function fillConfig(){const c=s.config||{};$("config-hero").value=c.heroTitle||"";$("config-desc").value=c.heroDescription||"";$("config-maint").checked=!!c.maintenanceEnabled;$("config-maint-text").value=c.maintenanceNotice||""}
 function configPending(){$("config-draftbar").hidden=JSON.stringify(s.config)===s.configBaseline}
 async function loadConfig(){const r=await getJSON("/dados/portal_config.json");s.config=r.body;s.configSha=r.sha;s.configBaseline=JSON.stringify(s.config);fillConfig();configPending()}
 function saveConfig(ev){ev.preventDefault();if(!canConfig()){msg("Somente o proprietário pode alterar essas configurações.",true);return}const x=configData();if(!x.heroTitle||!x.heroDescription){msg("Título e descrição são obrigatórios.",true);return}if(x.maintenanceEnabled&&!x.maintenanceNotice){msg("Informe o texto de manutenção.",true);return}s.config=x;configPending();msg("Configurações salvas no rascunho. Publique para atualizar o portal.")}
 async function publishConfig(){if(!canConfig()||JSON.stringify(s.config)===s.configBaseline)return;if(!confirm("Publicar as configurações públicas do portal FAAAB?"))return;$("config-publish").disabled=true;try{const r=await putJSON("portal_config",s.config,s.configSha);s.configSha=r.sha||s.configSha;s.configBaseline=JSON.stringify(s.config);configPending();msg("Configurações publicadas com autenticação.")}catch(e){msg(e.message,true)}finally{$("config-publish").disabled=false}}
 async function verifyGroups(){
  const target=$("group-results"),btn=$("verify-groups");btn.disabled=true;target.replaceChildren();
  try{
   const {body:data}=await getJSON("/api/groups");
   const p=document.createElement("p");p.className="help";
   if(!data.enabled){p.textContent="Verificação de grupos não configurada. Informe ao responsável os IDs oficiais que deseja verificar.";target.append(p);return}
   if(!data.checked){p.textContent="Não foi possível consultar os grupos agora. Nenhum acesso será concedido com dados inconclusivos.";target.append(p);return}
   p.textContent="ID Roblox autenticado: "+data.robloxId+". Consulta concluída.";target.append(p);
   for(const m of data.memberships||[]){const card=document.createElement("div");card.className="group-card";const title=document.createElement("strong");title.textContent=m.name||"Grupo "+m.groupId;const note=document.createElement("small");note.textContent=m.member?"Membro verificado"+(m.role?" · Cargo Roblox: "+m.role:""):"Não participa deste grupo";card.append(title,note);target.append(card)}
  }catch(e){const p=document.createElement("p");p.className="help";p.textContent="Verificação indisponível: "+e.message;target.append(p)}finally{btn.disabled=false}
 }
 function prefs(){document.body.classList.toggle("compact",$("pref-compact").checked);document.body.classList.toggle("reduced-motion",$("pref-motion").checked)}
 function savePrefs(){try{localStorage.setItem("faaab-painel-prefs-v2",JSON.stringify({compact:$("pref-compact").checked,motion:$("pref-motion").checked}))}catch{}prefs()}
 function loadPrefs(){try{const p=JSON.parse(localStorage.getItem("faaab-painel-prefs-v2")||"{}");$("pref-compact").checked=!!p.compact;$("pref-motion").checked=!!p.motion}catch{}prefs()}
 function bind(){
  $("menu").addEventListener("click",ev=>{const b=ev.target.closest("button[data-view]");if(b)section(b.dataset.view)});
  document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>section(b.dataset.jump)));
  $("news-form").addEventListener("submit",saveNews);$("news-list").addEventListener("click",newsAction);$("news-cancel").addEventListener("click",clearNews);
  $("news-reload").addEventListener("click",async()=>{if(newsDirty()&&!confirm("Descartar rascunho e recarregar do servidor?"))return;try{await loadNews();clearNews();msg("Notícias recarregadas.")}catch(e){msg(e.message,true)}});
  $("news-publish").addEventListener("click",publishNews);$("verify-groups").addEventListener("click",verifyGroups);
  $("config-form").addEventListener("submit",saveConfig);$("config-reset").addEventListener("click",()=>{fillConfig();msg("Formulário restaurado para o último rascunho salvo.")});
  $("config-publish").addEventListener("click",publishConfig);["pref-compact","pref-motion"].forEach(id=>$(id).addEventListener("change",savePrefs));
  window.addEventListener("beforeunload",ev=>{if(newsDirty()||(s.config&&JSON.stringify(s.config)!==s.configBaseline)){ev.preventDefault();ev.returnValue=""}});
 }
 async function start(){
  bind();loadPrefs();clearNews();
  try{const {body:a}=await getJSON("/api/me");if(!a.loggedIn||!a.role){location.replace("/");return}
   s.auth=a;$("username").textContent=a.user?.displayName||"Usuário Roblox";$("avatar").textContent=(a.user?.displayName||"R").slice(0,1).toUpperCase();$("user-role").textContent=a.role==="owner"?"Proprietário":a.role==="membro"?"Membro aprovado":a.role.replace(/_/g," ");$("server-status").textContent="Sessão verificada";
   if(a.role==="owner")["side-roles","quick-roles","config-roles"].forEach(id=>$(id).hidden=false);
   if(!canNews()){$("news-form").querySelectorAll("input,textarea,select,button").forEach(el=>el.disabled=true);$("news-publish").disabled=true}
   if(!canConfig()){$("config-form").querySelectorAll("input,textarea,button").forEach(el=>el.disabled=true);$("config-publish").disabled=true}
   await Promise.allSettled([loadNews().catch(e=>{msg("Não foi possível carregar notícias: "+e.message,true)}),loadConfig().catch(e=>{msg("Não foi possível carregar configurações: "+e.message,true)})]);overview();const initial=location.hash.slice(1);section(labels[initial]?initial:"visao")
  }catch(e){$("server-status").textContent="Sessão indisponível";msg("Não foi possível confirmar o acesso. Entre pelo login Roblox oficial. "+e.message,true)}
 }
 start();
})();