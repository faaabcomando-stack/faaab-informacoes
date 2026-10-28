/* Simulados de estudo por seleção — questões autorais, não provas oficiais. */
"use strict";(()=>{
const $=id=>document.getElementById(id);
const safe=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const STORE="faaab-simulados-prova-v1";
const state={data:null,exam:null,questions:[],index:0,score:0,answered:false,history:{}};
const shuffle=xs=>{const v=xs.slice();for(let i=v.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[v[i],v[j]]=[v[j],v[i]]}return v};
function loadHistory(){try{const x=JSON.parse(localStorage.getItem(STORE)||"{}");if(x&&typeof x==="object")state.history=x}catch{}}
function saveHistory(){try{localStorage.setItem(STORE,JSON.stringify(state.history))}catch{}}
function current(){return state.questions[state.index]}
function show(){
 const area=$("specific-quiz-content");
 if(state.index>=state.questions.length){
  const max=state.questions.length,points=state.score,pct=Math.round(100*points/max);
  state.history[state.exam.id]={completedAt:Date.now(),score:points,total:max};saveHistory();
  area.innerHTML='<div class="specific-quiz-result"><div class="specific-score">'+pct+'%</div><h4>Resultado do treino</h4><p>Você acertou '+points+' de '+max+' questões autorais para esta seleção.</p><p>Revise as matérias em que errou. Isso não é aprovação, prova oficial ou promoção na FAAAB.</p><div class="specific-quiz-actions"><button type="button" id="specific-quiz-again" class="btn primary">Refazer com nova ordem</button><button type="button" id="specific-quiz-study" class="btn outline">Revisar as aulas</button></div></div>';
  return;
 }
 const q=current();state.answered=false;
 area.innerHTML='<div class="specific-quiz-progress"><span>Questão '+(state.index+1)+' de '+state.questions.length+'</span><span>'+safe(q.materia)+' · '+safe(q.assunto)+'</span></div><div class="lesson-progressline"><span style="width:'+Math.round(100*state.index/state.questions.length)+'%"></span></div><h4>'+safe(q.enunciado)+'</h4><div class="specific-options">'+q.alternativas.map((v,i)=>'<button type="button" class="specific-option" data-specific-answer="'+i+'"><span>'+String.fromCharCode(65+i)+'</span>'+safe(v)+'</button>').join("")+'</div><div id="specific-feedback" class="specific-feedback" aria-live="polite" hidden></div><div class="specific-quiz-actions"><button class="btn primary" id="specific-next" type="button" hidden>Próxima questão</button><button class="btn outline" type="button" id="specific-quit">Sair do treino</button></div>';
}
async function load(){
 if(state.data)return true;
 const r=await fetch("dados/questoes_por_prova.json",{cache:"no-store"});if(!r.ok)return false;
 const d=await r.json();if(!d?.provas)return false;
 state.data=d;return true;
}
async function start(examId,title){
 const root=$("specific-quiz");
 if(!root)return;
 root.hidden=false;$("specific-quiz-title").textContent=title||"Treino da prova";
 $("specific-quiz-subtitle").textContent="Questões originais com explicação da resposta, agrupadas exclusivamente para esta prova. Não substituem o edital.";
 $("specific-quiz-content").textContent="Carregando as questões desta seleção...";
 root.scrollIntoView({behavior:"smooth",block:"start"});
 try{
  const ok=await load();if(!ok)throw Error("Banco de questões indisponível");
  const d=state.data.provas[examId];if(!d?.questoes?.length)throw Error("Ainda não foram cadastradas questões para esta prova.");
  state.exam={id:examId,title};state.questions=shuffle(d.questoes);state.index=0;state.score=0;show();
 }catch(e){$("specific-quiz-content").textContent=e.message}
}
$("specific-quiz-close").addEventListener("click",()=>{$("specific-quiz").hidden=true});
$("specific-quiz-content").addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;
 const answer=b.dataset.specificAnswer;
 if(answer!==undefined){
  if(state.answered||!current())return;
  state.answered=true;
  const q=current(),correct=Number(answer)===q.correta;
  if(correct)state.score++;
  $("specific-quiz-content").querySelectorAll("[data-specific-answer]").forEach(x=>{
   x.disabled=true;
   const n=Number(x.dataset.specificAnswer);
   x.classList.toggle("correct",n===q.correta);
   x.classList.toggle("wrong",n===Number(answer)&&!correct);
  });
  const feedback=$("specific-feedback");feedback.hidden=false;feedback.classList.toggle("error",!correct);
  feedback.innerHTML='<strong>'+(correct?"Resposta correta.":"Resposta incorreta. Alternativa correta: "+String.fromCharCode(65+q.correta)+".")+'</strong><p>'+safe(q.explicacao)+'</p>';
  $("specific-next").hidden=false;$("specific-next").textContent=state.index+1===state.questions.length?"Ver resultado":"Próxima questão";
 }else if(b.id==="specific-next"){state.index++;show()}
 else if(b.id==="specific-quit"){$("specific-quiz").hidden=true}
 else if(b.id==="specific-quiz-again"&&state.exam)start(state.exam.id,state.exam.title);
 else if(b.id==="specific-quiz-study"){$("specific-quiz").hidden=true;$("academia").scrollIntoView({behavior:"smooth",block:"start"})}
});
loadHistory();
window.FAAABSimulados={start};
})();