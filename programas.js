/* FAAAB: cada prova tem programa próprio; não exibir matérias genéricas em provas sem programa. */
"use strict";
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fold=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const state={data:null,active:null,list:[],limit:22,ready:false,last:null};
const KEY="faaab-prova-especifica-v2";
const programById=id=>state.data?.programas.find(x=>x.id===id);
const programFor=x=>x.programaId?programById(x.programaId):null;
const statusLabel=x=>programFor(x)?"Programa de preparação disponível":"Programa não definido";
const selection=()=>state.list.filter(x=>{
 const q=fold($("program-query").value.trim()),force=$("program-force").value,which=$("program-status").value;
 return (!force||x.forca===force)&&(!which||(which==="ready"&&!!programFor(x))||(which==="pending"&&!programFor(x)))&&(!q||fold([x.nome,x.forca,x.tipo,x.origemId,x.programaId||"",programFor(x)?.heading||""].join(" ")).includes(q))
});
function drawList(){
 const all=selection(),items=all.slice(0,state.limit);
 $("program-result-count").textContent=all.length+" provas e unidades";
 $("program-total").textContent=state.data.catalogo.length+" fichas catalogadas";
 $("program-list").innerHTML=items.length?items.map(x=>{
 const ready=!!programFor(x);
 return '<button type="button" class="program-option '+(state.active===x.id?"selected":"")+'" data-program="'+esc(x.id)+'" aria-current="'+(state.active===x.id)+'"><span class="program-option-main"><b>'+esc(x.nome)+'</b><small>'+esc(x.forca+" · "+x.tipo)+'</small></span><span class="program-option-state '+(ready?"ready":"pending")+'">'+(ready?"Com aulas":"Pendente")+'</span></button>';
 }).join(""):'<div class="program-placeholder"><strong>Nenhum resultado</strong><p>Tente outro nome, força ou situação.</p></div>';
 $("program-more").hidden=all.length<=state.limit;
}
function subjectsInfo(p){
 return p.materias.map((m,i)=>'<div class="program-subject"><div class="program-subject-number">'+String(i+1).padStart(2,"0")+'</div><div><strong>'+esc(m.nome)+'</strong><small>'+m.aulas.length+' aulas disponíveis para esta seleção</small></div><button type="button" data-program-lesson="'+esc(m.aulas[0]||"")+'">Estudar</button></div>').join("");
}
function drawDetail(x){
 const node=$("program-detail"),p=programFor(x);
 if(!p){
  $("academia").hidden=true;
  node.innerHTML='<div class="program-not-ready"><div class="program-caption">'+esc(x.forca)+" / "+esc(x.tipo)+'</div><h3>'+esc(x.nome)+'</h3><span class="program-note">Programa específico ainda não definido</span><p>'+esc(x.motivo||"O conteúdo da avaliação ainda precisa ser registrado pela administração da FAAAB.")+'</p><div class="program-rule">Esta unidade faz parte do catálogo, mas <strong>não recebeu as matérias de outro concurso por suposição</strong>. A coordenação precisa definir a prova e o conteúdo programático antes de liberar seu estudo dirigido.</div></div>';
  return;
 }
 const number=p.materias.reduce((n,m)=>n+m.aulas.length,0);
 node.innerHTML='<div class="program-caption">'+esc(x.forca+" / "+x.nome)+'</div><h3>'+esc(p.heading)+'</h3><span class="program-note available">Preparação disponível · '+p.materias.length+' matérias · '+number+' aulas</span><p>'+esc(p.descricao)+'</p><div class="program-rule">O programa é específico desta seleção. As aulas são autorais e de revisão; <strong>não equivalem à íntegra do edital</strong> e não concedem patente FAAAB.</div><div class="program-subject-list"><h4>Matérias desta prova</h4>'+subjectsInfo(p)+'</div><button type="button" class="btn primary program-start" id="program-start">Começar a estudar esta prova</button>';
}
function selectProgram(id,opts={}){
 const x=state.list.find(x=>x.id===id);if(!x)return;
 state.active=id;state.last=id;drawList();drawDetail(x);
 try{localStorage.setItem(KEY,id)}catch{}
 const p=programFor(x);
 if(p&&window.FAAABLessons?.isReady()){
  window.FAAABLessons.setProgram({id:"exam-"+x.id,heading:p.heading,lessonIds:[...new Set(p.materias.flatMap(m=>m.aulas))],description:"Aulas de "+p.heading+" · Estudo sem login · A aprovação em prova e a CDP são processos separados."});
 }
 if(opts.scroll&&window.matchMedia("(max-width:850px)").matches)$("program-detail").scrollIntoView({behavior:"smooth",block:"start"});
}
function moveToAcademy(lessonId){
 if(!state.active)return;
 const x=state.list.find(z=>z.id===state.active),p=programFor(x);if(!p)return;
 if(lessonId)window.FAAABLessons?.selectLesson(lessonId);
 $("academia").scrollIntoView({behavior:"smooth",block:"start"});
}
async function initialize(){
 try{
 const response=await fetch("dados/programas_por_prova.json",{cache:"no-store"});
 if(!response.ok)throw Error("Não foi possível obter os programas da FAAAB");
 const data=await response.json();
 if(!Array.isArray(data.catalogo)||!Array.isArray(data.programas))throw Error("Catálogo inválido");
 state.data=data;
 const catalog=data.catalogo.filter(x=>x?.id&&x.nome);
 // Um registro por unidade ou curso; escolas com prova conhecida têm destaque sem repetir currículos.
 state.list=catalog.slice().sort((a,b)=>Number(!!programFor(b))-Number(!!programFor(a))||a.forca.localeCompare(b.forca)||a.nome.localeCompare(b.nome,"pt-BR"));
 state.ready=true;drawList();
 let last=null;try{last=localStorage.getItem(KEY)}catch{}
 if(last&&state.list.some(x=>x.id===last))selectProgram(last);
 else $("program-detail").innerHTML='<div class="program-placeholder"><strong>Escolha a prova que deseja preparar.</strong><p>Aqui aparecem matérias, aulas e exercícios apenas da prova selecionada. Se a FAAAB ainda não tiver definido o programa, isso ficará indicado.</p></div>';
 }catch(e){
 $("program-list").innerHTML='<div class="program-placeholder"><strong>Programas indisponíveis</strong><p>'+esc(e.message)+'</p></div>';
 }
}
["program-query","program-force","program-status"].forEach(id=>$(id).addEventListener(id==="program-query"?"input":"change",()=>{state.limit=22;drawList()}));
$("program-more").addEventListener("click",()=>{state.limit+=22;drawList()});
$("program-list").addEventListener("click",e=>{const b=e.target.closest("[data-program]");if(b)selectProgram(b.dataset.program,{scroll:true})});
$("program-detail").addEventListener("click",e=>{
 const subject=e.target.closest("[data-program-lesson]");if(subject){moveToAcademy(subject.dataset.programLesson);return}
 if(e.target.closest("#program-start"))moveToAcademy(null);
});
document.addEventListener("faaab:lessons-ready",()=>{
 if(!state.ready)return;
 if(state.active)selectProgram(state.active);
});
window.FAAABExamPrograms={selectProgram,hasProgram:id=>!!programFor(state.list.find(x=>x.id===id)||{})};
document.addEventListener("DOMContentLoaded",initialize);
})();