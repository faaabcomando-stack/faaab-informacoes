"use strict";
(() => {
const REPO="faaabcomando-stack/faaab-informacoes";
const OWNER="faaabcomando-stack";
const $=id=>document.getElementById(id);
const escapeText=v=>String(v??"").replace(/[&<>"']/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c==='"'?"&quot;":"&#39;");
const copy=v=>JSON.parse(JSON.stringify(v));
const nowDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const states={data:Object.create(null),baseline:Object.create(null),sha:Object.create(null),pending:Object.create(null),dirty:new Set(),current:"inicio",editingNews:null,auth:null};
const titles={
 inicio:["Painel editorial","Visão geral","Tudo organizado para administrar a central da FAAAB."],
 noticias:["Comunicação institucional","Notícias e avisos","Cadastre, corrija ou exclua comunicados com formulário simples."],
 comando:["Direção e autoridades","Titulares do comando","Atualize o ocupante de cargos de Governo e comando, sem confundir com patentes."],
 whitelist:["Acessos aprovados","Whitelist de acesso","Aprove contas Roblox para entrar no painel após autenticação verificada."],
 comandos:["Atalhos","Comandos rápidos","Execute comandos que modificam somente os rascunhos do painel."],
 avancado:["Configurações","Editor avançado","Edite arquivos JSON quando não houver formulário, mantendo validação de estrutura."]
};
const fileNames=["noticias","autoridades","admin_whitelist","catalogo","hierarquias","cursos","sistemas","historico","geral","pm_progressao"];
const arrayFiles=new Set(["noticias","autoridades","catalogo","hierarquias","cursos","sistemas","historico"]);
function notice(message,error=false){
 const el=$("notification");el.hidden=false;el.textContent=message;el.classList.toggle("error",!!error);
}
function hideNotice(){$("notification").hidden=true}
function syncPending(){
 const count=states.dirty.size;
 $("changes-count").textContent=count?count+" arquivo"+(count===1?" alterado":"s alterados"):"Nenhuma alteração";
 $("metric-dirty").textContent=count;
 $("publish-title").textContent=count?count+" arquivo"+(count===1?" pronto":"s prontos")+" para publicação":"Sem alterações pendentes";
 $("publish-desc").textContent=count?"Publique com seu login autorizado ou baixe um ZIP.":"Não há alterações pendentes.";
 ["download-package","download-bottom"].forEach(id=>$(id).disabled=!count); ["publish-server","publish-bottom"].forEach(id=>$(id).disabled=!count||!["owner","editor"].includes(states.auth?.role));
}
async function load(name){
 if(Object.prototype.hasOwnProperty.call(states.data,name))return states.data[name];
 if(states.pending[name])return states.pending[name];
 if(!fileNames.includes(name))throw Error("Arquivo não permitido");
 states.pending[name]=(async()=>{
  const result=await fetch("dados/"+name+".json",{cache:"no-store"});
  if(!result.ok){if(name==="noticias"&&result.status===404)return [];throw Error("Falha ao carregar "+name+".json (HTTP "+result.status+")")}
  const parsed=await result.json();
  states.sha[name]=(result.headers.get("etag")||"").replace(/^"|"$/g,"");
  states.data[name]=copy(parsed);
  states.baseline[name]=JSON.stringify(parsed);
  return states.data[name];
 })();
 try{
  const res=await states.pending[name];
  if(name==="noticias"&&!Object.prototype.hasOwnProperty.call(states.data,name)){
   states.data[name]=copy(res);states.baseline[name]=JSON.stringify(res)
  }
  return states.data[name];
 }finally{delete states.pending[name]}
}
function setData(name,value){
 if(!Object.prototype.hasOwnProperty.call(states.baseline,name))throw Error("Arquivo não carregado");
 states.data[name]=copy(value);
 if(JSON.stringify(value)===states.baseline[name])states.dirty.delete(name);else states.dirty.add(name);
 syncPending();
 if(name==="noticias"){renderNews();$("metric-news").textContent=value.length}
 if(name==="autoridades"){renderOffices();$("metric-offices").textContent=value.length}
 if(name==="admin_whitelist"){renderWhitelist();$("metric-members").textContent=value.membros.length}
 if(states.current==="avancado"&&$("advanced-file").value===name)refreshAdvanced();
}
async function switchView(view){
 if(!titles[view])return;
 try{
 const needed={inicio:["noticias","autoridades","admin_whitelist"],noticias:["noticias"],comando:["autoridades"],whitelist:["admin_whitelist"],comandos:[],avancado:[$("advanced-file").value]};await Promise.all(needed[view].map(load));
 states.current=view;
 for(const section of document.querySelectorAll(".view"))section.hidden=section.id!=="view-"+view;
 for(const b of document.querySelectorAll("#admin-nav button")){const selected=b.dataset.view===view;b.classList.toggle("nav-active",selected);b.setAttribute("aria-current",selected?"page":"false")}
 const [eyebrow,title,subtitle]=titles[view];$("view-eyebrow").textContent=eyebrow;$("view-title").textContent=title;$("view-desc").textContent=subtitle;
 if(view==="inicio")renderOverview();
 if(view==="noticias")renderNews();
 if(view==="comando")renderOffices();
 if(view==="whitelist")renderWhitelist();
 if(view==="avancado")refreshAdvanced();
 hideNotice();
 if(history.replaceState)history.replaceState(null,"","#"+view);
 }catch(e){notice("Não foi possível abrir a seção: "+e.message,true)}
}
function renderOverview(){
 $("metric-news").textContent=(states.data.noticias||[]).length;
 $("metric-offices").textContent=(states.data.autoridades||[]).length;
 $("metric-members").textContent=states.data.admin_whitelist?.membros?.length??0;
 syncPending();
}
function newsFormClear(){
 $("news-form").reset();states.editingNews=null;$("news-index").value="";
 $("news-date").value=nowDate();$("news-form-title").textContent="Novo comunicado";
}
function renderNews(){
 const list=states.data.noticias||[];
 $("news-list").innerHTML=list.length?list.slice().map((n,i)=>({item:n,index:i})).sort((a,b)=>String(b.item.data||"").localeCompare(String(a.item.data||""))).map(({item,index})=>'<div class="item"><span class="item-label">'+escapeText(item.data||"Sem data")+'</span><strong>'+escapeText(item.titulo||"Sem título")+'</strong><p>'+escapeText(item.resumo||"")+'</p><div class="item-actions"><button type="button" data-news-action="editar" data-index="'+index+'">Editar</button><button type="button" class="remove" data-news-action="remover" data-index="'+index+'">Remover</button></div></div>').join(""):'<div class="empty">Nenhuma notícia registrada. Crie a primeira no formulário.</div>';
}
function saveNews(ev){
 ev.preventDefault();const arr=copy(states.data.noticias);
 const data=$("news-date").value, titulo=$("news-title").value.trim(), resumo=$("news-summary").value.trim();
 if(!data||!titulo||!resumo){notice("Preencha todos os campos da notícia.",true);return}
 const entry={data,titulo,resumo};
 if(states.editingNews===null){arr.push(entry)}else{if(!arr[states.editingNews]){notice("Notícia não encontrada.",true);return}arr[states.editingNews]={...arr[states.editingNews],...entry}}
 setData("noticias",arr);newsFormClear();notice("Comunicado salvo no rascunho. Para publicar, baixe as alterações e envie ao GitHub.");
}
function newsAction(ev){
 const target=ev.target.closest("[data-news-action]");if(!target)return;
 const action=target.dataset.newsAction,index=Number(target.dataset.index),data=states.data.noticias[index];if(!data)return;
 if(action==="editar"){states.editingNews=index;$("news-index").value=index;$("news-date").value=data.data||"";$("news-title").value=data.titulo||"";$("news-summary").value=data.resumo||"";$("news-form-title").textContent="Editar comunicado";$("news-title").focus()}
 if(action==="remover"){if(!confirm("Remover este comunicado do rascunho?"))return;const arr=copy(states.data.noticias);arr.splice(index,1);setData("noticias",arr);newsFormClear();notice("Notícia removida apenas do rascunho.")}
}
function offices(){
 return Array.isArray(states.data.autoridades)?states.data.autoridades:[];
}
function renderOffices(){
 const force=$("office-force").value,filtered=offices().filter(x=>x.forca===force);
 const oldId=$("office-select").value;
 $("office-select").innerHTML=filtered.map(x=>'<option value="'+escapeText(x.id)+'">'+escapeText(x.nome)+'</option>').join("");
 if(filtered.some(x=>x.id===oldId))$("office-select").value=oldId;
 renderOffice();
}
function getOffice(){return offices().find(x=>x.id===$("office-select").value)}
function renderOffice(){
 const o=getOffice();
 if(!o){$("office-preview").textContent="Não há cargos documentados para esta instituição.";return}
 const person=o.titular?.username||"Não definido",former=(o.anteriores||[]).length;
 $("office-preview").innerHTML='<strong>'+escapeText(o.nome)+'</strong><p><b>Titular atual:</b> '+escapeText(person)+'</p><p><b>Ex-ocupantes registrados:</b> '+former+' · <b>Mandato:</b> '+escapeText(o.duracaoMandato||"Não definido")+'</p>';
 $("office-username").value=o.titular?.username||"";
 $("office-robloxid").value=o.titular?.robloxId||"";
 $("office-start").value=o.inicioMandato||"";
 $("office-end").value=o.fimMandato||"";
 $("office-duration").value=o.duracaoMandato||"";
}
function readHolder(){
 const username=$("office-username").value.trim(),robloxId=$("office-robloxid").value.trim();
 if(!username){notice("Informe o usuário Roblox do titular.",true);return null}
 if(robloxId&&!/^\d{1,18}$/.test(robloxId)){notice("ID Roblox precisa ter de 1 a 18 dígitos.",true);return null}
 return {username,robloxId:robloxId||null,avatarUrl:null}
}
function officeSave(ev){
 ev.preventDefault();const holder=readHolder(),current=getOffice();if(!holder||!current)return;
 const all=copy(offices()),o=all.find(x=>x.id===current.id);
 o.titular={...o.titular,...holder};
 o.inicioMandato=$("office-start").value.trim()||null;
 o.fimMandato=$("office-end").value.trim()||null;
 o.duracaoMandato=$("office-duration").value.trim()||null;
 setData("autoridades",all);notice("Titular atualizado no rascunho: "+o.nome+".");
}
function officeFormer(){
 const holder=readHolder(),current=getOffice();if(!holder||!current)return;
 const all=copy(offices()),o=all.find(x=>x.id===current.id);
 const period=[$("office-start").value.trim(),$("office-end").value.trim()].filter(Boolean).join(" — ")||"Não definido";
 o.anteriores=Array.isArray(o.anteriores)?o.anteriores:[];
 if(o.anteriores.some(x=>x.username===holder.username&&x.periodo===period)){notice("Este registro já consta no histórico.",true);return}
 o.anteriores.push({...holder,periodo:period});setData("autoridades",all);notice("Ex-titular adicionado ao histórico do cargo "+o.nome+".");
}
function officeVacate(){
 const current=getOffice();if(!current)return;
 if(!confirm("Marcar "+current.nome+" como vago? O titular atual NÃO será adicionado automaticamente ao histórico."))return;
 const all=copy(offices()),o=all.find(x=>x.id===current.id);o.titular=null;o.inicioMandato=null;o.fimMandato=null;
 setData("autoridades",all);notice("Cargo marcado como vago no rascunho.");
}
function robloxName(value){const nick=String(value||"").trim().replace(/^@/,"");return /^[A-Za-z0-9_]{3,20}$/.test(nick)?nick:null}
function whitelistData(){return states.data.admin_whitelist}
function isOwner(){return states.auth?.role==="owner"}
function renderWhitelist(){
 const body=whitelistData();if(!body||!Array.isArray(body.membros))return;
 $("whitelist-list").innerHTML='<div class="item"><span class="item-label">Proprietário</span><strong>FAAAB</strong><p>Acesso verificado pelo servidor OAuth.</p></div>'+(body.membros.length?body.membros.map((x,i)=>'<div class="item"><span class="item-label">Acesso '+escapeText(x.perfil==="editor"?"Editor":"Revisor")+'</span><strong>@'+escapeText(x.robloxUsername||x.robloxId||"Google autorizado")+'</strong><p>'+escapeText(x.robloxId?"ID Roblox: "+x.robloxId+" · ":"")+(x.robloxId?"Conta identificada. ":"Identificação validada pelo servidor ao entrar. ")+escapeText(x.observacao||"")+'</p><div class="item-actions">'+(isOwner()?'<button class="remove" type="button" data-whitelist-delete="'+i+'">Revogar acesso</button>':"")+'</div></div>').join(""):'<div class="empty">Nenhum usuário além do proprietário.</div>');
 $("whitelist-form").querySelectorAll("input,select,textarea,button").forEach(el=>el.disabled=!isOwner());
}
function whitelistAdd(user,role,note,id=""){
 if(!isOwner())throw Error("Somente o proprietário pode adicionar membros.");
 const nick=robloxName(user);if(!nick)throw Error("Digite o nickname verdadeiro do Roblox.");
 if(!["editor","revisor"].includes(role))throw Error("Função deve ser editor ou revisor.");
 const robloxId=String(id||"").trim();if(robloxId&&!/^\d{1,20}$/.test(robloxId))throw Error("ID do Roblox inválido.");
 const obj=copy(whitelistData());if(!Array.isArray(obj.membros))throw Error("Whitelist inválida.");
 if(obj.membros.some(x=>x.robloxUsername?.toLowerCase()===nick.toLowerCase()||(robloxId&&String(x.robloxId||"")===robloxId)))throw Error("Esse usuário já está autorizado.");
 obj.membros.push({robloxUsername:nick,robloxId:robloxId||null,perfil:role,observacao:note||"",autorizacao:"oauth-roblox-verificado"});
 setData("admin_whitelist",obj);return nick
}
function whitelistRemove(user){
 if(!isOwner())throw Error("Somente o proprietário pode revogar acessos.");
 const nick=robloxName(user);if(!nick)throw Error("Nickname Roblox inválido.");
 const obj=copy(whitelistData()),len=obj.membros.length;
 obj.membros=obj.membros.filter(x=>x.robloxUsername?.toLowerCase()!==nick.toLowerCase());
 if(obj.membros.length===len)throw Error("Usuário não encontrado.");
 setData("admin_whitelist",obj);
}
function whitelistSubmit(ev){
 ev.preventDefault();
 try{const nick=whitelistAdd($("whitelist-user").value,$("whitelist-role").value,$("whitelist-note").value.trim(),$("whitelist-id").value);
 $("whitelist-form").reset();notice("@"+nick+" incluído no rascunho da whitelist. Publique para conceder acesso.");}catch(e){notice(e.message,true)}
}
function whitelistDelete(ev){
 const b=ev.target.closest("[data-whitelist-delete]");if(!b)return;
 const member=whitelistData().membros[Number(b.dataset.whitelistDelete)];if(!member)return;
 if(!confirm("Revogar o acesso de @"+member.robloxUsername+" após publicação?"))return;
 try{whitelistRemove(member.robloxUsername);notice("Acesso revogado no rascunho. Publique a alteração.");}catch(e){notice(e.message,true)}
}
function commandOutput(line,error=false){
 const el=$("command-output");el.textContent=line;el.style.borderLeftColor=error?"#bd6a60":"#8cab8c"
}
async function executeCommand(ev){
 ev.preventDefault();
 const raw=$("command-input").value.trim(),tokens=raw.split(/\s+/),action=(tokens[0]||"").toLowerCase();
 try{
 if(action==="/ajuda"){commandOutput("COMANDOS DO PAINEL (apenas rascunho)\n/ajuda\n/status\n/wl listar\n/wl adicionar <github> <editor|revisor>\n/wl remover <github>\n/noticia Título | Texto do comunicado\n/titular <ID_DO_CARGO> <USUARIO_ROBLOX> [ID_ROBLOX]\n\nNenhum comando modifica Roblox ou GitHub diretamente.");return}
 if(action==="/status"){commandOutput("Arquivos alterados: "+(states.dirty.size?[...states.dirty].join(", "):"nenhum")+".\nGitHub: exige publicação manual autorizada.");return}
 if(action==="/wl"){await load("admin_whitelist");const sub=tokens[1]?.toLowerCase();if(sub==="listar"){const members=whitelistData().membros;commandOutput(members.length?members.map(x=>"@"+x.github+" ("+x.perfil+")").join("\n"):"Lista editorial vazia; proprietário @"+OWNER);return}if(sub==="adicionar"||sub==="add"){const id=whitelistAdd(tokens[2],(tokens[3]||"").toLowerCase(),"Adicionado por comando editorial.");commandOutput("@"+id+" adicionado ao cadastro. Acesso GitHub não alterado.");return}if(sub==="remover"||sub==="remove"){whitelistRemove(tokens[2]);commandOutput("Cadastro de @"+tokens[2]+" removido. Acesso GitHub não alterado.");return}throw Error("Use /wl listar, /wl adicionar usuario editor, ou /wl remover usuario")}
 if(action==="/noticia"){await load("noticias");const rest=raw.slice(tokens[0].length).trim(),split=rest.indexOf("|");if(split<1)throw Error("Use /noticia Título | Texto do comunicado");const titulo=rest.slice(0,split).trim(),resumo=rest.slice(split+1).trim();if(!titulo||!resumo||titulo.length>150||resumo.length>2500)throw Error("Título ou conteúdo inválido.");const all=copy(states.data.noticias);all.push({data:nowDate(),titulo,resumo});setData("noticias",all);commandOutput("Notícia adicionada ao rascunho: "+titulo);return}
 if(action==="/titular"){await load("autoridades");const id=tokens[1],username=tokens[2],robloxId=tokens[3]||null;if(!id||!username)throw Error("Use /titular GOV-PRE NomeDoJogador 123456789");if(robloxId&&!/^\d{1,18}$/.test(robloxId))throw Error("ID Roblox inválido.");const all=copy(offices()),entry=all.find(x=>x.id.toLowerCase()===id.toLowerCase());if(!entry)throw Error("Cargo não encontrado. Consulte os IDs na lista de autoridades do JSON.");entry.titular={username,robloxId,avatarUrl:null};setData("autoridades",all);commandOutput("Titular de "+entry.nome+" registrado no rascunho: "+username+".");return}
 throw Error("Comando não reconhecido. Digite /ajuda.");
 }catch(e){commandOutput("ERRO: "+e.message,true)}
}
function validateAdvanced(name,data){
 if(arrayFiles.has(name)&&!Array.isArray(data))throw Error("Esse arquivo deve conter uma lista JSON.");
 if(name==="admin_whitelist"){
  if(!data||!Array.isArray(data.membros)||data.proprietarioGitHub!==OWNER)throw Error("A whitelist deve conter membros e manter o proprietário "+OWNER+".");
  const seen=new Set();for(const m of data.membros){const user=githubName(m.github);if(!user||user===OWNER||seen.has(user)||!["editor","revisor"].includes(m.perfil))throw Error("Cadastro de whitelist inválido ou duplicado: "+String(m.github));seen.add(user)}
 }
 if(name==="pm_progressao"&&(!Array.isArray(data.regras)||!data.aprovacao))throw Error("Progressão PM deve incluir regras e aprovação.");
 if(name==="geral"&&(typeof data!=="object"||data===null))throw Error("Conteúdo de geral.json inválido.");
}
async function advancedLoad(){
 try{const name=$("advanced-file").value;await load(name);refreshAdvanced()}catch(e){notice("Falha no editor avançado: "+e.message,true)}
}
function refreshAdvanced(){
 const name=$("advanced-file").value;if(!Object.prototype.hasOwnProperty.call(states.data,name))return;
 $("advanced-json").value=JSON.stringify(states.data[name],null,2);
 $("advanced-info").textContent="Editando dados/"+name+".json no rascunho. Clique em Validar e aplicar antes de trocar de arquivo.";
}
function advancedApply(){
 const name=$("advanced-file").value;
 try{const data=JSON.parse($("advanced-json").value);validateAdvanced(name,data);setData(name,data);notice(name+".json validado e aplicado ao rascunho.")}catch(e){notice("JSON não aplicado: "+e.message,true)}
}
function crc32(buffer){let crc=0xffffffff;for(const b of buffer){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function put16(view,offset,value){view.setUint16(offset,value,true)}
function put32(view,offset,value){view.setUint32(offset,value>>>0,true)}
function zipFiles(files){
 const utf8=new TextEncoder(),pieces=[],central=[];let offset=0,centralSize=0;
 for(const [name,content] of files){
  const fn=utf8.encode(name),data=utf8.encode(content),checksum=crc32(data);
  const h=new Uint8Array(30);const v=new DataView(h.buffer);
  put32(v,0,0x04034b50);put16(v,4,20);put16(v,6,0x0800);put16(v,8,0);
  put32(v,14,checksum);put32(v,18,data.length);put32(v,22,data.length);put16(v,26,fn.length);
  pieces.push(h,fn,data);
  const ch=new Uint8Array(46),cv=new DataView(ch.buffer);
  put32(cv,0,0x02014b50);put16(cv,4,20);put16(cv,6,20);put16(cv,8,0x0800);put16(cv,10,0);
  put32(cv,16,checksum);put32(cv,20,data.length);put32(cv,24,data.length);put16(cv,28,fn.length);put32(cv,42,offset);
  central.push(ch,fn);centralSize+=ch.length+fn.length;offset+=h.length+fn.length+data.length;
 }
 const end=new Uint8Array(22),view=new DataView(end.buffer);
 put32(view,0,0x06054b50);put16(view,8,files.length);put16(view,10,files.length);put32(view,12,centralSize);put32(view,16,offset);
 return new Blob([...pieces,...central,end],{type:"application/zip"})
}
function downloadPackage(){
 const names=[...states.dirty];if(!names.length)return;
 const payload=names.map(name=>[name+".json",JSON.stringify(states.data[name],null,2)+"\n"]);
 const zip=zipFiles(payload),url=URL.createObjectURL(zip),anchor=document.createElement("a");
 anchor.href=url;anchor.download="faaab-alteracoes-"+nowDate()+".zip";
 document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),12000);
 notice("ZIP gerado com "+names.length+" JSON. Extraia os arquivos e envie para a pasta dados/ no GitHub com sua conta autorizada. Ainda não foram publicados.");
}
window.addEventListener("beforeunload",e=>{if(states.dirty.size){e.preventDefault();e.returnValue=""}});
$("admin-nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)switchView(b.dataset.view)});
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.go)));
$("news-form").addEventListener("submit",saveNews);
$("news-list").addEventListener("click",newsAction);
$("news-cancel").addEventListener("click",newsFormClear);
$("office-force").addEventListener("change",renderOffices);
$("office-select").addEventListener("change",renderOffice);
$("office-form").addEventListener("submit",officeSave);
$("office-former").addEventListener("click",officeFormer);
$("office-vacate").addEventListener("click",officeVacate);
$("whitelist-form").addEventListener("submit",whitelistSubmit);
$("whitelist-list").addEventListener("click",whitelistDelete);
$("command-form").addEventListener("submit",executeCommand);
document.querySelectorAll("[data-example]").forEach(b=>b.addEventListener("click",()=>{$("command-input").value=b.dataset.example;$("command-input").focus()}));
$("advanced-file").addEventListener("change",advancedLoad);
$("advanced-apply").addEventListener("click",advancedApply);
$("advanced-reload").addEventListener("click",refreshAdvanced);
$("download-package").addEventListener("click",downloadPackage);
$("download-bottom").addEventListener("click",downloadPackage);
newsFormClear();syncPending();
const init=(location.hash||"").slice(1);
switchView(titles[init]?init:"inicio");
})();
