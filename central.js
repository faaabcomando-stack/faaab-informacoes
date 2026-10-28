"use strict";
// A área pública de Estudos, Provas e Notícias não depende do servidor Google.
// Firebase é carregado só quando o proprietário ativa a configuração.
let initializeApp,getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence;
let getFirestore,collection,doc,getDoc,getDocs,query,where,limit,setDoc,updateDoc,addDoc,serverTimestamp,Timestamp;
async function loadFirebase(){
 const [app,auth,db]=await Promise.all([
  import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
  import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
  import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
 ]);
 ({initializeApp}=app);
 ({getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence}=auth);
 ({getFirestore,collection,doc,getDoc,getDocs,query,where,limit,setDoc,updateDoc,addDoc,serverTimestamp,Timestamp}=db);
}

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const formatDate=v=>{if(!v)return "Data não informada";const d=v?.toDate?v.toDate():new Date(v);return isNaN(d)?"Data não informada":d.toLocaleString("pt-BR",{dateStyle:"medium",timeStyle:"short"})};
const s={app:null,auth:null,db:null,me:null,profile:null,seed:null,roleCatalog:null,posts:[],exams:[],selectedTopic:null,selectedPath:null,scopeSources:null,allExams:null,paths:[],catalogLimit:20,studyGuides:null};
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
  detalhes:x, materias:s.studyGuides?.provas?.[x.referenciaId]?.materias||[]
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
 showTab("estudos");
 window.FAAABExamPrograms?.selectProgram(x.id,{scroll:true});
 $("program-detail").scrollIntoView({behavior:"smooth",block:"start"});
});
function notice(msg,error=false){const el=$("site-notice");el.hidden=false;el.textContent=msg;el.classList.toggle("error",error)}
function showTab(name){if(!validTab.has(name))return;if(name==="administracao"&&!owner())return;if(name==="publicar"&&!allowedChannels().length)return;location.hash=name;document.querySelectorAll(".view").forEach(x=>x.hidden=x.id!=="view-"+name);document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));if(name==="estudos")showTopic();}
document.getElementById("tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b&&!b.hidden)showTab(b.dataset.tab)});
window.addEventListener("hashchange",()=>{const tab=location.hash.slice(1);if(["noticias","avisos","marketing","provas","estudos"].includes(tab))showTab(tab)});
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
function examState(ex){
 const start=ex.startAt?.toDate?.().getTime(),end=ex.untilAt?.toDate?.().getTime(),n=Date.now();
 if(!ex.published||!end)return "indisponivel";
 if(end<=n)return "encerrada";
 if(start&&start>n)return "programada";
 return ex.status==="agendada"||ex.status==="aberta"?"aberta":"indisponivel";
}
function renderExams(){
 const order={aberta:0,programada:1,encerrada:2,indisponivel:3};
 const all=s.exams.map(x=>({...x,computedState:examState(x)})).sort((a,b)=>(order[a.computedState]??4)-(order[b.computedState]??4)||((a.startAt?.seconds||0)-(b.startAt?.seconds||0)));
 const counts={aberta:all.filter(x=>x.computedState==="aberta").length,programada:all.filter(x=>x.computedState==="programada").length,encerrada:all.filter(x=>x.computedState==="encerrada").length};
 $("exam-list").innerHTML=all.length?'<p class="helper">'+counts.aberta+' abertas · '+counts.programada+' agendadas · '+counts.encerrada+' encerradas (atualização calculada automaticamente por data)</p>'+all.map(x=>{
  const eligible=!x.allowedRoles?.length||x.allowedRoles.some(r=>roleNames().includes(r));
  const state=x.computedState,canApply=state==="aberta"&&approved()&&eligible;
  const desc={aberta:"Inscrições abertas",programada:"Abertura programada",encerrada:"Inscrições encerradas",indisponivel:"Indisponível"}[state];
  return '<article class="exam-card"><span class="exam-status '+(state==="programada"?"scheduled":state==="encerrada"?"closed":"")+'">'+desc+'</span><div class="post-meta"><span>'+esc(x.type||"FAAAB")+'</span><span>Início: '+esc(formatDate(x.startAt))+' · Fim: '+esc(formatDate(x.untilAt))+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><p><strong>Cargos elegíveis:</strong> '+esc(x.allowedRoles?.length?x.allowedRoles.map(roleLabel).join(", "):"Todos os membros da whitelist")+'</p>'+(canApply?'<button class="btn primary" type="button" data-exam-apply="'+esc(x.id)+'">Inscrever-me</button>':'<p class="helper">'+(state==="programada"?"As inscrições serão liberadas automaticamente na data inicial.":state==="encerrada"?"O prazo encerrou automaticamente.":approved()?"Inscrição indisponível para este cargo ou período.":"É necessária whitelist e período aberto para inscrição.")+'</p>')+'</article>';
 }).join(""):'<div class="empty">Ainda não há editais da FAAAB publicados. Consulte abaixo a lista completa de cursos, centros, batalhões, brigadas e provas reais de referência.</div>';
}
$("exam-list").addEventListener("click",async e=>{const btn=e.target.closest("[data-exam-apply]");if(!btn||!s.me||!approved())return;const exam=s.exams.find(x=>x.id===btn.dataset.examApply);if(!exam||examState(exam)!=="aberta"||!confirm("Confirmar inscrição em "+exam.title+"?"))return;
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
 const {t,m,topic}=currentPath();
 s.selectedTopic=topic;s.selectedPath=t&&m&&topic?{t,m,topic}:null;
 if(!s.selectedPath){
  if(t){
   const source=safeSource(t.edital||t.provasAnteriores),extra=t.detalhes;
   const info=extra?.observacao||t.orientacao||t.situacao||"";
   const effect=extra?.efeitoDocumentado||"";
   const help=t.materias?.length?"Selecione a matéria e o assunto. O conteúdo deve ser comparado com o programa oficial do edital.":"Não existe programa de matérias confirmado para esta ficha. Não foi inventada prova pública nem prova da FAAAB.";
   $("study-content").innerHTML='<div class="eyebrow">'+esc(t.tipo||"Seleção")+'</div><h3>'+esc(t.titulo)+'</h3><p class="study-body">'+esc(info)+'</p>'+
     (effect?'<p><b>Rota prevista no manual:</b> '+esc(effect)+' — sujeita à CDP.</p>':"")+
     '<p class="helper">'+esc(help)+'</p>'+
     (source?'<div class="study-links"><a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Fonte e provas reais relacionadas</a></div>':"");
  }else $("study-content").innerHTML='<div class="study-start"><div class="study-icon">◎</div><h3>Escolha uma prova</h3><p>O catálogo contempla todas as instituições e formações documentadas na FAAAB.</p></div>';
  return;
 }
 const parts=['<div class="eyebrow">'+esc(t.titulo)+'</div><h3>'+esc(m.nome)+' · '+esc(topic.nome)+'</h3><p class="helper">'+esc(t.situacao)+'</p><p class="study-body">'+esc(topic.resumo)+'</p><div class="study-links">'];
 if(safeSource(t.edital))parts.push('<a target="_blank" rel="noopener noreferrer" href="'+esc(t.edital)+'">Edital / fonte oficial</a>');
 if(safeSource(t.provasAnteriores))parts.push('<a target="_blank" rel="noopener noreferrer" href="'+esc(t.provasAnteriores)+'">Provas completas anteriores e gabaritos</a>');
 parts.push('</div><div class="notice neutral">As disciplinas e assuntos são uma orientação de estudo. Consulte o conteúdo programático e as provas oficiais completas da edição. A FAAAB não aprova patentes automaticamente.</div>');
 parts.push('<div class="lesson-navigation"><button type="button" class="btn primary" id="study-internal-lesson">Aprender este assunto aqui na FAAAB</button></div>');
 parts.push('<div id="extra-study" class="study-topics"><p class="helper">Consultando material complementar autorizado…</p></div>');
 $("study-content").innerHTML=parts.join("");
 $("study-internal-lesson")?.addEventListener("click",()=>{window.FAAABLessons?.openFromProgram(m.nome,topic.nome);$("academy-by-exam").open=false;});
 if(s.db)loadExtraStudy(t,m,topic);else $("extra-study").textContent="Materiais complementares aparecerão após ativar a plataforma.";
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
$("exam-record").addEventListener("change",()=>{
 const item=s.allExams?.registros.find(x=>x.id===$("exam-record").value);
 if(!item)return;
 if(!$("exam-title").value.trim())$("exam-title").value="Avaliação FAAAB — "+item.nome;
 if(["centro","brigada","unidade","escola","academia","curso"].includes(item.tipo))$("exam-type").value=item.tipo==="unidade"?"batalhao":item.tipo==="academia"?"escola":item.tipo;
});
$("exam-form").addEventListener("submit",async e=>{e.preventDefault();if(!owner())return;
 const title=$("exam-title").value.trim(),description=$("exam-description").value.trim(),catalogRecordId=$("exam-record").value;
 if(!s.allExams?.registros.some(x=>x.id===catalogRecordId)){notice("Selecione uma formação ou unidade existente no catálogo FAAAB.",true);return}
 const startAt=new Date($("exam-start").value),untilAt=new Date($("exam-until").value);
 if(!title||!description||description.length<=10||isNaN(startAt)||isNaN(untilAt)||untilAt<=startAt||untilAt<=new Date()){notice("Preencha edital e datas válidas: o fim deve ser posterior ao início, e o fim deve estar no futuro.",true);return}
 if(!confirm("Confirmar a PUBLICAÇÃO de um edital FAAAB? O sistema abrirá e encerrará inscrições automaticamente nas datas escolhidas. Nenhuma promoção é automática."))return;
 const allowedRoles=Array.from($("exam-roles").selectedOptions).map(x=>x.value);
 try{
  await addDoc(collection(s.db,"exams"),{type:$("exam-type").value,title,description,catalogRecordId,status:"agendada",published:true,allowedRoles,startAt:Timestamp.fromDate(startAt),untilAt:Timestamp.fromDate(untilAt),createdAt:serverTimestamp(),authorUid:s.me.uid});
  $("exam-form").reset();notice("Edital agendado. O prazo de inscrição ficará aberto somente dentro da janela definida, validada pelo Firestore.");await refreshExams();
 }catch(err){notice("Falha ao agendar edital: "+err.message,true)}
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
  const [seedResp,roleResp,configResp,catalogResp,guidesResp]=await Promise.all([fetch("dados/portal_canais_estudos.json"),fetch("dados/admin_roles.json"),fetch("dados/firebase_config.json",{cache:"no-store"}),fetch("dados/provas_todas_unidades.json"),fetch("dados/provas_guias_materias.json")]);
  if(!seedResp.ok||!roleResp.ok||!configResp.ok||!catalogResp.ok||!guidesResp.ok)throw Error("Não foi possível carregar os arquivos do portal");
  s.seed=await seedResp.json();s.roleCatalog=await roleResp.json();s.allExams=await catalogResp.json();s.studyGuides=await guidesResp.json();const cfg=await configResp.json();
  buildStudyPaths();renderCatalog();renderReferences();
  $("exam-record").innerHTML='<option value="">Selecione o curso, centro, unidade ou brigada</option>'+s.allExams.registros.filter(x=>["curso","centro","escola","academia","unidade","brigada","subdivisao"].includes(x.tipo)).sort((a,b)=>a.forca.localeCompare(b.forca)||a.nome.localeCompare(b.nome,"pt-BR")).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.forca+" · "+x.nome)+'</option>').join("");
  $("study-type").disabled=false;refreshUserRoleOptions();renderPosts();renderExams();if(validTab.has(location.hash.slice(1))&&!["publicar","administracao"].includes(location.hash.slice(1)))showTab(location.hash.slice(1));
  if(!cfg.enabled||!cfg.app?.apiKey||!cfg.app?.projectId||!cfg.app?.appId){
   $("auth-title").textContent="Google login: configuração pendente";
   $("auth-message").textContent="A central pública e os estudos já estão disponíveis. Para ativar login, whitelist e publicação online, o proprietário precisa criar o Firebase e aplicar as regras de segurança.";
   return;
  }
  await loadFirebase();
  s.app=initializeApp(cfg.app);s.auth=getAuth(s.app);s.db=getFirestore(s.app);
  await setPersistence(s.auth,browserLocalPersistence);
  $("login-google").disabled=false;
  $("login-google").addEventListener("click",async()=>{try{await signInWithPopup(s.auth,new GoogleAuthProvider())}catch(err){notice("Não foi possível entrar com Google: "+err.message,true)}});
  $("logout-google").addEventListener("click",()=>signOut(s.auth).catch(e=>notice("Erro ao sair: "+e.message,true)));
  onAuthStateChanged(s.auth,user=>authChanged(user).catch(e=>notice("Erro de sessão: "+e.message,true)));
  await Promise.all([refreshPosts(),refreshExams()]);
  setInterval(()=>{if(s.db){refreshExams().catch(()=>{});renderExams()}},60000);
 }catch(e){notice("Falha ao carregar a central: "+e.message,true)}
}
bootstrap();
