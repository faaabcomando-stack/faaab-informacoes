/* Escola FAAAB: aulas públicas e exercícios locais, sem depender de login/Firebase. */
"use strict";
(()=>{
const $=id=>document.getElementById(id);
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const STORE="faaab-academia-v1";
const state={lessons:[],subject:"Todas",search:"",selected:null,limit:25,level:"intermediario",aprofundados:{},progress:{done:{},attempts:0,correct:0},question:null,answered:false,mode:"lesson",session:null,ready:false,programId:null,programName:null,allowedIds:null,groups:[]};
const ri=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
const shuffled=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=ri(0,i);[b[i],b[j]]=[b[j],b[i]]}return b};
function loadProgress(){try{const p=JSON.parse(localStorage.getItem(STORE)||"null");if(p&&typeof p==="object"&&p.done&&typeof p.done==="object"){state.progress={done:p.done,attempts:Number(p.attempts)||0,correct:Number(p.correct)||0}}}catch{}}
function saveProgress(){try{localStorage.setItem(STORE,JSON.stringify(state.progress))}catch{}}
function doneKey(id){return (state.programId||"geral")+"::"+id}
function record(lesson,correct){state.progress.attempts++;if(correct){state.progress.correct++;state.progress.done[doneKey(lesson.id)]=Date.now()}saveProgress();summary();}
function visibleLessons(){return state.allowedIds?state.lessons.filter(x=>state.allowedIds.has(x.id)):state.lessons}
function subjectLessons(name){
 if(!name||name==="Todas")return visibleLessons();
 const group=state.groups.find(g=>g.nome===name);if(group)return visibleLessons().filter(x=>group.ids.has(x.id));
 return visibleLessons().filter(x=>x.materia===name)
}
function focusGroup(name){
 if(!state.ready)return false;
 const lessons=subjectLessons(name);if(!lessons.length)return false;
 state.subject=name;state.search="";$("lesson-search").value="";selectLesson(lessons[0].id,{scroll:true});return true
}
function setProgram(program){
 if(!state.ready)return false;
 const ids=new Set(program.lessonIds||[]);
 const valid=state.lessons.filter(x=>ids.has(x.id));
 if(!valid.length){state.allowedIds=new Set();state.programId=program.id;state.programName=program.heading;state.selected=null;return false}
 state.allowedIds=new Set(valid.map(x=>x.id));state.programId=program.id;state.programName=program.heading;
 state.groups=(program.materias||[]).map(m=>({nome:m.nome,ids:new Set(m.aulas||[])})).filter(g=>g.ids.size);
 if(!state.groups.length)state.groups=[...new Set(valid.map(x=>x.materia))].map(nome=>({nome,ids:new Set(valid.filter(x=>x.materia===nome).map(x=>x.id))}));
 state.subject="Todas";state.search="";state.limit=25;state.session=null;state.mode="lesson";
 $("lesson-search").value="";
 const lastKey="faaab-academia-last-"+program.id;
 let last=null;try{last=localStorage.getItem(lastKey)}catch{}
 state.selected=valid.find(x=>x.id===last)||valid[0];
 $("academy-program-title").textContent=program.heading;
 $("academy-program-description").textContent=program.description||"Aulas e exercícios selecionados para esta prova. Os resultados ficam no dispositivo.";
 $("academia").hidden=false;renderList();renderReader();
 return true
}
function summary(){
 const included=visibleLessons();const total=included.length,done=included.filter(x=>state.progress.done[doneKey(x.id)]).length;
 $("academy-total").textContent=total+" aulas";
 $("academy-progress").textContent=done+" concluídas · "+(state.progress.attempts?Math.round(100*state.progress.correct/state.progress.attempts):0)+"% acertos";
 const p=$("academy-progress");
 if(p)p.setAttribute("aria-label",done+" de "+total+" aulas concluídas");
}
function subjects(){
 const list=["Todas",...state.groups.map(g=>g.nome)];
 $("lesson-subjects").innerHTML=list.map(name=>{
  const size=subjectLessons(name).length;
  return '<button type="button" data-subject="'+escapeHTML(name)+'" aria-pressed="'+(name===state.subject)+'">'+escapeHTML(name)+' <small>'+size+'</small></button>';
 }).join("");
}
function filtered(){
 const q=norm(state.search);
 return subjectLessons(state.subject).filter(x=>!q||norm([x.titulo,x.materia,x.unidade,x.teoria].join(" ")).includes(q));
}
function renderList(){
 subjects();
 const all=filtered(),visible=all.slice(0,state.limit);
 $("academy-list-title").textContent=state.subject==="Todas"?"Todas as aulas":state.subject;
 $("academy-count").textContent=all.length+" disponível(is)";
 $("academy-lessons").innerHTML=visible.length?visible.map((x,i)=>{
 const done=!!state.progress.done[doneKey(x.id)];
 return '<button type="button" data-lesson="'+escapeHTML(x.id)+'" aria-current="'+(x.id===state.selected?.id)+'"><span class="academy-lesson-number">'+String(i+1).padStart(2,"0")+'</span><span class="academy-lesson-text"><b>'+escapeHTML(x.titulo)+'</b><small>'+escapeHTML(x.materia+" · "+x.unidade)+'</small></span>'+(done?'<span class="academy-check" title="Concluída">✓</span>':"")+'</button>';
 }).join(""):'<div class="academy-empty">Nenhuma aula com esses filtros. Experimente buscar outro termo.</div>';
 $("academy-more").hidden=all.length<=state.limit;
 summary();
}
function selectLesson(id,{scroll=false}={}){
 const lesson=visibleLessons().find(x=>x.id===id);if(!lesson)return;
 state.selected=lesson;state.mode="lesson";state.session=null;state.question=null;state.answered=false;
 try{localStorage.setItem("faaab-academia-last",lesson.id);if(state.programId)localStorage.setItem("faaab-academia-last-"+state.programId,lesson.id)}catch{}
 if(state.subject!=="Todas"&&!subjectLessons(state.subject).some(x=>x.id===lesson.id)){state.subject=state.groups.find(g=>g.ids.has(lesson.id))?.nome||lesson.materia;state.search="";$("lesson-search").value=""}
 renderList();renderReader();
 if(scroll&&window.matchMedia("(max-width:760px)").matches){$("academy-reader").scrollIntoView({behavior:"smooth",block:"start"})}
}
function nextLesson(){
 if(!state.selected)return;
 const label=state.subject==="Todas"?(state.groups.find(g=>g.ids.has(state.selected.id))?.nome||state.selected.materia):state.subject;
 const same=subjectLessons(label);
 const i=same.findIndex(x=>x.id===state.selected.id);
 const next=same[(i+1)%same.length];
 selectLesson(next.id,{scroll:false});
 $("academy-reader").scrollIntoView({behavior:"smooth",block:"start"});
}
const subjectTotals=()=>Object.fromEntries([...new Set(state.lessons.map(x=>x.materia))].map(x=>[x,state.lessons.filter(y=>y.materia===x).length]));

/* Desafios em contexto para as quatro operações: exigir duas etapas, não apenas números maiores. */
function appliedDynamic(kind){
 const q=(pergunta,result,wrongs,feedback,dica)=>{
  const values=[result,...wrongs.filter(v=>Number.isFinite(v)&&v!==result)];
  for(let n=result+4;values.length<4;n++)if(!values.includes(n))values.push(n);
  return {pergunta,alternativas:values.slice(0,4).map(String),correta:0,feedback,dica,generated:true};
 };
 if(kind==="soma"){const a=ri(150,480),b=ri(90,350),c=ri(45,200),result=a+b+c;return q("Uma equipe recebeu "+a+", "+b+" e "+c+" itens em lotes diferentes. Qual foi o total?",result,[result-b,result-c,result+10],"Some os três lotes: "+a+" + "+b+" + "+c+" = "+result+". O total deve superar qualquer parcela.","Junte dois lotes e depois acrescente o terceiro.")}
 if(kind==="subtracao"){const initial=ri(340,690),used=ri(110,210),received=ri(35,100),result=initial-used+received;return q("Um depósito tinha "+initial+" itens. Foram retirados "+used+" e repostos "+received+". Qual é o estoque atual?",result,[initial-used,result+used,result-received],initial+" − "+used+" = "+(initial-used)+"; "+(initial-used)+" + "+received+" = "+result+".","A retirada e a reposição têm sentidos opostos.")}
 if(kind==="multiplicacao"){const boxes=ri(15,35),each=ri(12,28),reserved=ri(23,61),result=boxes*each-reserved;return q("Uma remessa traz "+boxes+" caixas com "+each+" kits. Após separar "+reserved+" para vistoria, quantos kits restam?",result,[boxes*each,result+boxes,result-reserved],"Primeiro calcule "+boxes+"×"+each+" = "+boxes*each+" kits. Depois subtraia "+reserved+": "+result+".","Há uma multiplicação e uma subtração.")}
 if(kind==="divisao"){const cap=ri(7,19),full=ri(12,27),rest=ri(1,cap-1),total=full*cap+rest,result=full+1;return q("São "+total+" materiais e cada caixa comporta "+cap+". Quantas caixas precisam ser usadas?",result,[full,result+1,result+cap],total+" dividido por "+cap+" dá "+full+" caixas completas e sobra(m) "+rest+" material(is). É necessária mais uma caixa: "+result+".","A existência de resto exige mais uma caixa.")}
 return null;
}
function buildDynamic(kind,level){
 if(level==="avancado"&&["soma","subtracao","multiplicacao","divisao"].includes(kind))return appliedDynamic(kind);
 const scale={iniciante:0,intermediario:1,avancado:2}[level]??0;
 const caps=[10,50,200],max=caps[scale];
 let question,result,solution,wrong=[];
 const a=ri(1,max),b=ri(1,max);
 if(kind==="soma"){result=a+b;question="Quanto é "+a+" + "+b+"?";solution="Junte as duas parcelas: "+a+" + "+b+" = "+result+".";wrong=[result+1,result-1,result+10,result+2]}
 else if(kind==="subtracao"){const big=Math.max(a,b),small=Math.min(a,b);result=big-small;question="Quanto é "+big+" − "+small+"?";solution="Retire "+small+" de "+big+". Resultado = "+result+". Verificação: "+result+" + "+small+" = "+big+".";wrong=[result+1,result+2,result-1,result+10]}
 else if(kind==="multiplicacao"){const x=ri(2,[10,15,25][scale]),y=ri(2,[10,15,25][scale]);result=x*y;question="Quanto é "+x+" × "+y+"?";solution=x+" grupos de "+y+" têm "+result+" unidades. Multiplicar é somar grupos iguais.";wrong=[result+x,result-x,result+y,result+1]}
 else if(kind==="divisao"){const divisor=ri(2,[9,14,22][scale]),q=ri(2,[9,14,22][scale]);const dividend=divisor*q;result=q;question="Quanto é "+dividend+" ÷ "+divisor+"?";solution="Procure um número que, multiplicado por "+divisor+", produza "+dividend+". "+divisor+" × "+q+" = "+dividend+", logo o quociente é "+q+".";wrong=[q+1,q-1,q+2,q+divisor]}
 else if(kind==="porcentagem"){const pct=[10,20,25,50][ri(0,3)],base=ri(2,[10,20,50][scale])*20;result=base*pct/100;question="Quanto é "+pct+"% de "+base+"?";solution=pct+"% = "+pct+"/100. Então "+base+" × "+pct+"/100 = "+result+".";wrong=[result+base/10,result-base/10,result*2,result+10]}
 else if(kind==="equacao"){const x=ri(1,[9,18,35][scale]),coef=ri(2,[9,14,25][scale]),b0=ri(1,[10,30,70][scale]),c=coef*x+b0;result=x;question="Resolva: "+coef+"x + "+b0+" = "+c+". Qual é x?";solution="Subtraia "+b0+" dos dois lados: "+coef+"x = "+(c-b0)+". Depois divida por "+coef+": x = "+x+".";wrong=[x+1,x-1,x+2,x+coef]}
 else return null;
 const answers=[result,...wrong.filter(v=>Number.isFinite(v)&&v>=0&&v!==result)];
 const unique=[...new Set(answers)];
 while(unique.length<4){const v=result+ri(1,12);if(!unique.includes(v))unique.push(v)}
 const opts=shuffled(unique.slice(0,4));
 return {pergunta:question,alternativas:opts.map(String),correta:opts.findIndex(v=>v===result),feedback:solution,generated:true};
}

function shuffleQuestion(q){if(!q||!Array.isArray(q.alternativas)||q.alternativas.length!==4||!Number.isInteger(q.correta)||q.correta<0||q.correta>3)return null;const a=shuffled(q.alternativas.map((text,original)=>({text:String(text),original})));return {...q,alternativas:a.map(x=>x.text),correta:a.findIndex(x=>x.original===q.correta)}}
function makeQuestion(lesson){if(!lesson)return null;const levelQuestions=state.aprofundados[lesson.id]?.questoesPorNivel?.[state.level];let q;
if(state.level!=="iniciante"&&Array.isArray(levelQuestions)&&levelQuestions.length)q=levelQuestions[ri(0,levelQuestions.length-1)];
else if(lesson.gerador)q=buildDynamic(lesson.gerador,state.level);
else {const list=lesson.questoes||[];q=list[ri(0,list.length-1)]||null}
return shuffleQuestion(q)}

function quizMarkup(q,{session=false}={}){
 if(!q)return '<p class="lesson-notice">A prática desta aula está sendo organizada.</p>';
 const answers=q.alternativas.map((text,i)=>'<button type="button" class="lesson-option" data-answer="'+i+'" '+(state.answered?"disabled":"")+'>'+escapeHTML(String.fromCharCode(65+i)+") "+text)+'</button>').join("");
 return '<div class="lesson-quiz" id="lesson-quiz"><div class="lesson-quiz-header"><strong>'+(session?"Questão "+(state.session.index+1)+" de "+state.session.questions.length:"Agora é sua vez")+'</strong><span class="tag">Escolha uma resposta</span></div><h4>'+escapeHTML(q.pergunta)+'</h4><div class="lesson-options">'+answers+'</div><div class="lesson-hint-control"><button class="btn outline" type="button" data-show-hint>Ver uma dica</button><p class="lesson-hint" id="lesson-hint" hidden>'+escapeHTML(q.dica||"Identifique os dados, decida o método e resolva sem olhar as alternativas.")+'</p></div><div id="lesson-feedback" class="lesson-feedback" role="status" aria-live="polite" hidden></div></div>';
}
function practiceExam(subject){
 const included=subjectLessons(subject);const set=shuffled(included.filter(x=>x.questoes?.length)).slice(0,Math.min(10,included.length));
 if(!set.length)return;
 state.mode="session";state.session={subject,questions:set.map(l=>({lesson:l,question:makeQuestion(l)})),index:0,score:0,answered:false};
 state.answered=false;state.question=state.session.questions[0].question;
 renderSession();
 $("academy-reader").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderSession(){
 const ses=state.session;if(!ses)return;
 const total=ses.questions.length;
 if(ses.index>=total){
  $("academy-reader").innerHTML='<div class="lesson-eyebrow"><span>Revisão concluída</span><span>'+escapeHTML(ses.subject)+'</span></div><h3>Você acertou '+ses.score+' de '+total+'</h3><div class="lesson-progressline"><span style="width:'+Math.round(100*ses.score/total)+'%"></span></div><p class="lesson-text">Revise as questões em que errou e retome os assuntos com mais dificuldade. Esta revisão não é prova oficial nem concede patente.</p><div class="lesson-navigation"><button class="btn primary" type="button" data-session-restart>Treinar novamente</button><button class="btn outline" type="button" data-session-exit>Voltar às aulas</button></div>';
  renderList();return;
 }
 const q=ses.questions[ses.index],item=q.lesson;state.question=q.question;state.answered=false;
 $("academy-reader").innerHTML='<div class="lesson-eyebrow"><span>Revisão da matéria · '+escapeHTML(ses.subject)+'</span><span>Acertos: '+ses.score+'</span></div><h3>'+escapeHTML(item.titulo)+'</h3><div class="lesson-progressline"><span style="width:'+Math.round(100*ses.index/total)+'%"></span></div>'+quizMarkup(q.question,{session:true})+'<div class="lesson-navigation"><button type="button" class="btn outline" data-session-exit>Sair da revisão</button><button type="button" class="btn primary" id="lesson-next-question" data-session-next hidden>Próxima questão</button></div>';
}
function renderReader(){
 const lesson=state.selected;if(!lesson){$("academy-reader").innerHTML='<div class="study-start"><h3>Comece por uma matéria</h3><p>Selecione uma das aulas à esquerda.</p></div>';return}
 const label=state.subject==="Todas"?(state.groups.find(g=>g.ids.has(lesson.id))?.nome||lesson.materia):state.subject;
 const included=subjectLessons(label);const total=included.length;
 const done=included.filter(x=>state.progress.done[doneKey(x.id)]).length;
 const deep=state.aprofundados[lesson.id]||null;
 const generated=!!lesson.gerador;
 const hasLevels=generated||!!deep?.questoesPorNivel;
 state.question=makeQuestion(lesson);state.answered=false;
 const theory=escapeHTML(lesson.teoria).replace(/\n/g,"</p><p class=\"lesson-text\">");
 const steps=(lesson.passos||[]).map(x=>'<li>'+escapeHTML(x)+'</li>').join("");
 const d="<div class='lesson-progressline'><span style='width:"+Math.round(100*done/total)+"%'></span></div>";
 const level=hasLevels?'<label class="lesson-level">Dificuldade <select id="lesson-difficulty"><option value="iniciante" '+(state.level==="iniciante"?"selected":"")+'>Fundamentos</option><option value="intermediario" '+(state.level==="intermediario"?"selected":"")+'>Intermediário</option><option value="avancado" '+(state.level==="avancado"?"selected":"")+'>Avançado</option></select></label>':"";
 const deepMarkup=deep?'<section class="lesson-deep"><h4>Por que funciona</h4><p>'+escapeHTML(deep.porque)+'</p><h4>Erro comum</h4><p>'+escapeHTML(deep.armadilha)+'</p><h4>Como conferir</h4><p>'+escapeHTML(deep.verificacao)+'</p></section>':'<section class="lesson-deep"><h4>Explique seu raciocínio</h4><p>Refaça o exemplo sem olhar a resposta. Diga por que escolheu cada operação e confira o resultado.</p></section>';

 $("academy-reader").innerHTML='<div class="lesson-eyebrow"><span>'+escapeHTML(label+" / "+lesson.unidade)+'</span><span>'+(state.progress.done[doneKey(lesson.id)]?"✓ Aula concluída":"Aula prática")+'</span></div><h3>'+escapeHTML(lesson.titulo)+'</h3>'+d+'<div class="lesson-stats">'+done+' de '+total+' aulas concluídas nesta matéria</div><h4>Entenda a matéria</h4><p class="lesson-text">'+theory+'</p><h4>Aprenda passo a passo</h4><ol class="lesson-steps">'+steps+'</ol><div class="lesson-example"><strong>Exemplo resolvido</strong><p>'+escapeHTML(lesson.exemplo)+'</p><div class="lesson-solution">'+escapeHTML(lesson.resolucao)+'</div></div>'+deepMarkup+'<div class="lesson-navigation">'+level+'<button type="button" class="btn outline" data-session-start="'+escapeHTML(lesson.materia)+'">Revisão com questões da matéria</button></div>'+quizMarkup(state.question)+'<div class="lesson-navigation">'+(generated?'<button class="btn primary" data-new-exercise type="button">Novo exercício</button>':'<button class="btn outline" data-retry-exercise type="button">Tentar de novo</button>')+'<button class="btn primary" data-next-lesson type="button">Próxima aula</button></div><p class="lesson-notice">Aulas autorais de estudo. Conteúdo e exercícios não são o edital de concurso nem aprovação automática da FAAAB. Os resultados ficam apenas neste navegador.</p>';
}
function respond(index){
 if(state.answered||!state.question)return;
 const q=state.question,correct=index===q.correta;
 state.answered=true;
 const lesson=state.mode==="session"?state.session.questions[state.session.index].lesson:state.selected;
 record(lesson,correct);
 const choices=$("academy-reader").querySelectorAll("[data-answer]");
 choices.forEach(b=>{const i=Number(b.dataset.answer);b.disabled=true;b.classList.toggle("correct",i===q.correta);b.classList.toggle("wrong",i===index&&!correct)});
 const result=$("lesson-feedback");if(result){result.hidden=false;result.classList.toggle("error",!correct);result.innerHTML='<strong>'+(correct?"✓ Resposta correta.":"✗ Vamos corrigir. Alternativa correta: "+String.fromCharCode(65+q.correta)+".")+'</strong><h5>Raciocínio da resolução</h5><p>'+escapeHTML(q.feedback||"Revise o exemplo resolvido antes de tentar novamente.")+'</p><p class="lesson-error-note">'+(correct?"Agora justifique as etapas sem consultar a solução.":"Compare seu caminho com o correto e refaça o exercício antes de avançar.")+'</p>'}
 if(state.mode==="session"){if(correct)state.session.score++;state.session.answered=true;$("lesson-next-question").hidden=false;$("lesson-next-question").textContent=state.session.index+1===state.session.questions.length?"Ver resultado da revisão":"Próxima questão"}
 else {renderList();const caption=$("academy-reader").querySelector(".lesson-eyebrow span:last-child");if(caption&&correct)caption.textContent="✓ Aula concluída"}
}
function openFromProgram(subject,topic){
 const key=norm(subject),q=norm(topic);
 const map=[["mat","Matemática"],["port","Português"],["lingua","Português"],["geo","Geografia"],["hist","História"],["fis","Física"],["quim","Química"],["cien","Ciências"],["ingles","Inglês"],["racio","Raciocínio lógico"]];
 const target=map.find(([k])=>key.includes(k))?.[1]||"Todas";
 state.subject=target;state.search="";$("lesson-search").value="";
 const eligible=visibleLessons().filter(x=>target==="Todas"||x.materia===target);
 const keywords=norm(topic).split(/\s+/).filter(w=>w.length>=2&&!["de","da","do","dos","das","em","no","na","os","as","um","uma","e"].includes(w));
 const scores=eligible.map(l=>({lesson:l,score:keywords.reduce((n,w)=>n+(norm(l.titulo).includes(w)?5:norm(l.teoria).includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score);
 const candidate=scores[0]?.score? scores[0].lesson:eligible[0];
 if(candidate){selectLesson(candidate.id);$("academia").scrollIntoView({behavior:"smooth",block:"start"})}
}
function events(){
 $("lesson-search").addEventListener("input",e=>{state.search=e.target.value;state.limit=25;renderList()});
 $("lesson-reset-search").addEventListener("click",()=>{state.search="";$("lesson-search").value="";state.limit=25;renderList();$("lesson-search").focus()});
 $("lesson-subjects").addEventListener("click",e=>{const btn=e.target.closest("[data-subject]");if(!btn)return;state.subject=btn.dataset.subject;state.search="";$("lesson-search").value="";state.limit=25;renderList();const lesson=filtered()[0];if(lesson)selectLesson(lesson.id);else{state.selected=null;renderReader()}});
 $("academy-lessons").addEventListener("click",e=>{const btn=e.target.closest("[data-lesson]");if(btn)selectLesson(btn.dataset.lesson,{scroll:true})});
 $("academy-more").addEventListener("click",()=>{state.limit+=25;renderList()});
 $("academy-reader").addEventListener("click",e=>{
  const btn=e.target.closest("button");if(!btn)return;
  if(btn.hasAttribute("data-answer"))respond(Number(btn.dataset.answer));
  else if(btn.hasAttribute("data-new-exercise")){state.question=makeQuestion(state.selected);state.answered=false;renderQuestionOnly()}
  else if(btn.hasAttribute("data-retry-exercise")){state.question=makeQuestion(state.selected);state.answered=false;renderQuestionOnly()}
  else if(btn.hasAttribute("data-show-hint")){const h=$("lesson-hint");if(h){h.hidden=false;btn.hidden=true}}
  else if(btn.hasAttribute("data-next-lesson"))nextLesson();
  else if(btn.hasAttribute("data-session-start"))practiceExam(btn.dataset.sessionStart);
  else if(btn.hasAttribute("data-session-next")){state.session.index++;state.session.answered=false;renderSession()}
  else if(btn.hasAttribute("data-session-exit")){state.mode="lesson";state.session=null;renderReader()}
  else if(btn.hasAttribute("data-session-restart"))practiceExam(state.session.subject);
 });
 $("academy-reader").addEventListener("change",e=>{if(e.target.id==="lesson-difficulty"){state.level=e.target.value;state.question=makeQuestion(state.selected);state.answered=false;renderQuestionOnly()}});
}
function renderQuestionOnly(){
 const existing=$("lesson-quiz");if(!existing)return;
 const container=document.createElement("div");container.innerHTML=quizMarkup(state.question);
 existing.replaceWith(container.firstElementChild);
}
async function boot(){
 if(!$("academia"))return;
 loadProgress();events();
 try{
  const urls=["dados/aulas_matematica.json","dados/aulas_linguagens_humanas.json","dados/aulas_ciencias_exatas.json","dados/desafios_academia.json"];
  const responses=await Promise.all(urls.map(u=>fetch(u)));
  if(responses.some(r=>!r.ok))throw Error("Um arquivo de aula não foi encontrado");
  const data=await Promise.all(responses.map(r=>r.json()));
  const lessons=data.slice(0,3).flatMap(x=>x.aulas||[]);
  state.aprofundados=data[3].aulas||{};
  const ids=new Set();
  for(const lesson of lessons){if(!lesson.id||ids.has(lesson.id)||!lesson.materia||!lesson.titulo||!lesson.teoria||!lesson.resolucao||!lesson.questoes?.[0])throw Error("Aula incompleta: "+lesson.id);ids.add(lesson.id)}
  state.lessons=lessons;state.ready=true;summary();
  const last=(()=>{try{return localStorage.getItem("faaab-academia-last")}catch{return null}})();
  state.selected=null;state.subject="Todas";
  $("academy-reader").innerHTML='<div class="study-start"><h3>Escolha uma prova primeiro</h3><p>O estudo será montado conforme o programa dessa seleção.</p></div>';
  document.dispatchEvent(new CustomEvent("faaab:lessons-ready",{detail:{total:lessons.length}}));
 }catch(err){
  $("academy-lessons").innerHTML='<div class="academy-empty"><b>Não foi possível carregar as aulas.</b>'+escapeHTML(err.message)+'. Atualize a página e tente novamente.</div>';
  $("academy-total").textContent="Indisponível";
 }
}
window.FAAABLessons={openFromProgram,setProgram,focusGroup,isReady:()=>state.ready,selectLesson:(id)=>{if(state.ready)selectLesson(id,{scroll:true})},getCount:()=>visibleLessons().length};
document.addEventListener("DOMContentLoaded",boot);
})();