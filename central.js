"use strict";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,query,where,limit,setDoc,updateDoc,addDoc,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const formatDate=v=>{if(!v)return "Data não informada";const d=v?.toDate?v.toDate():new Date(v);return isNaN(d)?"Data não informada":d.toLocaleString("pt-BR",{dateStyle:"medium",timeStyle:"short"})};
const s={app:null,auth:null,db:null,me:null,profile:null,seed:null,roleCatalog:null,posts:[],exams:[],selectedTopic:null,selectedPath:null,scopeSources:null,allExams:null,paths:[],catalogLimit:20};
const catalogue=()=>s.paths.length?s.paths:s.seed?.trilhas||[];
const validTab=new Set(["noticias","avisos","marketing","provas","estudos","publicar","administracao"]);
function safeSource(url){
 try{const u=new URL(url);return u.protocol==="https:"&&[
 "www.vunesp.com.br","www.marinha.mil.br","www.fab.mil.br",
 "www2.fab.mil.br","ingresso.eear.fab.mil.br","portaldeeducacao.eb.mil.br",
 "cigs.eb.mil.br","www.cipqdt.eb.mil.br"
 ].includes(u.hostname)?u.href:null}catch{return null}
}
const resultLabel={
 prova_escrita_publica:"Prova pública relacionada",
 avaliacao_interna:"Avaliação ou seleção interna",
 sem_prova_publica_comprovada:"Sem prova pública comprovada",
 organizacao_sem_prova_propria:"Organização, sem prova própria"
};
function catalogRows(){
 if(!s.allExams)return [];
 const q=$("catalog-search").value.trim().toLocaleLowerCase("pt-BR"),force=$("catalog-force").value,type=$("catalog-type").value,status=$("catalog-status").value;
 return s.allExams.registros.filter(x=>(!force||x.forca===force)&&(!type||x.tipo===type)&&(!status||x.situacaoProva===status)&&(!q||[x.nome,x.forca,x.sigla,x.tipo,x.origemId,x.observacao,x.efeitoDocumentado].join(" ").toLocaleLowerCase("pt-BR").includes(q)));
}
function renderCatalog(){
 if(!s.allExams)return;
 const list=catalogRows(),count=list.length,visible=list.slice(0,s.catalogLimit);
 $("catalog-count").textContent=count+" registro(s) encontrado(s) · "+s.allExams.registros.length+" fichas FAAAB indexadas";
 $("catalog-records").innerHTML=visible.length?visible.map(x=>{
  const url=safeSource(x.referenciaUrl),status=x.situacaoProva;
  return '<article class="catalog-card"><div class="meta"><span>'+esc(x.forca)+'</span><span>'+esc(x.tipo)+'</span><span>'+esc(x.origem==="curso"?"Registro de formação":"Unidade ou instituição")+'</span></div>'+
   '<h3>'+esc(x.nome)+'</h3><p class="status '+(status==="prova_escrita_publica"?"publica":status==="avaliacao_interna"?"interna":"")+'">'+esc(resultLabel[status]||"Situação não definida")+'</p>'+
   (x.efeitoDocumentado?'<p><b>Resultado/ingresso no manual:</b> '+esc(x.efeitoDocumentado)+'</p>':"")+
   '<p><b>Estado na FAAAB:</b> '+esc(x.estadoFAAAB||"Não confirmado")+'</p><p>'+esc((x.observacao||x.formaAcesso||"") .slice(0,320))+'</p>'+
   '<div class="links"><button type="button" data-catalog-study="'+esc(x.id)+'">Ficha e estudo</button>'+(url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">Fonte real relacionada</a>':"")+'</div></article>';
 }).join(""):'<div class="empty">Nenhum registro corresponde aos filtros.</div>';
 $("catalog-more").hidden=count<=s.catalogLimit;
 $("catalog-summary").textContent="Todos os "+s.allExams.registros.length+" registros da FAAAB: cursos, centros, batalhões, brigadas, escolas e demais instituições, inclusive sem prova escrita pública.";
}
function renderReferences(){
 if(!s.allExams)return;
 const refs=s.allExams.referenciasReais.filter(x=>x.id!=="cfn-music");
 $("reference-list").innerHTML=refs.map(x=>'<article class="reference-card"><span class="eyebrow">'+esc(x.forca)+' · '+esc(resultLabel[x.kind]||"Formação")+'</span><strong>'+esc(x.title)+'</strong><p>'+esc(x.notes)+'</p>'+(safeSource(x.url)?'<a href="'+esc(safeSource(x.url))+'" rel="noopener noreferrer" target="_blank">Consultar acervo/edital oficial ou organizador</a>':"")+'</article>').join("");
}
function buildStudyPaths(){
 const existing=(s.seed?.trilhas||[]).filter(x=>x.id!=="cfn-musico-ref").map(x=>({...x,tipo:"referencia"}));
 const records=(s.allExams?.registros||[]).map(x=>({
  id:x.id,tipo:x.tipo,titulo:x.nome,situacao:resultLabel[x.situacaoProva]||"Situação não documentada",
  edital:safeSource(x.referenciaUrl),provasAnteriores:safeSource(x.referenciaUrl),
  orientacao:"Essa ficha existe no catálogo da FAAAB, mas não é uma prova aberta nem concede patente.",
  detalhes:x, materias:[]
 }));
 s.paths=[...records,...existing];
 const types=[...new Set(s.paths.map(x=>x.tipo))].map(id=>({id,nome:({referencia:"Referências com estudo documentado",curso:"Cursos e formações",centro:"Centros",unidade:"Batalhões e unidades",brigada:"Brigadas",escola:"Escolas",academia:"Academias",subdivisao:"Subdivisões",administracao:"Administração",instituicao:"Instituições"})[id]||id}));
 fillSelect("study-type",types,"Escolha o tipo");
}
["catalog-search","catalog-force","catalog-type","catalog-status"].forEach(id=>$(id).addEventListener(id==="catalog-search"?"input":"change",()=>{s.catalogLimit=20;renderCatalog()}));
$("catalog-more").addEventListener("click",()=>{s.catalogLimit+=20;renderCatalog()});
$("catalog-records").addEventListener("click",ev=>{
 const btn=ev.target.closest("[data-catalog-study]");if(!btn||!s.allExams)return;
 const x=s.allExams.registros.find(r=>r.id===btn.dataset.catalogStudy);if(!x)return;
 showTab("estudos");$("study-type").value=x.tipo;pathChange("type");
 $("study-exam").value=x.id;pathChange("exam");
});
function notice(msg,error=false){const el=$("site-notice");el.hidden=false;el.textContent=msg;el.classList.toggle("error",error)}
function showTab(name){if(!validTab.has(name))return;location.hash=name;document.querySelectorAll(".view").forEach(x=>x.hidden=x.id!=="view-"+name);document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));if(name==="estudos")showTopic();}
document.getElementById("tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b&&!b.hidden)showTab(b.dataset.tab)});
function roleNames(){return s.profile?.roles||[]}
function owner(){return s.profile?.approved===true&&s.profile?.owner===true}
function approved(){return s.profile?.approved===true}
function allowedChannels(){if(owner())return ["noticias","avisos","marketing"];if(!approved())return [];const r=roleNames();return ["noticias","avisos","marketing"].filter(c=>{
 if(c==="noticias")return r.some(x=>["jornalista","administrativo_aprovado","administrativo_aprovado_semitotal","administrativo_marketing_total","sub_criador","criador"].includes(x));
 if(c==="avisos")return r.some(x=>["administrativo_aprovado","administrativo_aprovado_semitotal","sub_criador","criador"].includes(x));
 return r.some(x=>["administrativo_marketing_total","sub_criador","criador"].includes(x));
})}
function permissionsUI(){
 $("owner-tab").hidden=!owner();$("publish-tab").hidden=!allowedChannels().length;
 if(!allowedChannels().length&&$("view-publicar").hidden===false)showTab("noticias");
 if(!owner()&&$("view-administracao").hidden===false)showTab("noticias");
 const options=[["noticias","Notícias"],["avisos","Avisos"],["marketing","Marketing"]].filter(x=>allowedChannels().includes(x[0]));
 $("post-channel").innerHTML=options.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join("");
 $("auth-title").textContent=s.me?"Conectado: "+(s.me.displayName||"Conta Google"):"Entrar com sua conta Google";
 $("auth-message").textContent=s.me?(owner()?"Você é o proprietário. Whitelist, cargos, canais, provas e materiais estão sob sua administração.":approved()?"Whitelist aprovada. Seus cargos são atribuídos manualmente e limitam as ações permitidas.":"Cadastro realizado. Aguardando aprovação manual na whitelist da FAAAB."):"Faça login uma vez e retorne automaticamente neste navegador. O login não libera whitelist nem cargo.";
 $("login-google").hidden=!!s.me;$("logout-google").hidden=!s.me;
}
function renderPosts(){
 const channels=["noticias","avisos","marketing"],labels=s.seed.categorias||{},filter=$("filter-news").value;
 for(const c of channels){
 let posts=s.posts.filter(x=>x.channel===c&&(!filter||c!=="noticias"||x.category===filter));
 posts.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 const node=$("posts-"+c);
 node.innerHTML=posts.length?posts.map(x=>'<article class="post-card '+esc(x.category)+'"><div class="post-meta"><span>'+esc(labels[x.category]||"Comunicado")+'</span><span>'+esc(formatDate(x.createdAt))+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p></article>').join(""):'<div class="empty">'+(c==="noticias"?"Nenhuma notícia publicada nesta categoria.":c==="avisos"?"Nenhum aviso publicado.":"Nenhuma campanha publicada.")+'</div>';
 }
}
$("filter-news").addEventListener("change",renderPosts);
async function refreshPosts(){if(!s.db)return;try{const q=query(collection(s.db,"posts"),where("published","==",true),limit(100));const snap=await getDocs(q);s.posts=snap.docs.map(d=>({id:d.id,...d.data()}));renderPosts()}catch(e){notice("Não foi possível carregar os comunicados online: "+e.message,true)}}
async function refreshExams(){if(!s.db)return;try{const q=query(collection(s.db,"exams"),where("published","==",true),limit(100));const snap=await getDocs(q);s.exams=snap.docs.map(d=>({id:d.id,...d.data()}));renderExams()}catch(e){notice("Não foi possível consultar editais: "+e.message,true)}}
function renderExams(){
 const now=Date.now();const exams=s.exams.filter(x=>x.status==="aberta"&&x.untilAt?.toDate?.().getTime()>now);
 $("exam-list").innerHTML=exams.length?exams.map(x=>{
 const eligible=!x.allowedRoles?.length||owner()||x.allowedRoles.some(r=>roleNames().includes(r));
 const canApply=approved()&&eligible;
 return '<article class="exam-card"><div class="post-meta"><span>Prova '+esc(x.type||"FAAAB")+'</span><span>Inscrições até '+esc(formatDate(x.untilAt))+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><p><strong>Cargos elegíveis:</strong> '+esc(x.allowedRoles?.length?x.allowedRoles.map(roleLabel).join(", "):"Todos os membros aprovados")+'</p>'+(canApply?'<button class="btn primary" type="button" data-exam-apply="'+esc(x.id)+'">Inscrever-me</button>':'<p class="helper">'+(approved()?"Inscrição restrita aos cargos elegíveis.":"Faça login e receba a whitelist para se inscrever.")+'</p>')+'</article>'
 }).join(""):'<div class="empty">Nenhuma prova FAAAB está com inscrições abertas. Provas antigas da Marinha aparecem apenas como referências de estudo.</div>';
}
$("exam-list").addEventListener("click",async e=>{const btn=e.target.closest("[data-exam-apply]");if(!btn||!s.me||!approved())return;const exam=s.exams.find(x=>x.id===btn.dataset.examApply);if(!exam||!confirm("Confirmar inscrição em "+exam.title+"?"))return;
 try{btn.disabled=true;await setDoc(doc(s.db,"applications",s.me.uid+"__"+exam.id),{uid:s.me.uid,examId:exam.id,status:"inscrita",submittedAt:serverTimestamp()});notice("Inscrição enviada. O status não representa aprovação ou promoção automática.")}catch(err){notice("Inscrição não concluída: "+err.message,true)}finally{btn.disabled=false}});
function roleLabel(id){return s.roleCatalog?.roles?.find(x=>x.id===id)?.nome||id.replaceAll("_"," ")}
function fillSelect(id,items,label="Selecione"){const el=$(id),value=el.value;el.innerHTML='<option value="">'+label+'</option>'+items.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.nome||x.titulo||x.id)+'</option>').join("");if(items.some(x=>x.id===value))el.value=value;el.disabled=!items.length;return el}
function currentPath(){const t=catalogue().find(x=>x.id===$("study-exam").value),m=t?.materias?.find(x=>x.id===$("study-subject").value),topic=m?.assuntos?.find(x=>x.id===$("study-topic").value);return {t,m,topic}}
function pathChange(level){
 const type=$("study-type").value;
 if(level==="type")fillSelect("study-exam",catalogue().filter(x=>x.tipo===type),"Selecione a prova");
 if(["type","exam"].includes(level)){
  const item=catalogue().find(x=>x.id===$("study-exam").value);fillSelect("study-subject",item?.materias||[],"Selecione a matéria");
 }
 if(["type","exam","subject"].includes(level)){
  const {m}=currentPath();fillSelect("study-topic",m?.assuntos||[],"Selecione o assunto");
 }
 showTopic();
}
$("study-type").addEventListener("change",()=>pathChange("type"));
$("study-exam").addEventListener("change",()=>pathChange("exam"));
$("study-subject").addEventListener("change",()=>pathChange("subject"));
$("study-topic").addEventListener("change",showTopic);
function safeOfficial(url){try{const x=new URL(url);return x.protocol==="https:"&&(x.hostname==="www.marinha.mil.br"||x.hostname==="www.inscricao.marinha.mil.br")?url:null}catch{return null}}
function showTopic(){
 const {t,m,topic}=currentPath();s.selectedTopic=topic;s.selectedPath=t&&m&&topic?{t,m,topic}:null;
 if(!s.selectedPath){$("study-content").innerHTML='<div class="study-start"><div class="study-icon">◎</div><h3>Escolha uma prova, matéria e assunto</h3><p>Material disponível somente nas trilhas selecionadas e documentadas.</p></div>';return}
 const parts=['<div class="eyebrow">'+esc(t.titulo)+'</div><h3>'+esc(m.nome)+' · '+esc(topic.nome)+'</h3><p class="helper">'+esc(t.situacao)+'</p><p class="study-body">'+esc(topic.resumo)+'</p><div class="study-links">'];
 if(safeOfficial(t.edital))parts.push('<a target="_blank" rel="noopener noreferrer" href="'+esc(t.edital)+'">Edital / referência oficial</a>');
 if(safeOfficial(t.provasAnteriores))parts.push('<a target="_blank" rel="noopener noreferrer" href="'+esc(t.provasAnteriores)+'">Provas anteriores e gabaritos</a>');
 parts.push('</div>');
 if(topic.exercicio){const ex=topic.exercicio;parts.push('<div class="practice"><h4>Exercício autoral de preparação</h4><p>'+esc(ex.enunciado)+'</p><fieldset style="border:0;padding:0">'+ex.alternativas.map((x,i)=>'<label><input type="radio" name="practice-answer" value="'+i+'"> '+esc(String.fromCharCode(65+i)+") "+x)+'</label>').join("")+'</fieldset><button id="check-answer" type="button" class="btn primary">Conferir resposta</button><div id="practice-result" class="answer" aria-live="polite"></div></div>')}
 parts.push('<div id="extra-study" class="study-topics"><p class="helper">Verificando se há material complementar autorizado…</p></div>');
 $("study-content").innerHTML=parts.join("");
 $("check-answer")?.addEventListener("click",()=>{const c=document.querySelector('input[name="practice-answer"]:checked');if(!c){$("practice-result").textContent="Escolha uma alternativa.";return}const ex=topic.exercicio;$("practice-result").textContent=(Number(c.value)===ex.resposta?"Correto. ":"Ainda não. ")+ex.explicacao});
 if(s.db)loadExtraStudy(t,m,topic);else $("extra-study").textContent="Materiais complementares serão disponibilizados após ativar a plataforma.";
}
const materialId=(t,m,topic)=>t.id+"__"+m.id+"__"+topic.id;
async function loadExtraStudy(t,m,topic){
 const box=$("extra-study");if(!box)return;
 try{const snap=await getDoc(doc(s.db,"materials",materialId(t,m,topic)));if(!box||s.selectedTopic?.id!==topic.id)return;
 if(!snap.exists()){box.innerHTML='<p class="helper">Nenhum complemento publicado para este assunto.</p>';return}
 const x=snap.data();
 box.innerHTML='<h3>'+esc(x.title)+'</h3><p class="study-body">'+esc(x.body)+'</p><p class="helper">Material complementar: '+esc(x.access==="cargos"?"restrito a cargos":x.access==="membros"?"membros autorizados":"público")+'</p>';
 }catch(e){box.innerHTML='<p class="helper">Complemento de estudo indisponível para esta conta ou cargo.</p>'}
}
async function ensureProfile(user){
 const ref=doc(s.db,"users",user.uid),snapshot=await getDoc(ref);
 if(!snapshot.exists()){
  await setDoc(ref,{displayName:String(user.displayName||"Usuário").slice(0,120),approved:false,owner:false,roles:[],createdAt:serverTimestamp()});
  return (await getDoc(ref)).data();
 }
 return snapshot.data();
}
async function authChanged(user){
 s.me=user;s.profile=null;
 if(user){try{s.profile=await ensureProfile(user)}catch(e){notice("Erro ao verificar a whitelist: "+e.message,true)}}
 permissionsUI();renderExams();
 if(owner()){await loadScopeSources();await refreshUsers();}else $("admin-users").innerHTML='<div class="empty">Acesso restrito ao proprietário.</div>';
}
function refreshUserRoleOptions(){
 const roles=s.roleCatalog?.roles||[];
 for(const id of ["assign-role","material-role","exam-roles"]){
  const sel=$(id);sel.innerHTML=(id==="assign-role"?'<option value="">Escolha um cargo</option>':id==="material-role"?'<option value="">Selecione um cargo</option>':"")+roles.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.nome)+'</option>').join("");
 }
}
async function refreshUsers(){
 if(!owner())return;
 try{
  const snap=await getDocs(query(collection(s.db,"users"),limit(200))),users=snap.docs.map(d=>({uid:d.id,...d.data()}));s.userList=users;
  $("admin-users").innerHTML=users.length?users.map(u=>'<div class="user-row"><strong>'+esc(u.displayName||"Membro")+'</strong><small>'+esc(u.uid)+' · '+(u.approved?"Whitelist aprovada":"Aguardando whitelist")+'</small><small>Cargos: '+esc((u.roles||[]).map(roleLabel).join(", ")||"nenhum")+'</small><button type="button" class="btn '+(u.approved?"outline":"primary")+'" data-toggle-uid="'+esc(u.uid)+'">'+(u.approved?"Revogar whitelist":"Aprovar whitelist")+'</button></div>').join(""):'<div class="empty">Ainda não há cadastros.</div>';
  fillSelect("assign-user",users.filter(x=>x.approved&&!x.owner).map(x=>({id:x.uid,nome:x.displayName||x.uid})),"Escolha membro aprovado");
 }catch(e){notice("Não foi possível carregar os membros: "+e.message,true)}
}
$("admin-users").addEventListener("click",async e=>{const btn=e.target.closest("[data-toggle-uid]");if(!btn||!owner())return;const user=s.userList?.find(x=>x.uid===btn.dataset.toggleUid);if(!user||user.owner)return;if(!confirm((user.approved?"Revogar":"Aprovar")+" whitelist de "+(user.displayName||user.uid)+"?"))return;
 try{await updateDoc(doc(s.db,"users",user.uid),{approved:!user.approved,...(user.approved?{roles:[],scopeByRole:{}}:{})});notice("Whitelist atualizada. Cargos seguem uma etapa separada.");await refreshUsers()}catch(err){notice("Erro na whitelist: "+err.message,true)}});
async function loadScopeSources(){
 if(s.scopeSources)return;
 try{const names=["cursos","catalogo","autoridades"];const all=await Promise.all(names.map(async x=>{const r=await fetch("dados/"+x+".json");if(!r.ok)throw Error("Arquivo de "+x+" indisponível");return r.json()}));s.scopeSources={cursos:all[0],catalogo:all[1],autoridades:all[2]}}catch(e){notice("Não foi possível carregar todos os alvos de cargos: "+e.message,true);s.scopeSources={cursos:[],catalogo:[],autoridades:[]}}
}
function targetOptions(){
 const role=$("assign-role").value,kind=$("assign-kind").value;
 let entries=[];
 if(role==="instrutor"&&kind==="curso")entries=(s.scopeSources?.cursos||[]).map(x=>({id:x.id,nome:(x.forca||"")+": "+(x.titulo||x.id)}));
 if(role==="instrutor"&&kind==="batalhao")entries=(s.scopeSources?.catalogo||[]).filter(x=>/batalh|brigad|unidade/i.test([x.tipo||"",x.nome||""].join(" "))).map(x=>({id:x.id,nome:(x.forca||"")+": "+x.nome}));
 if(role==="governo")entries=(s.scopeSources?.autoridades||[]).filter(x=>x.forca==="GOV").map(x=>({id:x.id,nome:x.nome}));
 if(role==="alto_escalao")entries=kind==="civil"?[{id:"GOV",nome:"Governo (civil)"}]:[{id:"FTB",nome:"Exército"},{id:"FAB",nome:"Força Aérea"},{id:"FMB",nome:"Marinha"},{id:"PM",nome:"Polícia Militar"},{id:"CBM",nome:"Bombeiros"}];
 fillSelect("assign-target",entries,"Selecione o destino");
}
function scopeKindOptions(){
 const role=$("assign-role").value;const required=["instrutor","governo","alto_escalao"].includes(role);
 $("assign-scope").hidden=!required;
 const kinds=role==="instrutor"?[{id:"curso",nome:"Curso"},{id:"batalhao",nome:"Batalhão / unidade"}]:role==="governo"?[{id:"cargo",nome:"Cargo governamental"}]:role==="alto_escalao"?[{id:"militar",nome:"Força militar"},{id:"civil",nome:"Força civil"}]:[];
 fillSelect("assign-kind",kinds,"Selecione a categoria");
 if(kinds.length){$("assign-kind").value=kinds[0].id;targetOptions()}else fillSelect("assign-target",[],"Selecione um destino");
}
$("assign-role").addEventListener("change",scopeKindOptions);
$("assign-kind").addEventListener("change",targetOptions);
$("assign-form").addEventListener("submit",async e=>{e.preventDefault();if(!owner())return;
 const uid=$("assign-user").value,role=$("assign-role").value,scope=(["instrutor","governo","alto_escalao"].includes(role)?$("assign-kind").value+":"+$("assign-target").value:""),u=s.userList?.find(x=>x.uid===uid);
 if(!u?.approved||!role){notice("Primeiro aprove a whitelist e escolha o cargo.",true);return}
 if(["instrutor","governo","alto_escalao"].includes(role)&&(!$("assign-target").value||!$("assign-kind").value)){notice("Este cargo exige uma seleção específica.",true);return}
 if(role==="alto_escalao"&&!/^(militar:(FTB|FAB|FMB|CBM|PM)|civil:GOV)$/.test(scope)){notice("Use militar:FTB/FAB/FMB/CBM/PM ou civil:GOV.",true);return}
 if(!confirm("Atribuir "+roleLabel(role)+" a "+u.displayName+"?"))return;
 try{
  const roles=[...new Set([...(u.roles||[]),role])],scopeByRole={...(u.scopeByRole||{})};if(scope)scopeByRole[role]=scope;
  await updateDoc(doc(s.db,"users",uid),{roles,scopeByRole});
  notice("Cargo atribuído manualmente. Whitelist e funções permanecem separadas.");await refreshUsers();
 }catch(err){notice("Falha ao atribuir cargo: "+err.message,true)}
});
$("post-form").addEventListener("submit",async e=>{e.preventDefault();const channel=$("post-channel").value;if(!s.me||!allowedChannels().includes(channel))return;
 const title=$("post-title").value.trim(),body=$("post-body").value.trim(),category=$("post-category").value;
 if(!title||!body||!confirm("Publicar comunicado neste canal?"))return;
 try{await addDoc(collection(s.db,"posts"),{channel,category,title,body,published:true,authorUid:s.me.uid,createdAt:serverTimestamp()});$("post-form").reset();notice("Comunicado publicado no canal "+channel+".");await refreshPosts()}catch(err){notice("Publicação não autorizada ou indisponível: "+err.message,true)}
});
$("exam-form").addEventListener("submit",async e=>{e.preventDefault();if(!owner())return;
 const title=$("exam-title").value.trim(),description=$("exam-description").value.trim(),date=new Date($("exam-until").value);
 if(!title||!description||isNaN(date)||date.getTime()<=Date.now()){notice("Preencha edital, requisitos e uma data futura para o fim das inscrições.",true);return}
 if(!confirm("Confirma a abertura REAL desta prova no site FAAAB? Não é apenas modelo de estudo."))return;
 const allowedRoles=Array.from($("exam-roles").selectedOptions).map(x=>x.value);
 try{await addDoc(collection(s.db,"exams"),{type:$("exam-type").value,title,description,status:"aberta",published:true,allowedRoles,untilAt:Timestamp.fromDate(date),createdAt:serverTimestamp(),authorUid:s.me.uid});$("exam-form").reset();notice("Edital aberto oficialmente no canal de provas.");await refreshExams()}catch(err){notice("Falha ao abrir edital: "+err.message,true)}
});
$("material-form").addEventListener("submit",async e=>{e.preventDefault();if(!owner())return;
 const {t,m,topic}=currentPath();if(!t||!m||!topic){notice("Selecione primeiro tipo, prova, matéria e assunto no canal Estudos.",true);return}
 const access=$("material-access").value,role=$("material-role").value;
 if(access==="cargos"&&!role){notice("Selecione o cargo autorizado para o material.",true);return}
 if(!confirm("Publicar o material de estudo para "+t.titulo+" / "+topic.nome+"?"))return;
 try{await setDoc(doc(s.db,"materials",materialId(t,m,topic)),{title:$("material-title").value.trim(),body:$("material-body").value.trim(),access,requiredRoles:access==="cargos"?[role]:[],published:true,updatedAt:serverTimestamp(),authorUid:s.me.uid});notice("Material complementar publicado com o acesso selecionado.");$("material-form").reset();showTopic()}catch(err){notice("Não foi possível publicar material: "+err.message,true)}
});
async function bootstrap(){
 try{
  const [seedResp,roleResp,configResp,catalogResp]=await Promise.all([fetch("dados/portal_canais_estudos.json"),fetch("dados/admin_roles.json"),fetch("dados/firebase_config.json",{cache:"no-store"}),fetch("dados/provas_todas_unidades.json")]);
  if(!seedResp.ok||!roleResp.ok||!configResp.ok||!catalogResp.ok)throw Error("Não foi possível carregar os arquivos do portal");
  s.seed=await seedResp.json();s.roleCatalog=await roleResp.json();s.allExams=await catalogResp.json();const cfg=await configResp.json();
  buildStudyPaths();renderCatalog();renderReferences();
  $("study-type").disabled=false;refreshUserRoleOptions();renderPosts();renderExams();if(validTab.has(location.hash.slice(1))&&!["publicar","administracao"].includes(location.hash.slice(1)))showTab(location.hash.slice(1));
  if(!cfg.enabled||!cfg.app?.apiKey||!cfg.app?.projectId||!cfg.app?.appId){
   $("auth-title").textContent="Google login: configuração pendente";
   $("auth-message").textContent="A central pública e os estudos já estão disponíveis. Para ativar login, whitelist e publicação online, o proprietário precisa criar o Firebase e aplicar as regras de segurança.";
   return;
  }
  s.app=initializeApp(cfg.app);s.auth=getAuth(s.app);s.db=getFirestore(s.app);
  await setPersistence(s.auth,browserLocalPersistence);
  $("login-google").disabled=false;
  $("login-google").addEventListener("click",async()=>{try{await signInWithPopup(s.auth,new GoogleAuthProvider())}catch(err){notice("Não foi possível entrar com Google: "+err.message,true)}});
  $("logout-google").addEventListener("click",()=>signOut(s.auth).catch(e=>notice("Erro ao sair: "+e.message,true)));
  onAuthStateChanged(s.auth,user=>authChanged(user).catch(e=>notice("Erro de sessão: "+e.message,true)));
  await Promise.all([refreshPosts(),refreshExams()]);
 }catch(e){notice("Falha ao carregar a central: "+e.message,true)}
}
bootstrap();
